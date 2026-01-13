# GitHub Actions 워크플로우 가이드

## 개요

이 문서는 QA 자동화 대시보드에서 사용하는 GitHub Actions 워크플로우의 구조와 동작 방식을 설명합니다. 워크플로우는 웹사이트의 성능, 반응형 호환성, UX 품질, 기능 테스트를 자동으로 실행합니다.

## 워크플로우 파일 위치

```
.github/workflows/qa-tests.yml
```

## 워크플로우 구조

### 1. 트리거 설정 (Trigger)

워크플로우는 `workflow_dispatch` 이벤트로 수동 트리거됩니다. 대시보드의 API가 GitHub REST API를 호출하여 이 워크플로우를 시작합니다.

**입력 파라미터:**
- `target_url`: 테스트할 웹사이트 URL
- `tests`: 쉼표로 구분된 테스트 유형 (performance, responsive, ux, tc)

### 2. 작업 단계 (Job Steps)

#### Step 1: 저장소 체크아웃
```yaml
- name: Checkout repository
  uses: actions/checkout@v4
```
현재 저장소의 코드를 워크플로우 실행 환경에 복사합니다.

#### Step 2: Node.js 설정
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
```
Node.js 18 버전을 설치하고 npm 캐시를 활성화하여 의존성 설치 속도를 높입니다.

#### Step 3: 의존성 설치
```yaml
- name: Install dependencies
  run: npm ci
```
프로젝트의 모든 npm 의존성을 설치합니다.

#### Step 4: Playwright 설정
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps
```
브라우저 자동화 테스트를 위해 Playwright와 필요한 브라우저를 설치합니다.

#### Step 5-8: 테스트 실행

각 테스트 유형은 조건부로 실행됩니다. 사용자가 선택한 테스트만 실행되도록 `if` 조건을 사용합니다.

**성능 테스트 (Lighthouse):**
```yaml
if: contains(github.event.inputs.tests, 'performance')
run: |
  npm install -g lighthouse
  lighthouse ${{ github.event.inputs.target_url }} --output=json --output-path=./lighthouse-report.json
  lighthouse ${{ github.event.inputs.target_url }} --output=html --output-path=./lighthouse-report.html
```
- Lighthouse를 전역으로 설치
- JSON 형식의 상세 리포트 생성
- HTML 형식의 시각화 리포트 생성

**반응형 테스트 (Responsive Screenshots):**
```yaml
if: contains(github.event.inputs.tests, 'responsive')
run: |
  # Playwright를 사용하여 다양한 뷰포트에서 스크린샷 캡처
  # Desktop: 1920x1080
  # Tablet: 768x1024
  # Mobile: 375x667
```

**UX 리뷰 (AI UX Analysis):**
```yaml
if: contains(github.event.inputs.tests, 'ux')
run: |
  # 페이지 접근성, 대비율, 레이아웃 일관성 분석
  # JSON 형식의 분석 결과 생성
```

**기능 테스트 (Test Cases):**
```yaml
if: contains(github.event.inputs.tests, 'tc')
run: |
  # 주요 기능(로그인, 검색, 결제 등) 테스트
  # 통과/실패 결과 및 성공률 계산
```

#### Step 9-12: 결과 업로드

각 테스트 결과는 GitHub Actions Artifacts로 업로드됩니다. 이를 통해 대시보드에서 결과에 접근할 수 있습니다.

```yaml
- name: Upload Lighthouse Report
  uses: actions/upload-artifact@v4
  with:
    name: lighthouse-report
    path: |
      lighthouse-report.json
      lighthouse-report.html
```

#### Step 13: 요약 생성

워크플로우 완료 후 GitHub Actions 요약 페이지에 결과를 표시합니다.

```yaml
- name: Create Summary
  run: |
    echo "## QA Test Results" >> $GITHUB_STEP_SUMMARY
    echo "**Target URL:** ${{ github.event.inputs.target_url }}" >> $GITHUB_STEP_SUMMARY
    echo "**Tests:** ${{ github.event.inputs.tests }}" >> $GITHUB_STEP_SUMMARY
    echo "**Status:** ✅ Completed" >> $GITHUB_STEP_SUMMARY
```

## 환경 변수 설정

워크플로우가 정상 작동하려면 다음 환경 변수가 필요합니다:

| 변수명 | 설명 | 설정 위치 |
| --- | --- | --- |
| `GITHUB_TOKEN` | GitHub API 인증 토큰 | GitHub Actions 자동 제공 |
| `GITHUB_REPO_OWNER` | 저장소 소유자 | 백엔드 환경 변수 |
| `GITHUB_REPO_NAME` | 저장소 이름 | 백엔드 환경 변수 |
| `GITHUB_WORKFLOW_ID` | 워크플로우 ID | 백엔드 환경 변수 |

## API 연동 흐름

```
사용자 입력
    ↓
대시보드 UI (POST /api/run-test)
    ↓
백엔드 API 라우트
    ↓
GitHub REST API (workflow_dispatch)
    ↓
GitHub Actions 워크플로우 실행
    ↓
테스트 결과 생성 및 Artifacts 업로드
    ↓
대시보드 UI (GET /api/test-status/:runId)
    ↓
상태 Polling 및 결과 표시
```

## 결과 해석

### Lighthouse 성능 점수
- 90-100: 우수
- 50-89: 개선 필요
- 0-49: 심각한 문제

### 반응형 테스트
- 각 뷰포트에서의 스크린샷 제공
- 레이아웃 깨짐 여부 시각적 확인

### UX 리뷰
- 접근성 점수
- 색상 대비율
- 레이아웃 일관성

### 기능 테스트
- 통과/실패 수
- 성공률 계산
- 실패한 기능 상세 정보

## 문제 해결

### 워크플로우 실행 실패
1. GitHub Actions 탭에서 실행 로그 확인
2. 에러 메시지 검토
3. 필요한 환경 변수 설정 확인

### 결과 업로드 실패
1. Artifacts 저장 경로 확인
2. 디스크 공간 확인
3. 파일 권한 확인

### 타임아웃
- 워크플로우 타임아웃: 30분 (조정 가능)
- 각 테스트 단계별 로그 확인
- 병렬 실행 고려

## 커스터마이징

워크플로우를 프로젝트에 맞게 수정할 수 있습니다:

1. **테스트 추가**: 새로운 테스트 단계 추가
2. **타임아웃 조정**: `timeout-minutes` 값 변경
3. **브라우저 버전**: Playwright 버전 업데이트
4. **결과 형식**: Artifacts 저장 형식 변경

## 참고 자료

- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [Lighthouse CI 가이드](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright 문서](https://playwright.dev/)
