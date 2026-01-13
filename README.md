# QA 자동화 대시보드

![QA Automation Dashboard](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

비개발자 친화적인 웹사이트 품질 검증 도구입니다. 성능, 반응형 호환성, UX 품질, 기능 테스트를 자동으로 실행하고 결과를 시각화합니다.

---

## 🎯 주요 기능

### Lighthouse 성능 분석
웹사이트의 성능, 접근성, SEO, 모범 사례를 자동 분석합니다.

### 반응형 화면 호환성 테스트
데스크톱, 태블릿, 모바일 화면에서의 표시 상태를 확인합니다.

### AI UX 리뷰
인공지능이 사용자 경험을 분석하고 개선점을 제시합니다.

### 기능 테스트 케이스
로그인, 검색, 결제 등 주요 기능의 정상 작동을 자동 확인합니다.

---

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18 이상
- npm 또는 pnpm
- GitHub 계정 및 개인 액세스 토큰

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/qa-automation-dashboard.git
cd qa-automation-dashboard

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 수정 (GitHub 토큰 등)

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 프로덕션 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start
```

---

## 📋 기술 스택

### 프론트엔드
- **React 19**: UI 프레임워크
- **Tailwind CSS 4**: 스타일링
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘
- **Wouter**: 클라이언트 라우팅

### 백엔드
- **Express.js**: 웹 서버
- **Node.js**: 런타임 환경

### CI/CD
- **GitHub Actions**: 자동화 테스트 실행
- **Lighthouse**: 성능 분석
- **Playwright**: 브라우저 자동화

---

## 📁 프로젝트 구조

```
qa-automation-dashboard/
├── client/                      # 프론트엔드
│   ├── src/
│   │   ├── pages/              # 페이지 컴포넌트
│   │   ├── components/         # UI 컴포넌트
│   │   ├── contexts/           # React 컨텍스트
│   │   ├── hooks/              # 커스텀 훅
│   │   ├── lib/                # 유틸리티 함수
│   │   ├── App.tsx             # 라우팅
│   │   ├── main.tsx            # 진입점
│   │   └── index.css           # 글로벌 스타일
│   ├── public/                 # 정적 자산
│   └── index.html              # HTML 템플릿
├── server/                      # 백엔드
│   ├── index.ts                # 서버 진입점
│   └── api.ts                  # API 라우트
├── .github/
│   └── workflows/
│       └── qa-tests.yml        # GitHub Actions 워크플로우
├── docs/                        # 문서
│   ├── API_GUIDE.md            # API 가이드
│   ├── WORKFLOW_GUIDE.md       # 워크플로우 가이드
│   ├── DEPLOYMENT_GUIDE.md     # 배포 가이드
│   ├── INTEGRATION_TEST.md     # 통합 테스트 가이드
│   └── USER_GUIDE.md           # 사용자 가이드
├── package.json                # 의존성 정의
├── tsconfig.json               # TypeScript 설정
├── tailwind.config.js          # Tailwind 설정
└── README.md                   # 이 파일
```

---

## 🔧 환경 변수 설정

### 필수 환경 변수

```bash
# GitHub API 인증
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 저장소 정보
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=qa-automation
GITHUB_WORKFLOW_ID=qa-tests.yml

# 서버 설정
NODE_ENV=production
PORT=3000
```

### 환경 변수 파일 생성

```bash
# .env.local (개발 환경)
cp .env.example .env.local

# .env.production (프로덕션 환경)
cp .env.example .env.production
```

---

## 📖 사용 방법

### 1. URL 입력
테스트할 웹사이트 URL을 입력합니다.

### 2. 테스트 선택
원하는 테스트 항목을 선택합니다 (최소 1개 이상).

### 3. 테스트 실행
"테스트 실행" 버튼을 클릭합니다.

### 4. 결과 확인
테스트 완료 후 결과 요약을 확인합니다.

### 5. 상세 리포트 확인
"상세 리포트 보기" 링크로 더 자세한 정보를 확인합니다.

더 자세한 내용은 [사용자 가이드](./USER_GUIDE.md)를 참고하세요.

---

## 🛠️ 개발

### 개발 서버 시작

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 타입 체크

```bash
npm run check
```

### 포맷팅

```bash
npm run format
```

---

## 🧪 테스트

### 통합 테스트

```bash
npm run test
```

더 자세한 테스트 가이드는 [통합 테스트 가이드](./INTEGRATION_TEST.md)를 참고하세요.

---

## 📚 문서

- [API 가이드](./API_GUIDE.md): API 엔드포인트 및 사용 방법
- [워크플로우 가이드](./WORKFLOW_GUIDE.md): GitHub Actions 워크플로우 설정
- [배포 가이드](./DEPLOYMENT_GUIDE.md): 프로덕션 배포 방법
- [통합 테스트 가이드](./INTEGRATION_TEST.md): 테스트 시나리오 및 검증
- [사용자 가이드](./USER_GUIDE.md): 사용자를 위한 가이드 및 FAQ
- [디자인 기획안](./ideas.md): 디자인 철학 및 스타일 가이드

---

## 🚀 배포

### Vercel (권장)

```bash
vercel
```

### Heroku

```bash
heroku create your-app-name
git push heroku main
```

### Railway

GitHub 저장소를 Railway에 연결하면 자동 배포됩니다.

더 자세한 배포 방법은 [배포 가이드](./DEPLOYMENT_GUIDE.md)를 참고하세요.

---

## 🔒 보안

- GitHub 토큰은 환경 변수로만 관리
- 모든 입력값은 검증 및 새니타이제이션 처리
- HTTPS 강제 (프로덕션)
- CORS 설정으로 크로스 오리진 요청 제한

---

## 📊 성능

- 초기 페이지 로드: < 2초
- 상태 폴링 응답: < 500ms
- 결과 렌더링: < 1초

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

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.

---

## 💬 지원

문제가 발생하거나 기능 요청이 있으면:

- **GitHub Issues**: [이슈 생성](https://github.com/your-org/qa-automation-dashboard/issues)
- **이메일**: support@example.com
- **문서**: [FAQ 및 문제 해결](./USER_GUIDE.md#자주-묻는-질문-faq)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트를 사용합니다:

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Express.js](https://expressjs.com/)
- [Playwright](https://playwright.dev/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

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

## 📞 연락처

- **개발팀**: dev@example.com
- **지원팀**: support@example.com
- **GitHub**: [@your-org](https://github.com/your-org)

---

**마지막 업데이트**: 2026년 1월 13일

**버전**: 1.0.0

**상태**: ✅ 프로덕션 준비 완료
