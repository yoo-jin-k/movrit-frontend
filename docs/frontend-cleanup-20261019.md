# 프론트 소스 정리 — 2026-10-19

기준 커밋 a3bd311. 실제 소스·스타일·테스트·설정·HTML에 Prettier 3.6.2 고정 적용: 2칸 들여쓰기, 작은따옴표, 세미콜론 생략, 80자 줄 폭, LF.
브랜드·상품·캠페인의 파일 FormData 생성만 src/api/fileUpload.js로 공통화했습니다. URL/메서드/필드명/타임아웃/인증/헤더/반환값은 유지했습니다. 기존 기능 주석을 보존하고 공통 함수 및 변경한 업로드 주석은 존댓말로 작성했습니다.
187개 파일 정리 전후를 같은 포맷터로 정규화해 대조했습니다. 업로드 공통화3개와 lint 설정을 제외한 비포맷 변경은 없습니다. 서로 의미가 다른 상태/오류/날짜 표시와 API 래퍼는 합치지 않았습니다.

## 보존
시작 시282개 파일 SHA256, git status, tracked diff 기록. 별도 로컬 백업은 MOVRIT 프로젝트 deliverables/frontend-cleanup-20261019/source-before.tar.gz 및 hashes-before.json/status-before.txt/tracked-diff-before.patch/copies.json입니다.
기존 docs/my-campaign-workflow-qa-results.md 변경, 미추적 experience와 테스트, 다른 복사본 등 보존 대상40개 파일의 SHA256이 그대로입니다. 이번 커밋에 포함하지 않습니다.

## 복사본 정리
다음3개는 원본과 바이트 동일·코드/설정 참조없음을 확인하여 백업 후 로컬에서 정리했습니다. 원래 미추적 파일이라 Git 삭제 변경은 없습니다.
- `src/api/adminSellerApi 2.js`
- `src/pages/SocialLinkCallbackPage 2.jsx`
- `src/pages/SellerApplyPage 2.jsx`

다음8개는 구현 또는 주석/lint 지시문이 달라 삭제·수정하지 않았습니다.
- `src/api/productApi 2.js`
- `src/api/sellerApi 2.js`
- `src/api/brandApi 2.js`
- `src/api/preorderApi 2.js`
- `src/pages/PreorderManagePage 2.jsx`
- `src/pages/BrandManagePage 2.jsx`
- `src/pages/AdminSellerPage 2.jsx`
- `src/pages/ProductManagePage 2.jsx`

8개 정확한 경로만 Prettier/ESLint에서 제외했습니다. 복사본 기존 lint오류4개/경고1개는 보존했으며 제품 버그를 수정했다고 주장하지 않습니다. 실제 소스 React규칙은 완화하지 않았고 scripts MJS는 Node환경 lint를 추가했습니다.

## 검사 명령
- npm ci
- npm run format:check
- npm run format
- npm run lint
- npm test
- npm run build

포맷 검사·활성소스/Node테스트 lint·전체 로컬 Node테스트92개·Vite216modules 빌드 통과.92개에는 보존한 미추적 experience 테스트도 포함되며 해당 파일은 이번 원격 커밋에 포함하지 않습니다.
빌드 CSS는 이전과 동일한 index-DZ9YbJz2.css 및 BusinessShell-CPtHqcjS.css, 메인JS474.50kB. 실제서버쓰기·시각QA·배포는 이번 포맷정리에서 재실행하지 않았습니다.
기존 QA해시는 당시 스냅샷으로 보존합니다. 새 정리 기준은 frontend-cleanup-version.sha256입니다.
노션/ERD/백엔드는 PM 담당이며 수정하지 않았습니다. 일반push 및 보고 후 작업/자동확인을 중단합니다.
