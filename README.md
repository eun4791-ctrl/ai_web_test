# QA 자동화 대시보드

![QA Automation Dashboard](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

비개발자 친화적인 웹사이트 품질 검증 도구입니다. 성능, 반응형 호환성, 기능 테스트를 자동으로 실행하고 결과를 시각화합니다.

---

## 🎯 주요 기능

### Lighthouse 성능 분석
웹사이트의 성능, 접근성, SEO, 모범 사례를 자동 분석합니다.

### 반응형 화면 호환성 테스트
데스크톱, 태블릿, 모바일 화면에서의 표시 상태를 확인합니다.

### 기능 테스트 케이스 (TC)
로그인, 검색, 결제 등 주요 기능의 정상 작동을 자동 확인하고 **비디오 녹화**로 테스트 과정을 기록합니다.

---

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18 이상
- pnpm 또는 npm
- GitHub 계정 및 개인 액세스 토큰 (PAT)

### 설치

```bash
# 저장소 클론
git clone https://github.com/eun4791-ctrl/ai_web_test.git
cd ai_web_test

# 의존성 설치
pnpm install

# 환경 변수 설정
# VITE_GITHUB_TOKEN을 .env 파일에 설정
echo "VITE_GITHUB_TOKEN=your_github_token" > .env.local

# 개발 서버 시작
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

### 프로덕션 빌드

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 시작
pnpm start
```

---

## 📋 기술 스택

### 프론트엔드
- **React 19**: UI 프레임워크
- **Tailwind CSS 4**: 스타일링
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘
- **JSZip**: artifact 파일 처리

### 백엔드
- **Express.js**: 웹 서버
- **tRPC**: 타입 안전 API
- **Drizzle ORM**: 데이터베이스 관리

### CI/CD & 자동화
- **GitHub Actions**: 자동화 테스트 실행
- **Lighthouse**: 성능 분석
- **Playwright**: 브라우저 자동화 및 비디오 녹화

---

## 📁 프로젝트 구조

```
ai_web_test/
├── client/                          # 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx            # 메인 대시보드
│   │   ├── components/             # UI 컴포넌트
│   │   ├── lib/
│   │   │   └── trpc.ts             # tRPC 클라이언트
│   │   ├── App.tsx                 # 라우팅
│   │   ├── main.tsx                # 진입점
│   │   └── index.css               # 글로벌 스타일
│   ├── public/                     # 정적 자산
│   └── index.html                  # HTML 템플릿
├── server/                          # 백엔드
│   ├── _core/                      # 핵심 인프라
│   ├── routers.ts                  # tRPC 라우터
│   ├── db.ts                       # 데이터베이스 헬퍼
│   └── index.ts                    # 서버 진입점
├── drizzle/                        # 데이터베이스
│   ├── schema.ts                   # 스키마 정의
│   └── migrations/                 # 마이그레이션
├── .github/
│   └── workflows/
│       └── qa-tests.yml            # GitHub Actions 워크플로우
├── package.json                    # 의존성 정의
├── tsconfig.json                   # TypeScript 설정
├── tailwind.config.js              # Tailwind 설정
├── vite.config.ts                  # Vite 설정
└── README.md                       # 이 파일
```

---

## 🔧 환경 변수 설정

### 필수 환경 변수

```bash
# GitHub API 인증 (필수)
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 선택 환경 변수

```bash
# 서버 설정
NODE_ENV=development
PORT=3000

# 데이터베이스
DATABASE_URL=mysql://user:password@localhost:3306/qa_db
```

### 환경 변수 파일 생성

```bash
# .env.local (개발 환경)
echo "VITE_GITHUB_TOKEN=your_token" > .env.local
```

---

## 📖 사용 방법

### 1. 테스트 URL 입력
테스트할 웹사이트 URL을 입력합니다. (예: `https://example.com`)

### 2. 테스트 항목 선택
다음 중 원하는 테스트를 선택합니다:
- **Lighthouse**: 성능, 접근성, SEO 분석
- **Responsive**: 반응형 화면 호환성 (데스크톱, 태블릿, 모바일)
- **TC (Test Cases)**: 기능 테스트 케이스 실행

### 3. 테스트 실행
"테스트 실행" 버튼을 클릭하면 GitHub Actions 워크플로우가 자동으로 실행됩니다.

### 4. 결과 확인
테스트 완료 후 다음 결과를 확인할 수 있습니다:

#### Lighthouse 결과
- 성능 (Performance)
- 접근성 (Accessibility)
- 모범 사례 (Best Practices)
- SEO

#### 반응형 테스트 결과
- 데스크톱 (1920x1080)
- 태블릿 (768x1024)
- 모바일 (375x667)

#### TC 테스트 결과
- 테스트 케이스별 Pass/Fail 상태
- 테스트 실행 과정 비디오 녹화
- 각 테스트 상세 로그

---

## 🛠️ 개발

### 개발 서버 시작

```bash
pnpm dev
```

### 빌드

```bash
pnpm build
```

### 타입 체크

```bash
pnpm check
```

### 포맷팅

```bash
pnpm format
```

### 데이터베이스 마이그레이션

```bash
pnpm db:push
```

---

## 🧪 테스트

### 단위 테스트

```bash
pnpm test
```

---

## 🔄 GitHub Actions 워크플로우

### 워크플로우 파일
`.github/workflows/qa-tests.yml`

### 실행 단계

1. **Lighthouse 테스트** (선택 시)
   - 웹사이트 성능 분석
   - 결과: JSON 형식의 점수

2. **Responsive Screenshots** (선택 시)
   - 3가지 화면 크기에서 스크린샷 캡처
   - 결과: PNG 이미지 파일

3. **Test Cases** (선택 시)
   - Playwright를 사용한 자동화 테스트
   - 비디오 녹화 (test-video.webm)
   - 결과: JSON 형식의 테스트 결과 + 비디오

### Artifact 다운로드
테스트 완료 후 다음 파일들이 artifact로 저장됩니다:
- `lighthouse-report/` - Lighthouse 결과
- `responsive-screenshots/` - 반응형 스크린샷
- `videos/` - TC 테스트 비디오 (test-video.webm)
- `test-results/` - 테스트 결과 JSON

---

## 📊 TC 테스트 케이스

### 현재 구현된 테스트 케이스

| TC ID | 테스트명 | 설명 |
|-------|---------|------|
| TC-001 | 페이지 로드 | 웹사이트가 정상적으로 로드되는지 확인 |
| TC-002 | 링크 클릭 | 주요 링크가 정상 작동하는지 확인 |
| TC-003 | 폼 제출 | 폼 입력 및 제출이 정상 작동하는지 확인 |
| TC-004 | 검색 기능 | 검색 기능이 정상 작동하는지 확인 |
| TC-005 | 필터링 | 필터링 기능이 정상 작동하는지 확인 |
| TC-006 | 정렬 | 정렬 기능이 정상 작동하는지 확인 |
| TC-007 | 페이지네이션 | 페이지 이동이 정상 작동하는지 확인 |
| TC-008 | 모달 | 모달 창이 정상 작동하는지 확인 |
| TC-009 | 드롭다운 | 드롭다운 메뉴가 정상 작동하는지 확인 |

### 비디오 녹화
모든 TC 테스트는 **1280x720 해상도**로 비디오 녹화됩니다.
- 파일명: `test-video.webm`
- 형식: WebM (VP9 코덱)
- 용도: 테스트 과정 시각화 및 문제 분석

---

## 🔒 보안

- GitHub 토큰은 환경 변수로만 관리
- 모든 입력값은 URL 검증 처리
- HTTPS 강제 (프로덕션)
- 토큰은 절대 로그에 출력되지 않음

---

## 🚀 배포

### Manus 호스팅 (권장)
Manus 플랫폼에서 자동 배포 가능

### 수동 배포

```bash
# 프로덕션 빌드
pnpm build

# 서버 시작
NODE_ENV=production pnpm start
```

---

## 🤝 기여

기여를 환영합니다! 다음 절차를 따르세요:

1. 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 💬 지원

문제가 발생하거나 기능 요청이 있으면:

- **GitHub Issues**: [이슈 생성](https://github.com/eun4791-ctrl/ai_web_test/issues)
- **GitHub Discussions**: [토론 시작](https://github.com/eun4791-ctrl/ai_web_test/discussions)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트를 사용합니다:

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Express.js](https://expressjs.com/)
- [Playwright](https://playwright.dev/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [tRPC](https://trpc.io/)
- [Drizzle ORM](https://orm.drizzle.team/)

---

## 📈 로드맵

### v1.1.0 (계획 중)
- [ ] 테스트 결과 히스토리 저장
- [ ] 결과 비교 기능
- [ ] 정기적인 자동 테스트 스케줄링
- [ ] Slack 통합
- [ ] 이메일 알림

### v1.2.0 (계획 중)
- [ ] 커스텀 테스트 케이스 작성
- [ ] 팀 협업 기능
- [ ] 대시보드 커스터마이징
- [ ] 고급 필터링 및 검색

---

**마지막 업데이트**: 2026년 1월 21일

**버전**: 1.0.0

**상태**: ✅ 프로덕션 준비 완료
