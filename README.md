# MOVRIT 프론트엔드

브랜드 캠페인 탐색·신청·콘텐츠 제출(사용자), 캠페인 운영(업체), 검수(운영자) 화면을 제공하는 React·Vite 앱입니다.

- React 19 · React Router 7 · Vite 8 · Axios · Sass
- Node 24.18.1 (`.nvmrc`) — `nvm use` 로 맞춥니다.

## 실행

```bash
nvm use
npm ci
npm run dev:integration   # http://localhost:5174 → 백엔드 http://localhost:18080 (실제 서버 데이터)
npm run dev               # 기본 개발 서버 → 백엔드 http://localhost:8080
```

- 통합 실행 설정은 `.env.integration` 에 있습니다(비밀값 없음).
- 백엔드는 movrit 저장소의 `scripts/integration.sh start` 로 먼저 실행합니다.
- 소셜 로그인 확인은 Chrome 같은 일반 브라우저에서 합니다.

## 검증

```bash
npm test             # 단위 테스트(scripts/*.test.mjs)
npm run lint
npm run format:check
npm run build
```

## 주요 경로

| 대상 | 경로 |
|---|---|
| 사용자 | `/home`, `/category/:section`, `/campaign/:id`, `/mypage`, `/mypage/campaigns`, `/settings` |
| 업체 | `/seller/dashboard`, `/seller/campaigns`, `/seller/participants`, `/seller/contents` |
| 운영자 | `/admin/dashboard`, `/admin/campaign-participants`, `/admin/content` |
