# 사용자 콘텐츠 제출·재제출 최소 UI 인계

2026-10-18 · PM 명시 승인 범위. 참여 수락·체험 확인 추가 승인 반영한 2차 고정본입니다. 실제 /mypage/campaigns 기존 내 신청 목록 안에 콘텐츠 입력·상태만 추가했습니다. 사용자 전체 레이아웃·헤더·외부계정연동은 변경하지 않습니다.

## 실제 계약과 상태
- GET /api/campaigns/applications/mine 및 GET /api/campaign-contents/mine 본인 JWT 인증 목록. 페이지네이션 없는 배열, application.id와 content.applicationId로 매칭합니다.
- POST /api/campaign-contents/applications/:applicationId, {contentUrl, note, expectedVersion}. 최초 제출201, expectedVersion:null. 재제출201, expectedVersion은 조회한정수 version(0도유효).
- PATCH /api/campaigns/applications/:id/activate, body없음, 본인SELECTED→ACTIVE. PATCH /api/campaigns/applications/:id/experience-confirm, body없음, 본인ACTIVE의실제체험완료확인. 두명령은사용자명시버튼→확인하여반영으로실행하며자동진행없음. 성공200,상태충돌409,소유권없음404를처리합니다.
- 최초 UI허용: 신청 ACTIVE, experienceConfirmedAt 존재, 조회성공한 콘텐츠 목록에 기존 콘텐츠 없음.
- 재제출 UI허용: 신청 REVISION_REQUESTED, 동일 신청의 콘텐츠 REVISION_REQUESTED, 유효 version.
- 콘텐츠 SUBMITTED=제출완료·검토대기 / REVISION_REQUESTED=수정요청 / BRAND_APPROVED=업체검토완료·운영자최종승인대기 / APPROVED=운영자최종승인완료.
- 공개 http/https URL필수/최대1000자/URL인증정보 금지. 메모선택/최대2000자, 공백은null. 검토의견 및 기존 URL·메모 표시.
- 알 수 없는 상태/누락버전/조회실패를 제출허용으로 바꾸지 않습니다. 서버가 최종 권한/상태를 재검증합니다.

## 실패·중복·충돌 복구
- 제출중 ref+disabled 이중 가드, 자동재전송없음.
- 409는 상태/버전 변경 안내. 403/404는 대상 접근안내. 통신오류/응답유실은 결과불명확안내.
- 명령 후 성공/실패 모두 입력·제출잠금. '최신 내역 확인'은 신청과콘텐츠목록을 함께재조회하며 저장여부를 확인합니다. 최신서버값을 다시표시함을 안내합니다.
- 조회실패는 오류와재조회버튼, 기존콘텐츠없는것으로오판하지않음. 성공메시지로 운영자최종승인을 주장하지않음.

## 직접 검증
- 대상ESLint/production build202modules/상태·버전·URL 단위4tests 통과.
- 회원16 정상로그인 /mypage/campaigns에서 신청12/submission4 BRAND_APPROVED/version3 및 QA검토의견, 신청11 SUBMITTED 제출차단 확인. 읽기만수행,상태변경없음.
- 390px 내신청 화면 문서가로폭초과0/스크린샷확인/viewport복원.
- 신규CSS는 .my-campaign-content로한정. 사용자번들CSS해시는전용입력스타일추가로바뀌며 기존스타일선택자는변경하지않음.

## QA 요청·한계
- 별도실제사용자fixture로 최초제출/수정요청의견/재제출/버전갱신/브랜드승인과최종승인구분 전체UI검증.
- 빈URL/위험URL/연속클릭/구버전409/최초GET실패/명령응답유실→잠금→재조회→상태확인.
- 기존app11/A15/B14/검토완료submission4는임의초기화금지. 쓰기는QA소유fixture에서만.
- 참여수락·체험완료버튼을기존API로연결했습니다. 실제수령/방문완료를명시확인한뒤명령하고재조회하며,콘텐츠제출가능상태를자동진행시키지않습니다. 추가버튼의실제쓰기검증은QA fixture지정후수행합니다.
- 미디어검증준비파일 campaignMediaValidation.js는별도진행중이며이콘텐츠고정본에포함하지않습니다.
