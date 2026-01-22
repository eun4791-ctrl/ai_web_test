# QA 자동화 대시보드 (Local Execution Version)

![QA Automation Dashboard](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

비개발자 친화적인 웹사이트 품질 검증 도구입니다. **로컬 컴퓨터**에서 직접 Playwright와 Lighthouse를 실행하여 성능, 반응형 호환성, 기능 테스트를 수행하고 결과를 확인합니다.

---

## 🎯 주요 기능

### Lighthouse 성능 분석
웹사이트의 성능, 접근성, SEO, 모범 사례를 로컬 환경에서 즉시 분석합니다.

### 반응형 화면 호환성 테스트 (Real Device Emulation)
데스크톱뿐만 아니라 **태블릿(iPad)*과 **모바일(iPhone)** 환경을 에뮬레이션하여 실제와 유사한 뷰포트 및 User-Agent 환경에서 스크린샷을 촬영합니다.

### 기능 테스트 케이스 (TC) & 비디오 녹화
주요 기능(스크롤, 클릭 등)의 정상 작동 여부를 자동 테스트하고, **브라우저 실행 과정 전체를 비디오로 녹화**하여 제공합니다.

---

## 🚀 빠른 시작

### 사전 요구사항

- **Node.js 18** 이상
- **pnpm** (권장) 또는 npm

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/eun4791-ctrl/ai_web_test.git
cd ai_web_test

# 2. 의존성 설치
pnpm install

# 3. Playwright 브라우저 설치 (필수)
# 로컬 테스트를 위한 브라우저 바이너리를 다운로드합니다.
npx playwright install --with-deps

# 4. 개발 서버 시작
pnpm dev
# 브라우저에서 http://localhost:3000 접속
```

---

## 🔧 환경 변수 설정

로컬 테스트 실행 모드에서는 복잡한 API 키 설정이 필요하지 않습니다.

```bash
# .env (선택 사항)
NODE_ENV=development
PORT=3000

# (선택) 데이터베이스 기능 사용 시
# DATABASE_URL=mysql://user:password@localhost:3306/qa_db
```

---

## 📖 사용 방법

### 1. 테스트 URL 입력
대시보드 상단에 테스트할 웹사이트 URL을 입력합니다. (예: `https://example.com`)

### 2. 테스트 항목 선택
원하는 테스트 항목을 체크박스로 선택합니다:
- **Lighthouse 성능 확인**: 페이지 로딩 속도 및 SEO 점수 측정
- **Responsive Viewer**: PC/태블릿/모바일 3종 기기 렌더링 확인
- **시나리오 작성 및 수행 (TC)**: 자동화된 기능 테스트 수행 (브라우저가 열려서 동작함)

### 3. 테스트 실행
"테스트 실행" 버튼을 클릭합니다.
- 서버가 백그라운드에서 브라우저를 띄워 테스트를 진행합니다.
- 진행 상황이 실시간으로 로그 창(서버 터미널)에 표시됩니다.

### 4. 결과 확인
테스트가 완료되면 자동으로 결과 카드가 업데이트됩니다.
- **성능 점수**: 원형 차트로 점수 확인
- **스크린샷**: 탭을 눌러 각 기기별 스크린샷 확인
- **TC 결과**: Pass/Fail 여부 확인 및 **녹화된 비디오 재생** 가능

---

## 📋 기술 스택

### 프론트엔드
- **React 19**, **Tailwind CSS 4**
- **tRPC Client**: 서버 통신
- **shadcn/ui**: 모던 UI 컴포넌트

### 백엔드 (로컬 서버)
- **Express.js**: 웹 서버
- **tRPC Server**: API 엔드포인트
- **Playwright**: 브라우저 제어 및 테스트 실행
- **Lighthouse**: 성능 리포트 생성

---

## 📁 결과 파일 위치

테스트 수행 결과는 프로젝트 폴더 내 다음 위치에 로컬 파일로 저장됩니다:
- `reports/lighthouse-report.json`: Lighthouse 분석 결과
- `reports/tc-report.json`: TC 수행 결과
- `screenshots/`: 데스크톱, 태블릿, 모바일 스크린샷 이미지
- `videos/`: 테스트 수행 영상 (webm)

---

## 💬 문제 해결

**Q. "테스트 실행"을 눌렀는데 반응이 없어요.**
A. 터미널 로그를 확인해 주세요. `npx playwright install`이 선행되지 않았거나, 브라우저 실행 권한 문제가 있을 수 있습니다.

**Q. 모바일 스크린샷이 PC 화면을 줄인 것처럼 나와요.**
A. 최신 버전 스크립트는 User-Agent와 Viewport 설정을 통해 모바일 환경을 에뮬레이션합니다. 코드가 최신인지 확인해 주세요.
