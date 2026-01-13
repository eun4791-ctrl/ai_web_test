# API 라우트 가이드

## 개요

QA 자동화 대시보드의 백엔드 API는 GitHub Actions 워크플로우를 트리거하고 실행 상태를 모니터링하는 두 가지 주요 엔드포인트를 제공합니다.

## API 엔드포인트

### 1. 테스트 실행 트리거

**엔드포인트:** `POST /api/run-test`

**설명:** GitHub Actions 워크플로우를 트리거하여 QA 테스트를 시작합니다.

**요청 본문:**
```json
{
  "targetUrl": "https://example.com",
  "tests": ["performance", "responsive", "ux", "tc"]
}
```

**요청 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `targetUrl` | string | ✅ | 테스트할 웹사이트의 URL (https:// 포함) |
| `tests` | array | ✅ | 실행할 테스트 유형 배열 |

**테스트 유형:**
- `performance`: Lighthouse 성능 분석
- `responsive`: 반응형 화면 캡처
- `ux`: AI UX 리뷰
- `tc`: 기능 테스트 케이스

**응답 (성공 - 200):**
```json
{
  "success": true,
  "runId": "1234567890",
  "message": "테스트가 시작되었습니다."
}
```

**응답 (실패 - 400/500):**
```json
{
  "error": "오류 메시지"
}
```

**에러 코드:**

| 코드 | 설명 |
| --- | --- |
| 400 | 필수 파라미터 누락 또는 유효하지 않은 URL |
| 500 | 서버 오류 또는 GitHub API 호출 실패 |

**사용 예시:**
```javascript
const response = await fetch('/api/run-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetUrl: 'https://example.com',
    tests: ['performance', 'responsive']
  })
});

const data = await response.json();
console.log('Run ID:', data.runId);
```

---

### 2. 테스트 상태 조회

**엔드포인트:** `GET /api/test-status/:runId`

**설명:** GitHub Actions 워크플로우의 실행 상태와 테스트 결과를 조회합니다.

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| `runId` | string | GitHub Actions 실행 ID |

**응답 (성공 - 200):**
```json
{
  "status": "completed",
  "conclusion": "success",
  "results": {
    "performance": {
      "status": "completed",
      "summary": "Lighthouse 점수: 82점 (개선 필요: 3건)",
      "details": "• 성능: 85점\n• 접근성: 90점\n• SEO: 100점",
      "link": "https://github.com/..."
    },
    "responsive": {
      "status": "completed",
      "summary": "데스크톱 / 태블릿 / 모바일 캡처 완료",
      "details": "• 데스크톱: 1920x1080\n• 태블릿: 768x1024\n• 모바일: 375x667",
      "link": "https://github.com/..."
    },
    "ux": {
      "status": "completed",
      "summary": "AI UX 리뷰 완료",
      "details": "• CTA 가시성 낮음\n• 폰트 대비 부족\n• 레이아웃 일관성 우수",
      "link": "https://github.com/..."
    },
    "tc": {
      "status": "completed",
      "summary": "테스트 케이스: 통과 12건, 실패 1건 (성공률: 92%)",
      "details": "• 로그인 기능: 통과\n• 검색 기능: 통과\n• 결제 기능: 실패",
      "link": "https://github.com/..."
    }
  },
  "runUrl": "https://github.com/owner/repo/actions/runs/1234567890"
}
```

**상태 값:**

| 상태 | 설명 |
| --- | --- |
| `running` | 워크플로우 실행 중 |
| `completed` | 워크플로우 완료 |
| `failed` | 워크플로우 실패 |

**결론 값:**

| 결론 | 설명 |
| --- | --- |
| `success` | 모든 테스트 성공 |
| `failure` | 일부 또는 전체 테스트 실패 |
| `neutral` | 워크플로우 취소됨 |
| `cancelled` | 사용자가 취소함 |

**사용 예시:**
```javascript
const runId = '1234567890';
const response = await fetch(`/api/test-status/${runId}`);
const data = await response.json();

if (data.status === 'completed') {
  console.log('테스트 완료:', data.results);
} else {
  console.log('테스트 진행 중...');
}
```

---

## 환경 변수 설정

API가 정상 작동하려면 다음 환경 변수를 설정해야 합니다:

```bash
# GitHub API 인증
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 저장소 정보
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=qa-automation
GITHUB_WORKFLOW_ID=qa-tests.yml
```

**환경 변수 설명:**

| 변수 | 설명 | 획득 방법 |
| --- | --- | --- |
| `GITHUB_TOKEN` | GitHub 개인 액세스 토큰 | GitHub Settings → Developer settings → Personal access tokens |
| `GITHUB_REPO_OWNER` | 저장소 소유자 | GitHub 저장소 URL에서 확인 |
| `GITHUB_REPO_NAME` | 저장소 이름 | GitHub 저장소 URL에서 확인 |
| `GITHUB_WORKFLOW_ID` | 워크플로우 파일명 또는 ID | `.github/workflows/` 디렉토리 확인 |

---

## 폴링 전략

프론트엔드는 테스트 상태를 주기적으로 폴링하여 사용자에게 실시간 진행 상황을 제공합니다.

**권장 폴링 설정:**
- **폴링 간격**: 5초
- **최대 시도 횟수**: 60회 (약 5분)
- **타임아웃**: 5분 초과 시 실패 처리

**폴링 구현 예시:**
```javascript
const pollTestStatus = async (runId) => {
  const maxAttempts = 60;
  let attempts = 0;

  const poll = async () => {
    try {
      const response = await fetch(`/api/test-status/${runId}`);
      const data = await response.json();

      // 결과 업데이트
      updateResults(data.results);

      // 완료 확인
      if (data.status === 'completed' || data.status === 'failed') {
        setStatus(data.status);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 5000); // 5초 후 재시도
      } else {
        setError('테스트 실행 시간 초과');
      }
    } catch (error) {
      setError('상태 조회 중 오류 발생');
    }
  };

  poll();
};
```

---

## 에러 처리

### 일반적인 에러 시나리오

**1. URL 유효성 검증 실패**
```json
{
  "error": "유효한 URL 형식이 아닙니다. (예: https://example.com)"
}
```

**2. 테스트 선택 없음**
```json
{
  "error": "최소 1개 이상의 테스트를 선택해주세요."
}
```

**3. GitHub API 인증 실패**
```json
{
  "error": "GitHub 토큰이 설정되지 않았습니다."
}
```

**4. 워크플로우 트리거 실패**
```json
{
  "error": "워크플로우 트리거 실패"
}
```

### 에러 처리 모범 사례

```javascript
try {
  const response = await fetch('/api/run-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl, tests })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '알 수 없는 오류 발생');
  }

  const data = await response.json();
  return data.runId;
} catch (error) {
  console.error('API Error:', error.message);
  // 사용자에게 오류 메시지 표시
  showErrorToast(error.message);
}
```

---

## 성능 최적화

### 캐싱 전략
- 결과는 실시간으로 업데이트되므로 캐싱하지 않음
- 상태 폴링 간격을 조정하여 서버 부하 최소화

### 동시 요청 제한
- 사용자당 동시 테스트 1개로 제한 권장
- 대량 테스트 요청 시 큐 시스템 구현 고려

### 타임아웃 설정
- API 요청 타임아웃: 30초
- GitHub Actions 워크플로우 타임아웃: 30분

---

## 보안 고려사항

### 입력 검증
- URL은 `https://` 또는 `http://` 프로토콜만 허용
- 테스트 유형은 사전 정의된 목록에서만 선택 가능
- 악의적인 입력 방지를 위해 입력값 새니타이제이션 필수

### 토큰 관리
- GitHub 토큰은 환경 변수로만 관리
- 토큰을 소스 코드에 포함하지 않음
- 토큰 권한은 최소 필요 범위로 제한

### CORS 설정
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## 테스트

### API 테스트 예시

**cURL을 사용한 테스트:**
```bash
# 테스트 실행
curl -X POST http://localhost:3000/api/run-test \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://example.com",
    "tests": ["performance", "responsive"]
  }'

# 상태 조회
curl http://localhost:3000/api/test-status/1234567890
```

**JavaScript를 사용한 테스트:**
```javascript
// test-api.js
async function testAPI() {
  // 1. 테스트 실행
  const runResponse = await fetch('/api/run-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetUrl: 'https://example.com',
      tests: ['performance']
    })
  });

  const { runId } = await runResponse.json();
  console.log('Run ID:', runId);

  // 2. 상태 조회
  const statusResponse = await fetch(`/api/test-status/${runId}`);
  const status = await statusResponse.json();
  console.log('Status:', status);
}

testAPI();
```

---

## 참고 자료

- [GitHub REST API 문서](https://docs.github.com/en/rest)
- [GitHub Actions API](https://docs.github.com/en/rest/actions)
- [Express.js 가이드](https://expressjs.com/)
