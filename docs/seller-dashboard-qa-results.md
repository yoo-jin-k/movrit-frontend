# 업체 대시보드 독립 QA 결과

2026-10-17, QA05 전달 근거. 구현 고정본52파일 manifest e9041ff31cf12bffda886b7e34f117ad84ffa068b757e8cd1df625a020f984af 유지. 이 문서는 후속 결과 기록이며 고정본 파일을 변경하지 않습니다.

## QA 직접 통과
- 고정52파일 전부 일치, 관련17tests 통과.
- 정상UI 브랜드A 로그인 → 콘텐츠 submission4/version0에서 수정요청 빈 의견 차단 → QA 의견 저장 성공 → 재개방 version1/수정요청/의견 표시.
- API에서 콘텐츠 REVISION_REQUESTED/version1, 신청12 동일 상태 확인.
- 다른 업체B403 / 일반USER21 404로 콘텐츠 권한 차단.
- 구version0 approve409 및 콘텐츠 데이터 불변 확인. 이 항목은 API검증이며 브라우저 충돌 복구 검증과 구분합니다.
- A15 편집화면을 연 후 동일 필드 API저장으로 schedule14→15 변경 → UI 임시 제목 저장409 → 입력·저장 잠금 → 최신 재조회로 원래 제목 및 편집 복구 → 정상 저장 성공.
- A로 B14 직접 편집URL 접근 시 폼 차단.

## 보존 상태
- A15 원래 제목/최소499/조건id8 version11/form1/schedule16.
- 신청11 최초 응답 전체 및 snapshot500/version0 보존.
- B14 조건321/version0 보존.
- submission4는 수정요청/version1 상태 유지. 임의 초기화하지 않습니다.

## 별도 미검증
콘텐츠409 브라우저 복구, 정상 업체 승인, 별도fixture 선정·미선정, 비승인/권한회수, 알림 읽음·문의 실제쓰기. 위 항목까지 완료되었다고 주장하지 않습니다.

## 후속 핵심 검증 완료 (QA05 추가 통보)
이 절은 위 미검증 목록 중 아래 항목을 대체합니다.
- 실제 UI submission5 approve → BRAND_APPROVED/version1. 운영자 최종 승인과 구분 확인.
- submission6/version0 열기 → API 수정요청으로 최신 버전 변경 → UI stale409 잠금 → 최신 목록 복구 통과.
- application16 UI 미선정 → REJECTED.
- 별도 정원 여유 campaign17/application18 UI 선정 → SELECTED(참여 수락 대기).
- application15 정원 초과409, SUBMITTED 보존. application19 미사용.
- 선정 전15/16/18 배송contact null 및 UI 비노출 확인.
- 콘텐츠 응답버전 결함013: 백엔드2d6a54c 수정 후 submission9 approve / submission10 request-revision 두 경로 모두 명령 응답과 GET version1 전체 일치, QA 종료.
- 최종 콘텐츠4/6/10 REVISION_REQUESTED/version1, 5/9 BRAND_APPROVED/version1. 상태 임의 초기화 금지.
- 신청11 최초 응답 전체 보존. QA가320px 홈/390px 신청11 상세 가로 넘침0 직접 확인하고 viewport 복원.
- 비승인22 REJECTED는 API 확인. 목록은200 빈 배열(403이 아님). 정상 UI 로그인 후 브라우저 도구 시간 초과로 비승인 차단화면 검증은 완료하지 못했습니다.

현재 남은 범위: 권한 회수, 비승인 UI 차단, 알림 읽음·문의 실제쓰기, 신청과 조건 변경의 동시 경쟁. 구현 고정52파일 변경 없음. 사용자 화면·기존fixture 보존, 추가 푸시 없음.

## 기존 기능 QA 완료 정정 (2026-10-18 PM 확인)
위 잔여 항목 중 아래는 QA05 최종 검수에서 이미 통과했습니다.
- 알림7 읽음 처리, 문의3 실제 저장.
- 비승인22 정상 UI 차단.
- 권한 회수24의 기존 토큰으로 신청21/콘텐츠11 조회·쓰기403 차단.
따라서 비승인·권한회수·알림문의쓰기를 현재 미검증으로 분류하지 않습니다. docs/seller-dashboard-design-v2.md에 적힌 해당 잔여 목록은 이 후속 결과로 정정합니다. v2의55파일 고정본은 변경하지 않습니다.

현재 다음 작업: QA05의 v2 디자인·미리보기·비교 및 저장409 영향 회귀 결과에 따라 결함 대응. 기존 기능 QA통과와 v2영향검수는 별도 기록합니다. 새푸시·배포 없음. 승인된 범위의 QA 결함 수정에는 추가 사용자승인이 필요하지 않습니다.
