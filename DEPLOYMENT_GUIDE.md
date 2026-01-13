# 배포 및 설정 가이드

## 개요

QA 자동화 대시보드는 Node.js 기반의 풀스택 애플리케이션으로, 다양한 호스팅 환경에 배포할 수 있습니다. 이 가이드는 프로덕션 환경 설정과 배포 절차를 설명합니다.

---

## 사전 요구사항

### 필수 항목

1. **Node.js 18 이상**
   ```bash
   node --version  # v18.0.0 이상
   ```

2. **npm 또는 pnpm**
   ```bash
   npm --version
   # 또는
   pnpm --version
   ```

3. **GitHub 저장소**
   - 워크플로우 파일 저장
   - 코드 버전 관리

4. **GitHub 개인 액세스 토큰**
   - GitHub Settings → Developer settings → Personal access tokens
   - 권한: `repo`, `workflow` 선택

---

## 환경 변수 설정

### 필수 환경 변수

프로덕션 환경에서 다음 환경 변수를 설정해야 합니다:

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

# 선택사항: CORS 설정
FRONTEND_URL=https://your-domain.com
```

### 환경 변수 설정 방법

#### 1. `.env.production` 파일 사용 (로컬)
```bash
# .env.production
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=qa-automation
GITHUB_WORKFLOW_ID=qa-tests.yml
NODE_ENV=production
PORT=3000
```

#### 2. 호스팅 플랫폼 대시보드 (권장)

**Vercel:**
1. Vercel 대시보드 접속
2. 프로젝트 선택 → Settings → Environment Variables
3. 환경 변수 추가

**Heroku:**
1. Heroku 대시보드 접속
2. 앱 선택 → Settings → Config Vars
3. 환경 변수 추가

**Railway:**
1. Railway 대시보드 접속
2. 프로젝트 선택 → Variables
3. 환경 변수 추가

#### 3. Docker 환경 변수
```dockerfile
ENV GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ENV GITHUB_REPO_OWNER=your-org
ENV GITHUB_REPO_NAME=qa-automation
ENV GITHUB_WORKFLOW_ID=qa-tests.yml
ENV NODE_ENV=production
ENV PORT=3000
```

---

## 빌드 및 배포

### 로컬 빌드

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 결과 확인
ls -la dist/
```

### 프로덕션 서버 시작

```bash
# 빌드된 애플리케이션 실행
npm run start

# 또는 직접 Node 실행
NODE_ENV=production node dist/index.js
```

---

## 호스팅 플랫폼별 배포

### Vercel 배포 (권장)

Vercel은 Next.js 기반 애플리케이션에 최적화되어 있습니다.

**1단계: Vercel CLI 설치**
```bash
npm install -g vercel
```

**2단계: 프로젝트 배포**
```bash
vercel
```

**3단계: 환경 변수 설정**
```bash
vercel env add GITHUB_TOKEN
vercel env add GITHUB_REPO_OWNER
vercel env add GITHUB_REPO_NAME
vercel env add GITHUB_WORKFLOW_ID
```

**4단계: 재배포**
```bash
vercel --prod
```

**배포 후 확인:**
```bash
# Vercel 대시보드에서 배포 상태 확인
# https://vercel.com/dashboard
```

---

### Heroku 배포

**1단계: Heroku CLI 설치**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# https://cli-assets.heroku.com/heroku-x64.exe 다운로드
```

**2단계: Heroku 로그인**
```bash
heroku login
```

**3단계: Heroku 앱 생성**
```bash
heroku create your-app-name
```

**4단계: 환경 변수 설정**
```bash
heroku config:set GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
heroku config:set GITHUB_REPO_OWNER=your-org
heroku config:set GITHUB_REPO_NAME=qa-automation
heroku config:set GITHUB_WORKFLOW_ID=qa-tests.yml
```

**5단계: 배포**
```bash
git push heroku main
```

**배포 후 확인:**
```bash
# 로그 확인
heroku logs --tail

# 앱 열기
heroku open
```

---

### Railway 배포

**1단계: Railway 계정 생성**
- https://railway.app 접속
- GitHub 계정으로 로그인

**2단계: 프로젝트 생성**
1. Railway 대시보드 접속
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. 저장소 선택

**3단계: 환경 변수 설정**
1. 프로젝트 선택
2. Variables 탭
3. 환경 변수 추가

**4단계: 배포**
- 자동 배포 (GitHub push 시)

---

### Docker를 사용한 배포

**1단계: Dockerfile 생성**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 포트 노출
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production

# 애플리케이션 실행
CMD ["npm", "start"]
```

**2단계: Docker 이미지 빌드**
```bash
docker build -t qa-dashboard:latest .
```

**3단계: Docker 컨테이너 실행**
```bash
docker run -d \
  -p 3000:3000 \
  -e GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  -e GITHUB_REPO_OWNER=your-org \
  -e GITHUB_REPO_NAME=qa-automation \
  -e GITHUB_WORKFLOW_ID=qa-tests.yml \
  --name qa-dashboard \
  qa-dashboard:latest
```

---

## 성능 최적화

### 프로덕션 빌드 최적화

```bash
# 번들 크기 분석
npm run build -- --analyze

# 불필요한 의존성 제거
npm prune --production
```

### 캐싱 전략

**정적 자산 캐싱:**
```javascript
// server/index.ts에서 설정
app.use(express.static('dist/public', {
  maxAge: '1d',
  etag: false
}));
```

### 압축 활성화

```javascript
import compression from 'compression';

app.use(compression());
```

---

## 모니터링 및 로깅

### 로그 설정

```javascript
// server/index.ts
import fs from 'fs';

const logStream = fs.createWriteStream('logs/app.log', { flags: 'a' });

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = `${timestamp} ${req.method} ${req.path} ${res.statusCode}\n`;
  logStream.write(log);
  next();
});
```

### 에러 모니터링

**Sentry 통합:**
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### 헬스 체크 엔드포인트

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## 보안 설정

### HTTPS 강제

```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});
```

### CORS 설정

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

### 보안 헤더

```javascript
import helmet from 'helmet';

app.use(helmet());
```

---

## 트러블슈팅

### 배포 실패

**문제:** 빌드 실패
```
Solution:
1. 로그 확인: npm run build
2. 의존성 확인: npm install
3. Node 버전 확인: node --version
```

**문제:** 환경 변수 미설정
```
Solution:
1. 환경 변수 확인: echo $GITHUB_TOKEN
2. 호스팅 플랫폼 대시보드에서 설정 확인
3. 재배포: git push 또는 vercel --prod
```

### 런타임 에러

**문제:** 포트 이미 사용 중
```bash
# 포트 변경
PORT=3001 npm start

# 또는 기존 프로세스 종료
lsof -i :3000
kill -9 <PID>
```

**문제:** GitHub API 인증 실패
```bash
# 토큰 확인
echo $GITHUB_TOKEN

# 토큰 재생성 및 설정
# GitHub Settings → Developer settings → Personal access tokens
```

---

## 체크리스트

배포 전 다음 항목을 확인하세요:

- [ ] 모든 환경 변수 설정 완료
- [ ] 프로덕션 빌드 성공
- [ ] 로컬에서 `npm run start` 정상 작동
- [ ] GitHub 토큰 유효성 확인
- [ ] 저장소 정보 정확성 확인
- [ ] HTTPS 설정 완료
- [ ] 보안 헤더 설정 완료
- [ ] 모니터링 설정 완료
- [ ] 백업 계획 수립
- [ ] 롤백 계획 수립

---

## 참고 자료

- [Vercel 배포 가이드](https://vercel.com/docs)
- [Heroku 배포 가이드](https://devcenter.heroku.com/)
- [Railway 배포 가이드](https://docs.railway.app/)
- [Docker 공식 문서](https://docs.docker.com/)
- [Node.js 프로덕션 체크리스트](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
