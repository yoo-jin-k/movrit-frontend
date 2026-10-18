# 프론트 주석 보완 및 복사본 정리

기준 커밋: 9ace8a85cdc13f453c1f48082b7fdd4165e0bf35

## 변경 범위

추적 중인 src JavaScript/JSX 146개에 모듈 역할과 데이터 흐름 주석을 보완했습니다. 추가 본문 설명 128곳에는 API 응답 처리, 인증 갱신, 권한 확인의 서버 책임, 이벤트 및 상태 갱신, 실패 복구, 버전 충돌, 이미지 업로드와 방문 증빙을 포함했습니다. 기존 주석 일부를 존댓말과 실제 구현에 맞게 고쳤습니다. 실행 코드와 스타일은 변경하지 않았습니다.

- axios: 인증 갱신과 원래 요청 재시도, 토큰 정리 흐름
- SellerCampaignManager: 업로드·설정 저장 순서와 충돌 후 재조회
- campaignMediaContract/Workflow: 파일 식별자와 버전, 기존 이미지 재사용
- LiveApplicationForm/MyContentSubmission: 제출 중복 제한과 재제출 조건
- BusinessContents/Participants: 검수 이벤트와 서버 권한 책임
- 목록·관리 페이지: 조회 실패, 미리보기 데이터, 저장 후 갱신 범위

## 복사본 비교와 정리

미참조 ` 2` 복사본 8개를 포맷 정규화 후 정식 소스와 비교했습니다. 정적 참조 및 import.meta.glob 검색에서 연결을 찾지 못했습니다. 원본과 백업 SHA-256 일치를 확인한 뒤 작업 폴더에서 제거했습니다. 이 파일들은 원래 Git 미추적 상태였으므로 삭제는 로컬 정리이며 커밋 삭제 내역에 포함되지 않습니다.

| 복사본 | 판단 |
|---|---|
| brandApi 2.js | 정식 코드의 공통 업로드 및 삭제 API 이전 버전 |
| productApi 2.js | 정식 코드의 SKU 수정·비활성화 및 상품 삭제 API 이전 버전 |
| sellerApi 2.js | 정식 코드의 대시보드 조회 추가 이전 버전 |
| preorderApi 2.js | 정식 코드의 후속 상태 전이 이전 버전 |
| BrandManagePage 2.jsx | 포맷·린트 설명 외 정식 동작과 동일 |
| ProductManagePage 2.jsx | 포맷·린트 설명 외 정식 동작과 동일 |
| PreorderManagePage 2.jsx | 정식 코드의 SKU 선택 및 상태 처리 이전 버전 |
| AdminSellerPage 2.jsx | 구형 승인·반려 버튼 포함. 현재 관리자 화면을 바꾸지 않도록 통합하지 않고 백업 보존 |

백업: `/Users/yoo-jinkim/.codex/.chatgpt-projects/g-p-6a7f2a9e25d8819183f472500c63ba26/deliverables/frontend-comments-20261019/`

백업 내 `src/` 원본과 `copies.sha256.json`으로 복구 및 검증 가능합니다. experience, 참조 이미지, 기존 문서와 QA 문서의 선행 수정은 그대로 보존했습니다.

## 검증

- 146개 소스의 변경 전후 AST 비교: 실행 코드 차이 0개
- 기준 커밋과 현재 소스를 각각 빌드: JavaScript/CSS 12개 파일명 및 SHA-256 모두 동일
- format:check, lint, build 통과
- 기존 테스트 92개 통과, 실패 0개
- 주석 대상 및 승인된 복사본 외 모든 기존 파일 해시 동일

이번 검증은 정적 비교와 기존 자동 검증입니다. 실제 서버 데이터 변경이나 추가 브라우저 QA를 수행하지 않았습니다.
