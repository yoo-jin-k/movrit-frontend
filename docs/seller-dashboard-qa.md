# 업체 대시보드 구현 · QA 인계 (2026-10-17)

승인 디자인: MOVRIT 프로젝트 deliverables/movrit-seller-dashboard-20261017, localhost:5186 시안. 실제 구현: localhost:5174/seller/dashboard. /api는 기존18080통합서버를 사용합니다.

## 구현 범위
- /seller/dashboard: 실제 업체 프로필, 캠페인 공개 건수, SUBMITTED 신청, SELECTED 수락 대기, SUBMITTED 콘텐츠, 모집 마감. 목록 조회 실패를 0건으로 표시하지 않습니다.
- /seller/campaigns: 실제 업체 소유 캠페인 검색/공개 필터. 이미지 API가 없어 브랜드 중립 표면만 표시합니다.
- /seller/campaigns/new, /seller/campaigns/:campaignId: 기존 configured 원자 저장 편집기를 재사용합니다. URL ID를 소유 목록과 대조한 후 상세·조건·신청서를 읽습니다. 추가 조건 없음/임의 정수 조건 지원, 기본500 없음.
- /seller/participants: 신청 목록, 캠페인/상태 필터, 신청 당시 조건 스냅샷·답변, 직접 선정/미선정 확인. 선정과 참여 수락은 별도입니다. 배송 연락처는 표시하지 않습니다.
- /seller/contents: 콘텐츠 상태 필터, 외부 http(s) 링크, 현재 버전/최근 의견, 수정 요청/업체 검토 완료. 최종 운영자 승인으로 표현하지 않습니다.
- /seller/inbox: 실제 알림 읽음 표시와 문의 조회/작성. 문의 전송은 사용자 버튼 동작에서만 수행합니다.
- /seller/settings: 실제 업체 프로필과 기존 브랜드/상품/프리오더/주문 관리 연결.
- 기존 /seller/collaborations 작성·협업 기능과 사용자 페이지 유지. 업체 스타일은 .business-shell로 한정하고 업체 라우트에서 지연 로드합니다.

## API 계약
인증: 기존 Axios JWT Bearer. 모든 seller 조회·명령의 소유권/승인/전이 판정은 서버에서 수행합니다. 프론트 shell은 GET /sellers/me status=APPROVED 확인 후만 업무를 마운트합니다. 비인증은 기존 ProtectedRoute로 로그인 이동. 비승인 업체는 상태 안내/등록 링크만 제공합니다.

| Method / Endpoint | 응답·요청 / 표시 |
|---|---|
| GET /sellers/me | 업체 프로필. nullable 브랜드명은 사업자명으로 표시, 누락 정보는 미등록 |
| GET /collaborations/campaigns/seller | 배열. id/title/brandName/category/open/recruitmentCount/rewardDescription/startAt/endAt. 페이지네이션 계약 없음 |
| GET /campaigns/applications/seller | 배열. 캠페인별 필터는 클라이언트. status SUBMITTED/SELECTED/REJECTED/ACTIVE/CONTENT_SUBMITTED/REVISION_REQUESTED/COMPLETED/CANCELLED. nullable snapshot만 조건 없음, version0 유지 |
| PATCH /campaigns/applications/:id/select 또는 reject | body 없음, 응답 최신 신청. SUBMITTED에서만 UI 노출, 명령 후 목록 재조회 |
| GET /campaign-contents/seller | 배열. id/applicationId/creatorNickname/campaignTitle/contentUrl/note/status/revisionCount/version/reviewComment/submittedAt/reviewedAt. nullable 메모/의견은 빈 안내 |
| PATCH /campaign-contents/:id/request-revision | {comment:필수 1~2000자, expectedVersion:응답 version}. SUBMITTED만 UI 노출 |
| PATCH /campaign-contents/:id/approve | {comment:null 또는 최대2000자, expectedVersion:응답 version}. 결과 BRAND_APPROVED, 운영자 최종 APPROVED와 구분 |
| GET /notifications | 배열. title/message/read/createdAt 표시 |
| PATCH /notifications/:id/read | body 없음. 성공 후 재조회 |
| GET /inquiries/mine | 배열. category/title/content/status/answer/createdAt 표시. nullable answer는 미답변 |
| POST /inquiries | {preorderId:null, category:비어있지 않은 문자열, title, content}. category 고정 enum 없음 |

configured 생성/수정 계약은 docs/brand-campaign-condition-qa.md를 따릅니다. HTTP 성공200/생성201은 Axios성공으로 처리하고 명령 뒤 재조회합니다. 403 조회는 권한 안내. 401은 기존 인증 흐름. 콘텐츠/신청 명령409 및 결과 불명은 재시도 잠금→상세닫기→최신목록 확인. 콘텐츠 version 누락/음수는 저장차단, 0은 유효. 임의 네트워크 오류를 성공으로 표시하지 않습니다.

일정 충돌: 04 1c2251e부터 configured 구 expectedScheduleVersion은409(기존400에서 수정). 현재409문구는 최신 내용 다시 불러오기 안내, 기존400도 mustReload잠금이 적용됩니다. 브라우저409복구 동선은 추가QA필요.

## 직접 확인한 근거
- 변경 대상 ESLint통과, production build196modules 통과. 업체코드 지연로드로 메인JS489.10kB, 사용자CSS index-Dm4uR6Lz.css 유지.
- business-model/campaign-requirement/seller-application-form/application-payload 17tests 통과. 콘텐츠version0/누락/의견필수/2000자/안전링크/한국시간 및 기존 원자저장 입력 계약.
- 5174 별도 IAB 정상 로그인으로 QA브랜드A 조회. 토큰 주입 없음. A캠페인15 조건499/폼1, 기존 신청11의 snapshot500/version0 분리 표시. 선정/거절/조건변경 없음.
- 실제 홈 공개캠페인1/선정대기1/수락대기0/콘텐츠검토0 확인. 캠페인편집, 알림 목록, 문의 작성창 확인. 콘텐츠0건은 명확한 빈상태.
- 390px 참여자/상세패널, 320px 홈/캠페인편집 화면 확인. 메뉴의 초기 가로넘침 수정후 document.scrollWidth=viewportWidth. 표/가로메뉴는 내부 스크롤. native dialog Escape 닫기/실행버튼 초점 복귀 확인. viewport reset 완료.
- Google 로그인은 사용자가 실제 Google 계정 로그인 후 정상 MOVRIT 복귀를 확인하여 해결로 분류. 기존 invalid_client 재현 문서는 과거 근거입니다.

## QA 요청 / 남은 제한
- 별도 쓰기 fixture로 직접 선정/미선정, 콘텐츠 수정요청·업체검토 및 stale expectedVersion409를 브라우저 검증해 주세요. 기존 A15/B14/신청11 보존. 04에 별도 콘텐츠fixture 요청했습니다.
- 다른 업체 접근, 비승인/권한회수, 네트워크 오류, configured 일정409→재조회→수정 경로를 검수해 주세요.
- 알림 읽음/문의 실제 저장은 직접 읽기검증에서 실행하지 않았습니다.
- 서버 미제공: 운영자 선정모드/추천 API, 참여자 실측 지표/검증 출처·날짜, 질문 과거라벨, 콘텐츠 전체 검토이력, 캠페인 상품이미지, 전용 대시보드집계. 임의로 합성하지 않습니다. 질문은 questionId로 표시합니다.
- 동의문 승인 정본/필수정책은 미확정입니다. 기존 수동작성기에서 운영 확인문서를 입력하도록 안내하며 등록 성공을 법무승인으로 표현하지 않습니다.
- 배송/방문 상세 운영과 기존 주문기능의 전면 디자인개편은 이번 화면 범위에 포함하지 않습니다.
- 신규커밋/푸시/배포없음. 원격 developer=d5e8cd5. 기존37파일manifest는 당시 기준으로 보존하고 이번 seller-dashboard-version.sha256을 별도로 사용합니다.
