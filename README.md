# MOVRIT 프론트엔드

브랜드 캠페인 운영 플랫폼 MOVRIT의 화면입니다. 참여자·업체·운영자 화면을 한 앱에서 역할별로 나눠 제공합니다.
서버와 전체 설계 설명은 백엔드 저장소 [movrit-backend](https://github.com/yoo-jin-k/movrit-backend)에 있습니다.

- React 19, React Router 7, Vite 8, Axios, Sass
- Node 24 (`.nvmrc`)

## 시연 영상

[docs/demo/movrit-demo.mp4](docs/demo/movrit-demo.mp4) (약 1분, 소리 없음)

참여자가 캠페인을 둘러보고(홈 → 지역 캠페인 목록) 신청서를 쓰는 장면 → 내 캠페인(참여 조정·달력)과 채팅 → 업체의 참여자·배송·환급 관리 → 운영자의 최종 승인과 신고 처리 순서입니다. 시연 데이터를 바꾸지 않으려고 신청·저장 버튼은 누르지 않았습니다.

시연 데이터는 업체 8곳·브랜드 36개·캠페인 44개로, 종류(제품·지역·기자단·구매평)·카테고리·지역·채널·선정 방식(직접·운영자·선착순)·모집 상태가 고루 섞여 있습니다. 캠페인 사진은 위키미디어 공용의 자유 이용 사진이며 출처는 [qa/portfolio/IMAGE_CREDITS.md](qa/portfolio/IMAGE_CREDITS.md)에 있습니다. 브랜드·매장·주소는 모두 지어낸 것입니다.

## 화면

### 참여자

| 홈                                                                           | 구매평 캠페인 상세                                                                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ![홈](docs/screenshots/01-home.png)                                          | ![구매평 캠페인](docs/screenshots/02-campaign-purchase-review.png)                                                     |
| 이번 주 모집 현황, 체험 방식 바로가기, 마감이 가까운·선정 확률이 높은 캠페인 | 왼쪽은 이미지와 탭(캠페인 정보·상세페이지·미션·일정·유의사항), 오른쪽은 따라 내려오는 요약 카드(일정·캘린더·모집 현황) |

| 신청서                                        | 내 캠페인                                                     |
| --------------------------------------------- | ------------------------------------------------------------- |
| ![신청서](docs/screenshots/03-apply-form.png) | ![내 캠페인](docs/screenshots/04-my-campaign-workspace.png)   |
| 캠페인마다 다른 참여 방식·질문·동의 항목      | 일정표, 미션, 송장번호, 콘텐츠 제출과 성과 기록을 한 화면에서 |

| 캠페인 목록                                               | 선착순 캠페인 상세                                             |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| ![캠페인 목록](docs/screenshots/08-category-list.png)     | ![선착순 캠페인](docs/screenshots/02b-campaign-first-come.png) |
| 카테고리·채널로 고르기, 채널 아이콘·선착순 표시·모집 현황 | 방문형 선착순: 신청하면 바로 선정, 모집 인원이 차면 마감       |

| 참여 조정                                                    | 내 캠페인 달력                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| ![참여 조정](docs/screenshots/04b-my-campaign-change.png)    | ![달력](docs/screenshots/09-my-campaign-calendar.png)          |
| 발표 전 신청 철회, 참여 취소(단순·협의+증빙), 기간 연장 요청 | 신청한 캠페인의 선정 발표·체험 시작·콘텐츠 마감을 한 달 단위로 |

| 마이페이지                                          | 채팅                                    | 커뮤니티                                       |
| --------------------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| ![마이페이지](docs/screenshots/05-mypage-grade.png) | ![채팅](docs/screenshots/06-chat.png)   | ![커뮤니티](docs/screenshots/07-community.png) |
| 활동 등급과 진행 현황                               | 브랜드와 1:1 대화, 사진 첨부, 읽음 표시 | 글·댓글, 신고                                  |

### 업체

| 대시보드                                              | 캠페인 수정                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| ![대시보드](docs/screenshots/10-seller-dashboard.png) | ![캠페인 수정](docs/screenshots/11-seller-campaign-editor.png) |

| 참여자 관리                                                 | 참여자 상세 · 평가                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| ![참여자 관리](docs/screenshots/12-seller-participants.png) | ![참여자 상세](docs/screenshots/13-seller-participant-detail.png) |
| 여러 명을 골라 한 번에 선정·미선정                          | 활동 등급, 진행 단계, 완료 후 별점과 메모                         |

| 배송 관리                                             | 구매평 환급                                      |
| ----------------------------------------------------- | ------------------------------------------------ |
| ![배송 관리](docs/screenshots/14-seller-shipping.png) | ![환급](docs/screenshots/15-seller-paybacks.png) |
| 택배사·송장번호 입력, 배송지 엑셀 내려받기            | 구매 인증 확인 후 환급 처리                      |

| 콘텐츠 성과                                                                              |
| ---------------------------------------------------------------------------------------- |
| ![콘텐츠 성과](docs/screenshots/16-seller-content-performance.png)                       |
| 캠페인을 고르면 참여자 게시물의 최근 조회수·좋아요·댓글 합계와 평균 참여율을 보여 줍니다 |

### 운영자

| 콘텐츠 최종 승인                                            | 신고·제재                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| ![최종 승인](docs/screenshots/20-admin-content-reviews.png) | ![신고 처리](docs/screenshots/21-admin-moderation.png)        |
| 업체 검토가 끝난 콘텐츠만 모아 승인                         | 신고 당시 내용, 같은 대상 신고 수, 기각·경고·가리기·이용 정지 |

| 커뮤니티 관리                                             | 운영 리포트                                           |
| --------------------------------------------------------- | ----------------------------------------------------- |
| ![커뮤니티 관리](docs/screenshots/22-admin-community.png) | ![운영 리포트](docs/screenshots/23-admin-reports.png) |
| 신고 없이도 글·댓글을 바로 가리고 다시 보이게 함          | 기간 선택, 날짜별 추이, 엑셀(요약·날짜별·상태별)      |

### 모바일

| 홈                                                          | 캠페인 상세                                                     | 채팅                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| <img src="docs/screenshots/30-mobile-home.png" width="260"> | <img src="docs/screenshots/31-mobile-campaign.png" width="260"> | <img src="docs/screenshots/32-mobile-chat.png" width="260"> |

## 화면 디자인

참여자 화면(헤더·홈·목록·상세)은 차분한 흰 바탕에 보라색(`#5B4FE9`) 한 가지만 포인트로 씁니다.

- 헤더는 두 줄입니다. 위 줄은 로고·검색·알림·찜·로그인, 아래 줄은 전체 메뉴와 주요 메뉴(현재 메뉴는 진하게)입니다.
- 신청하기 같은 행동 버튼은 사각형에 모서리만 살짝 둥글게, 카테고리처럼 고르는 버튼은 알약 모양으로 나눴습니다.
- 콘텐츠 채널(인스타그램·블로그·유튜브·클립)은 카드·목록 조건·상세에서 같은 아이콘으로 구분합니다. 인스타그램·유튜브·네이버는 공개 아이콘 묶음 [Simple Icons](https://simpleicons.org)(CC0)를 쓰고, 화면 읽기용 채널 이름을 함께 넣습니다.
- 카드에는 캠페인 종류(제품·지역 등) 대신 채널 아이콘만 둡니다. 종류는 헤더 메뉴로 고릅니다. 찜은 배경 없는 회색 선 하트입니다.
- 그 밖의 아이콘은 컴포넌트 안의 SVG로 그려 이미지 파일을 따로 두지 않습니다.
- 넓은 화면 4열 → 태블릿 3열 → 휴대폰 2열로 카드를 줄이고, 상세는 1024px 아래에서 이미지 → 요약 → 탭 → 신청 순서로 한 줄에 쌓습니다.

## 실행

백엔드를 먼저 띄웁니다(movrit-backend의 `scripts/integration.sh start`, http://localhost:18080).

```bash
nvm use
npm ci
npm run dev:integration   # http://localhost:5174 → 백엔드 18080
npm run dev               # 기본 개발 서버 → 백엔드 8080
```

통합 실행 설정은 `.env.integration`에 있고 비밀값은 없습니다. 소셜 로그인은 일반 Chrome 창에서 확인합니다.

비밀값은 저장소에 두지 않습니다. 화면 코드에 들어가는 `VITE_` 환경 변수는 브라우저에 그대로 공개되므로 키·토큰을 넣지 않고, 점검 계정 비밀번호는 실행할 때 `MOVRIT_QA_PASSWORD`로 넘깁니다. 점검 중 새로 정하는 비밀번호(임시 가입 계정, 비밀번호 재설정)는 실행할 때마다 무작위로 만듭니다. `.env`·키 파일은 `.gitignore`로 막혀 있고, `git config core.hooksPath .githooks`를 한 번 실행하면 커밋할 때마다 `.githooks/check-secrets.py`가 비밀값처럼 보이는 내용을 찾아 커밋을 멈춥니다.

## 폴더 구조

```
src/
  api/         서버 호출(기능별 파일, axios.js 한곳에서 토큰 갱신, downloadFile.js로 엑셀 저장)
  features/    기능 단위 화면과 모델
    discovery/        캠페인 탐색(서버 검색·페이지)·상세·신청, 커뮤니티, 채널 아이콘·찜 버튼
    membership/       마이페이지, 내 캠페인 작업 공간, 콘텐츠 제출
    business/         업체 화면(참여자·배송·환급·콘텐츠)
    sellerCampaigns/  캠페인 등록·수정·복제
    purchaseReview/   구매 정보·구매 인증·환급
    shipping/         송장·배송 상태
    contentMetric/    게시물 성과 기록, 캠페인 성과 요약
    participation/    등급·패널티·방문 예약·평가·신고, 참여 조정(철회·취소·연장), 내 캠페인 달력
    chat/             채팅방, 첨부, 검색, 입력 중 표시
    admin/            운영자 화면 모델(커뮤니티 관리, 리포트 기간)
  pages/       경로에 바로 연결되는 화면
  components/  공통 레이아웃·헤더
qa/
  e2e/         실제 서버에 대고 돌리는 Playwright 점검
  portfolio/   시연 데이터 만들기, 화면 캡처, 시연 영상 녹화
scripts/       node:test 단위 테스트
```

화면 컴포넌트에는 표시만 두고, 상태 이름 바꾸기·버튼 노출 조건·입력 검사처럼 규칙이 있는 부분은 `*Model.js`로 빼서 단위 테스트를 붙였습니다. 홈 화면의 '마감이 가까운 순'·'선정 확률이 높은 순'·이번 주 표시도 `homeModel`로 빼서 테스트합니다. 예를 들어 `shippingModel`은 송장번호 형식 검사와 "바뀐 행만 골라 저장"을, `participationModel`은 일괄 선정 가능 여부, 방문 예약 입력 검사, 상황에 맞는 패널티 종류 고르기를, `participationChangeModel`은 취소·연장 입력 검사와 달력 일정 계산을 맡습니다.

## 주요 경로

경로는 92개이고, 첫 화면을 빼고는 지연 로딩합니다.

| 대상   | 경로                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 참여자 | `/home`, `/category/:section`, `/campaign/:campaignId`, `/mypage`, `/mypage/campaigns`, `/messages`, `/community/:board`, `/settings`             |
| 업체   | `/seller/dashboard`, `/seller/campaigns`, `/seller/participants`, `/seller/shipping`, `/seller/paybacks`, `/seller/contents`, `/seller/messages`  |
| 운영자 | `/admin/dashboard`, `/admin/content-reviews`, `/admin/community`, `/admin/moderation`, `/admin/reports`, `/admin/participation`, `/admin/members` |

## 테스트와 점검

```bash
npm test               # 단위 테스트 201개 (scripts/*.test.mjs)
npm run lint
npm run format:check
npm run build
```

`qa/e2e`에는 실제 서버에 붙어 화면을 조작하는 Playwright 스크립트가 있습니다. 점검용 계정과 점검용 캠페인만 만들고 바꿉니다.

- `e2e-flow.mjs`: 캠페인 등록 → 신청 → 선정 → 콘텐츠 제출 → 업체 검토 → 운영자 최종 승인
- `qa-checks.mjs`: 동시 선정 시 정원 초과 여부, 다른 브랜드 권한, 신청 내용 보존
- `purchase-review-check.mjs`, `shipping-check.mjs`, `participation-check.mjs`, `chat-extras-check.mjs`: 구매평, 배송, 패널티·예약·평가, 채팅 첨부·검색
- `access-control-check.mjs`: 주소의 ID만 바꿔 남의 신청·채팅·배송·증빙·주소·알림, 다른 업체의 캠페인·참여자, 운영자 기능에 접근할 수 없는지(51항목), 비공개 업로드 폴더 차단
- `participation-change-check.mjs`: 신청 철회, 참여 취소(단순·협의+증빙), 기간 연장, 마감 지난 미제출 자동 취소, 업체 미선정, 방문형 선착순, 내 캠페인 달력, 채널 기본 요건
- `channel-bio-code-check.mjs`: SNS 소개글 인증 코드 발급, 네이버 블로그 RSS 확인, 인스타그램 운영자 확인 넘김과 승인
- `ops-extras-check.mjs`: 커뮤니티 가리기·다시 보이기, 리포트 기간·엑셀, 콘텐츠 성과 기록, 캠페인 서버 검색·페이지
- `route-check.mjs`: 역할별로 전체 경로를 열어 오류·빈 화면 확인

자세한 실행 방법은 [qa/e2e/README.md](qa/e2e/README.md)에 있습니다.

## 포트폴리오 자료 다시 만들기

```bash
export MOVRIT_QA_PASSWORD='...'                # 저장소에 적지 않습니다
node qa/portfolio/seed-portfolio.mjs           # 시연 계정·캠페인 44개·진행 데이터 (사진은 fetch-images.mjs로 자동 내려받기, 여러 번 실행해도 같은 결과)
node qa/portfolio/capture-screens.mjs          # docs/screenshots/*.png
node qa/portfolio/record-demo.mjs              # 장면별 프레임 → ffmpeg로 mp4 변환
```
