// 시연용 캠페인 목록을 골고루 채웁니다(통합 DB 전용). seed-portfolio.mjs 가 마지막에 부릅니다.
//
// - 업체 6곳·브랜드 27개·참여자 5명을 더 만들고, 캠페인 39개를 실제 API로 등록합니다.
// - 종류(제품·지역·기자단·구매평)·카테고리·지역·채널(블로그·인스타그램·유튜브·클립)·선정 방식(직접·운영자·선착순)·
//   모집 상태(오늘 오픈·마감 임박·모집 중·모집 종료·진행 중)·프리미어가 고루 섞이게 했습니다.
// - 대표 이미지는 위키미디어 공용의 자유 이용 사진입니다(출처: IMAGE_CREDITS.md, 받기: fetch-images.mjs).
// - 브랜드·매장·주소·상품 주소는 모두 지어낸 것입니다.
// - 이미 만든 데이터는 건너뜁니다(여러 번 실행해도 같은 결과).
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { api, call, login } from '../e2e/e2e-lib.mjs'
import { fetchImages } from './fetch-images.mjs'

const PSQL =
  process.env.MOVRIT_PSQL ||
  '/Applications/Postgres.app/Contents/Versions/latest/bin/psql'
const DB = process.env.MOVRIT_DB || 'movrit_integration'
const sql = (query) =>
  execFileSync(
    PSQL,
    ['-h', 'localhost', '-U', 'movrit_user', '-d', DB, '-tA', '-c', query],
    { encoding: 'utf8' },
  ).trim()
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`
const pad = (n) => String(n).padStart(2, '0')
const at = (days, hour = 10) => {
  const d = new Date(Date.now() + days * 86400_000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00:00`
}
const imagePath = (name) =>
  new URL(`./images/${name}.jpg`, import.meta.url).pathname
const log = (...args) => console.log('·', ...args)

// ───────── 계정: 업체 6곳(브랜드 포함)·참여자 5명 ─────────
// [이메일, 대표 이름, 닉네임, 업체명, 사업자 표시 번호, 브랜드 목록]
const SELLERS = [
  [
    'haru.store@movrit.local',
    '한서윤',
    '하루상점',
    '하루상점',
    'DEMO-HARU-STORE',
    [
      ['하루 리빙', '매일 쓰는 침구와 생활 소품을 만듭니다.'],
      ['소소 문구', '기록이 즐거워지는 문구 브랜드입니다.'],
      ['포근 펫', '반려동물이 편히 쉬는 용품을 만듭니다.'],
      ['꼬마숲', '원목으로 만든 아이 장난감 브랜드입니다.'],
    ],
  ],
  [
    'techon@movrit.local',
    '최도윤',
    '테크온',
    '테크온 코리아',
    'DEMO-TECHON',
    [
      ['테크온', '책상 위를 편하게 만드는 디지털 기기 브랜드입니다.'],
      ['러닝랩', '가볍게 달리는 사람을 위한 러닝화 브랜드입니다.'],
      ['캔버스데이', '튼튼한 캔버스 가방을 만듭니다.'],
    ],
  ],
  [
    'local.table@movrit.local',
    '윤가은',
    '로컬테이블',
    '로컬테이블',
    'DEMO-LOCAL-TABLE',
    [
      ['바다식탁', '부산 기장의 해산물 그릴 식당입니다.'],
      ['밀앤밀 베이커리', '대구 동성로의 천연 발효빵 가게입니다.'],
      ['한그릇 면옥', '대전 둔산동의 냉면 전문점입니다.'],
      ['브런치 소풍', '광주 동명동의 브런치 카페입니다.'],
      ['오후의 라떼', '서울 연남동의 로스터리 카페입니다.'],
      ['비스트로 온', '부산 해운대의 다이닝 비스트로입니다.'],
    ],
  ],
  [
    'shim.stay@movrit.local',
    '서지훈',
    '쉼스테이',
    '쉼 스테이',
    'DEMO-SHIM-STAY',
    [
      ['숲속 글램핑', '강원 홍천 숲속의 글램핑장입니다.'],
      ['파도 오션호텔', '부산 송정 바다 앞 호텔입니다.'],
      ['전주 한옥 쉼', '전주 한옥마을의 한옥 숙소입니다.'],
    ],
  ],
  [
    'beauty.ground@movrit.local',
    '강하린',
    '뷰티그라운드',
    '뷰티 그라운드',
    'DEMO-BEAUTY-GROUND',
    [
      ['살롱 드 송도', '인천 송도의 헤어 살롱입니다.'],
      ['네일 아뜰리에', '서울 성수동의 네일 숍입니다.'],
      ['무브 필라테스', '경기 판교의 기구 필라테스 스튜디오입니다.'],
      ['컬러 립랩', '촉촉한 립 제품을 만드는 브랜드입니다.'],
      ['결 헤어랩', '손상모를 위한 헤어케어 브랜드입니다.'],
      ['데일리 메이크업', '가볍게 바르는 베이스 메이크업 브랜드입니다.'],
      ['흙과 손 공방', '경기 이천의 도자기 공방입니다.'],
    ],
  ],
  [
    'healthy.day@movrit.local',
    '오민재',
    '건강한하루',
    '건강한 하루',
    'DEMO-HEALTHY-DAY',
    [
      ['데일리 비타민', '하루 한 알 영양제 브랜드입니다.'],
      ['손결', '향이 은은한 핸드크림 브랜드입니다.'],
      ['셰프의 칼', '집에서 쓰기 좋은 주방 칼을 만듭니다.'],
      ['아침 그래놀라', '견과류를 듬뿍 넣은 그래놀라 브랜드입니다.'],
      ['엄마손 김치', '국산 재료로 담근 김치 브랜드입니다.'],
      ['초록 다원', '하동 녹차를 담는 차 브랜드입니다.'],
      ['바삭 스낵', '튀기지 않은 구운 과자 브랜드입니다.'],
      ['한결 원두', '산지별 원두를 볶는 로스터리입니다.'],
    ],
  ],
  [
    'local.mag@movrit.local',
    '임유진',
    '로컬매거진',
    '로컬 매거진',
    'DEMO-LOCAL-MAG',
    [['로컬 매거진', '동네 가게와 공간을 소개하는 매거진입니다.']],
  ],
]
// [이메일, 이름, 닉네임, [채널, 팔로워 수]]
const CREATORS = [
  [
    'seoyeon@movrit.local',
    '정서연',
    '서연로그',
    [
      ['BLOG', 2400],
      ['INSTAGRAM', 5100],
    ],
  ],
  ['dohyun@movrit.local', '한도현', '도현의하루', [['YOUTUBE', 15800]]],
  ['yuna@movrit.local', '송유나', '유나픽', [['INSTAGRAM', 21300]]],
  ['jiwoo@movrit.local', '배지우', '지우맛집', [['BLOG', 4700]]],
  [
    'taemin@movrit.local',
    '조태민',
    '태민테크',
    [
      ['YOUTUBE', 9200],
      ['BLOG', 1300],
    ],
  ],
]

function prepareAccounts() {
  const hash = sql(
    `select password_hash from member where email = 'demo-brand@movrit.local'`,
  )
  const member = (email, name, nickname) =>
    sql(`insert into member (email, password_hash, name, nickname, role, status, email_verified_at, created_at, updated_at)
         values (${quote(email)}, ${quote(hash)}, ${quote(name)}, ${quote(nickname)}, 'USER', 'ACTIVE', now(), now(), now())
         on conflict (email) do nothing`)
  for (const [email, name, nickname, business, number, brands] of SELLERS) {
    member(email, name, nickname)
    sql(`insert into seller_profile (member_id, business_name, brand_name, business_number, representative_name, status, created_at, updated_at)
         select id, ${quote(business)}, ${quote(brands[0][0])}, ${quote(number)}, ${quote(name)}, 'APPROVED', now(), now()
         from member where email = ${quote(email)} on conflict (member_id) do nothing`)
    for (const [brand, description] of brands)
      sql(`insert into brand (seller_id, name, description, status, created_at, updated_at)
           select s.id, ${quote(brand)}, ${quote(description)}, 'ACTIVE', now(), now() from seller_profile s
           where s.business_number = ${quote(number)}
             and not exists (select 1 from brand b where b.seller_id = s.id and b.name = ${quote(brand)})`)
  }
  for (const [email, name, nickname, metrics] of CREATORS) {
    member(email, name, nickname)
    for (const [channel, value] of metrics)
      sql(`insert into member_channel_metric (member_id, channel_type, metric_type, metric_value, measurement_period, measured_at, verification_status, created_at, updated_at)
           select id, ${quote(channel)}, 'FOLLOWER_COUNT', ${value}, null, now(), 'VERIFIED', now(), now() from member where email = ${quote(email)}
           on conflict (member_id, channel_type, metric_type) do nothing`)
  }
}
const brandOf = (name) => {
  const row =
    sql(`select b.id, s.business_number from brand b join seller_profile s on s.id = b.seller_id
                   where b.name = ${quote(name)} and s.business_number like 'DEMO-%' limit 1`)
  const [id, number] = row.split('|')
  return { id: Number(id), number }
}

// ───────── 캠페인 목록 ─────────
// ends: 모집 마감까지 남은 날(0이면 오늘 밤 마감), starts: 모집 시작(0이면 오늘 0시에 오픈)
// state: 'open'(기본) · 'closed'(모집 종료, 발표 대기) · 'running'(모집 종료 뒤 선정까지 마쳐 진행 중)
// who: 신청할 참여자, pick: 선정할 참여자, mode: 선정 방식, premier: 프리미어 표시
const SEOUL = (venueName, address1, postalCode, address2 = null) => ({
  venueName,
  postalCode,
  address1,
  address2,
})
const CAMPAIGNS = [
  // ── 제품(배송형) ──
  {
    brand: '데일리 메이크업',
    image: 'makeup',
    category: '뷰티',
    type: 'PRODUCT',
    channel: 'INSTAGRAM',
    recruit: 8,
    ends: 5,
    premier: true,
    title: '물광 쿠션 파운데이션 3주 체험단',
    reward: '물광 쿠션 본품 + 리필 (4만 원 상당)',
    description:
      '건조한 계절에도 들뜨지 않는 물광 쿠션을 3주 동안 써 보고, 아침부터 저녁까지 지속력을 기록해 주세요.',
    mission: '아침에 바르고 오후 6시에 한 번 더 찍어 지속력을 비교해 주세요.',
    channelGuide: '인스타그램 피드 사진 4장 이상(손등 발색 1장 포함)',
    requirement: '#데일리메이크업 #물광쿠션 #협찬',
    who: ['yuna', 'seoyeon', 'minji', 'haneul'],
  },
  {
    brand: '컬러 립랩',
    image: 'lipstick',
    category: '뷰티',
    type: 'PRODUCT',
    channel: 'CLIP',
    recruit: 10,
    ends: 2,
    title: '틴티드 립밤 6색 발색 클립 체험',
    reward: '틴티드 립밤 6색 세트',
    description:
      '촉촉한 틴티드 립밤 6색을 직접 발라 보고 색 차이를 짧은 영상으로 보여 주세요.',
    mission: '자연광에서 6색을 차례로 발라 비교해 주세요.',
    channelGuide: '네이버 클립 또는 인스타그램 릴스 15초 이상',
    requirement: '색 이름 자막 필수, #협찬 표기',
    who: ['yuna', 'minji', 'seoyeon', 'haneul', 'jiwoo', 'dohyun'],
  },
  {
    brand: '결 헤어랩',
    image: 'haircare',
    category: '뷰티',
    type: 'PRODUCT',
    channel: 'BLOG',
    recruit: 5,
    ends: 9,
    title: '손상모 헤어 에센스 2주 사용 후기',
    reward: '헤어 에센스 100ml + 트리트먼트 200ml',
    description:
      '염색·펌으로 지친 머릿결에 2주 동안 써 보고 사용 전후를 비교해 주세요.',
    mission: '사용 첫날과 14일째 같은 조명에서 머리끝을 찍어 주세요.',
    channelGuide: '블로그 사진 10장 이상, 본문 1,000자 이상',
    requirement: '제목에 "결 헤어랩" 포함',
    who: ['seoyeon', 'jiwoo'],
  },
  {
    brand: '아침 그래놀라',
    image: 'granola',
    category: '식품',
    type: 'PRODUCT',
    channel: 'INSTAGRAM',
    recruit: 4,
    ends: 0,
    state: 'running',
    title: '견과 듬뿍 그래놀라 아침 식단 체험',
    reward: '그래놀라 3종 (각 400g)',
    description:
      '요거트·우유와 어울리는 그래놀라 3종으로 일주일 아침을 차려 보고 기록해 주세요.',
    mission: '서로 다른 아침 상차림 3가지를 찍어 주세요.',
    channelGuide: '인스타그램 피드 1개 + 스토리 2개',
    requirement: '#아침그래놀라 #협찬',
    who: ['minji', 'yuna', 'jiwoo', 'seoyeon', 'haneul'],
    pick: ['minji', 'yuna'],
  },
  {
    brand: '엄마손 김치',
    image: 'kimchi',
    category: '식품',
    type: 'PRODUCT',
    channel: 'BLOG',
    recruit: 6,
    ends: 7,
    title: '국산 배추 포기김치 2kg 체험단',
    reward: '포기김치 2kg + 깍두기 1kg',
    description:
      '국산 배추와 고춧가루로 담근 포기김치를 받아 집밥 한 상을 차려 소개해 주세요.',
    mission: '김치로 만든 요리 1가지 이상을 함께 올려 주세요.',
    channelGuide: '블로그 사진 12장 이상',
    requirement: '보관 방법 안내 문구 포함',
    who: ['jiwoo', 'haneul', 'junho'],
  },
  {
    brand: '초록 다원',
    image: 'tea',
    category: '식품',
    type: 'PRODUCT',
    channel: 'INSTAGRAM',
    recruit: 5,
    ends: 12,
    starts: 0,
    title: '하동 첫물 녹차 티타임 체험',
    reward: '첫물 녹차 50g + 유리 다관',
    description:
      '올봄 처음 딴 하동 녹차로 나만의 티타임을 즐기고 공간과 함께 소개해 주세요.',
    mission: '찻잎·우린 차·찻자리를 모두 담아 주세요.',
    channelGuide: '인스타그램 피드 사진 3장 이상',
    requirement: '#초록다원 #하동녹차 #협찬',
    who: ['seoyeon'],
  },
  {
    brand: '테크온',
    image: 'earphones',
    category: '디지털',
    type: 'PRODUCT',
    channel: 'YOUTUBE',
    recruit: 3,
    ends: 4,
    mode: 'OPERATOR',
    premier: true,
    title: '유선 이어폰 음질 비교 리뷰 (운영자 선정)',
    reward: '하이파이 유선 이어폰 1개 (8만 원 상당)',
    description:
      '출퇴근길에 2주 동안 써 보고 음질·착용감을 다른 이어폰과 비교해 주세요. 선정은 운영자가 진행합니다.',
    mission: '장르별 음악 3곡 이상으로 들어 보고 느낌을 말해 주세요.',
    channelGuide: '유튜브 영상 5분 이상',
    requirement: '영상 설명에 협찬 표기',
    who: ['dohyun', 'taemin', 'junho'],
  },
  {
    brand: '테크온',
    image: 'keyboard',
    category: '디지털',
    type: 'PRODUCT',
    channel: 'YOUTUBE',
    recruit: 2,
    ends: 0,
    state: 'running',
    title: '저소음 기계식 키보드 타건 영상 체험',
    reward: '저소음 기계식 키보드 1대',
    description:
      '사무실에서도 쓸 수 있는 저소음 키보드의 타건감과 소리를 영상으로 담아 주세요.',
    mission: '타건 소리를 다른 키보드와 비교해 주세요.',
    channelGuide: '유튜브 영상 3분 이상',
    requirement: '스위치 종류 언급 필수',
    who: ['taemin', 'dohyun'],
    pick: ['taemin'],
  },
  {
    brand: '포근 펫',
    image: 'dogbowl',
    category: '반려동물',
    type: 'PRODUCT',
    channel: 'INSTAGRAM',
    recruit: 6,
    ends: 3,
    title: '대형견 미끄럼 방지 식기 체험단',
    reward: '스테인리스 식기 2개 + 받침대',
    description:
      '밥 먹을 때 그릇이 밀리는 대형견을 위한 미끄럼 방지 식기를 써 보고 소개해 주세요.',
    mission: '식사 시간 영상 또는 사진 3장 이상을 올려 주세요.',
    channelGuide: '인스타그램 피드 또는 릴스',
    requirement: '#포근펫 #협찬',
    who: ['yuna', 'haneul', 'minji'],
  },
  {
    brand: '포근 펫',
    image: 'cattoy',
    category: '반려동물',
    type: 'PRODUCT',
    channel: 'CLIP',
    recruit: 8,
    ends: 6,
    title: '고양이 깃털 낚싯대 장난감 클립 체험',
    reward: '깃털 낚싯대 3종 + 숨숨집',
    description: '집사와 고양이가 함께 노는 시간을 짧은 영상으로 담아 주세요.',
    mission: '고양이가 노는 모습을 15초 이상 찍어 주세요.',
    channelGuide: '네이버 클립 또는 인스타그램 릴스',
    requirement: '#포근펫 #고양이장난감 #협찬',
    who: ['minji', 'yuna'],
  },
  {
    brand: '꼬마숲',
    image: 'woodtoy',
    category: '유아동',
    type: 'PRODUCT',
    channel: 'BLOG',
    recruit: 4,
    ends: 10,
    title: '원목 자동차 장난감 세트 체험단',
    reward: '원목 자동차 5종 세트',
    description:
      '모서리를 둥글게 다듬은 원목 자동차로 아이와 함께 논 이야기를 들려주세요.',
    mission: '아이가 노는 모습(얼굴은 가려 주세요)과 마감 상태를 찍어 주세요.',
    channelGuide: '블로그 사진 10장 이상',
    requirement: '사용 연령 안내 포함',
    who: ['haneul', 'seoyeon'],
  },
  {
    brand: '하루 리빙',
    image: 'bedding',
    category: '생활',
    type: 'PRODUCT',
    channel: 'BLOG',
    recruit: 3,
    ends: 8,
    premier: true,
    title: '호텔식 순면 침구 세트 체험단',
    reward: '퀸 사이즈 침구 세트 (이불 커버·베개 커버 2)',
    description:
      '호텔에서 쓰는 순면 침구 세트로 침실을 꾸미고 촉감과 세탁 후 변화를 알려 주세요.',
    mission: '설치 전후 침실 사진과 세탁 1회 뒤 사진을 올려 주세요.',
    channelGuide: '블로그 사진 15장 이상',
    requirement: '세탁 방법 안내 포함',
    who: ['seoyeon', 'minji', 'haneul', 'jiwoo', 'yuna', 'junho', 'dohyun'],
  },
  {
    brand: '하루 리빙',
    image: 'aroma',
    category: '생활',
    type: 'PRODUCT',
    channel: 'INSTAGRAM',
    recruit: 6,
    ends: 11,
    title: '세라믹 아로마 버너 공간 체험',
    reward: '세라믹 아로마 버너 + 오일 2종',
    description:
      '거실이나 침실에 두는 세라믹 아로마 버너로 하루를 마무리하는 시간을 담아 주세요.',
    mission: '버너를 둔 공간 사진 3장 이상',
    channelGuide: '인스타그램 피드',
    requirement: '#하루리빙 #협찬',
    who: ['minji'],
  },
  {
    brand: '테크온',
    image: 'diffuser',
    category: '디지털',
    type: 'PRODUCT',
    channel: 'CLIP',
    recruit: 5,
    ends: 1,
    title: '무드등 초음파 디퓨저 클립 체험',
    reward: '초음파 디퓨저 1대 + 오일 1종',
    description:
      '7가지 색으로 바뀌는 무드등 디퓨저의 분위기를 짧은 영상으로 보여 주세요.',
    mission: '불을 끈 방에서 색이 바뀌는 모습을 찍어 주세요.',
    channelGuide: '네이버 클립 15초 이상',
    requirement: '#테크온 #디퓨저 #협찬',
    who: ['yuna', 'taemin', 'minji', 'dohyun'],
  },
  {
    brand: '러닝랩',
    image: 'sneakers',
    category: '패션',
    type: 'PRODUCT',
    channel: 'YOUTUBE',
    recruit: 4,
    ends: 14,
    starts: 0,
    title: '야간 러닝용 LED 러닝화 체험',
    reward: 'LED 러닝화 1켤레',
    description:
      '밤에 달릴 때 눈에 잘 띄는 LED 러닝화를 신고 5km 이상 달린 소감을 들려주세요.',
    mission: '야간 러닝 3회 이상, 착용감과 불빛을 함께 보여 주세요.',
    channelGuide: '유튜브 영상 3분 이상',
    requirement: '사이즈 선택 팁 포함',
    who: ['dohyun'],
  },
  {
    brand: '캔버스데이',
    image: 'tote',
    category: '패션',
    type: 'PRODUCT',
    channel: 'INSTAGRAM',
    recruit: 10,
    ends: 6,
    title: '두 가지 색 캔버스 토트백 데일리룩',
    reward: '캔버스 토트백 1개',
    description:
      '출근·장보기·여행에 두루 메는 캔버스 토트백으로 데일리룩을 보여 주세요.',
    mission: '서로 다른 코디 2가지 이상',
    channelGuide: '인스타그램 피드 사진 3장 이상',
    requirement: '#캔버스데이 #협찬',
    who: ['yuna', 'seoyeon', 'minji'],
  },
  {
    brand: '소소 문구',
    image: 'planner',
    category: '도서',
    type: 'PRODUCT',
    channel: 'BLOG',
    recruit: 6,
    ends: 5,
    title: '2027 데일리 플래너 미리 써 보기',
    reward: '데일리 플래너 + 젤펜 3종',
    description:
      '새해를 준비하는 데일리 플래너를 한 달 먼저 써 보고 내 기록 방법을 소개해 주세요.',
    mission: '일주일 동안 쓴 페이지를 보여 주세요.',
    channelGuide: '블로그 사진 8장 이상',
    requirement: '속지 구성 소개 포함',
    who: ['seoyeon', 'haneul'],
  },
  {
    brand: '바삭 스낵',
    image: 'snack',
    category: '식품',
    type: 'PRODUCT',
    channel: 'CLIP',
    recruit: 15,
    ends: 3,
    title: '구운 과자 3종 간식 클립 체험',
    reward: '구운 과자 3종 박스',
    description:
      '튀기지 않고 구운 과자 3종을 맛보고 바삭한 소리와 함께 짧게 소개해 주세요.',
    mission: '세 가지 맛을 차례로 먹어 보는 영상',
    channelGuide: '네이버 클립 또는 유튜브 쇼츠',
    requirement: '#바삭스낵 #협찬',
    who: ['jiwoo', 'dohyun', 'minji', 'junho', 'taemin', 'yuna'],
  },
  // ── 지역(방문형) ──
  {
    brand: '바다식탁',
    image: 'seafood',
    category: '맛집',
    type: 'LOCAL',
    region: '부산',
    channel: 'BLOG',
    recruit: 3,
    ends: 4,
    premier: true,
    title: '기장 해산물 그릴 플래터 2인 체험',
    reward: '해산물 그릴 플래터 2인 (9만 원 상당)',
    description:
      '기장 앞바다에서 들어온 해산물을 숯불에 구운 플래터를 2인이 즐기고 소개해 주세요.',
    mission: '메뉴와 바다 전망을 함께 담아 주세요.',
    channelGuide: '블로그 사진 15장 이상, 지도 첨부',
    requirement: '제목에 "기장 바다식탁" 포함',
    location: SEOUL(
      '바다식탁 기장점',
      '부산광역시 기장군 기장읍 해안로 32',
      '46083',
    ),
    who: ['jiwoo', 'haneul', 'seoyeon'],
  },
  {
    brand: '비스트로 온',
    image: 'finedining',
    category: '맛집',
    type: 'LOCAL',
    region: '부산',
    channel: 'INSTAGRAM',
    recruit: 2,
    ends: 0,
    state: 'running',
    title: '해운대 비스트로 디너 코스 방문 체험',
    reward: '디너 코스 2인 (14만 원 상당)',
    description:
      '관자 구이와 아스파라거스로 시작하는 계절 디너 코스를 즐기고 소개해 주세요.',
    mission: '코스 요리 전체와 매장 분위기를 담아 주세요.',
    channelGuide: '인스타그램 피드 + 스토리',
    requirement: '매장 계정 태그 필수',
    location: SEOUL(
      '비스트로 온',
      '부산광역시 해운대구 달맞이길 20',
      '48100',
      '3층',
    ),
    who: ['haneul', 'yuna', 'jiwoo'],
    pick: ['haneul'],
  },
  {
    brand: '밀앤밀 베이커리',
    image: 'bakery',
    category: '테이크아웃',
    type: 'LOCAL',
    region: '대구',
    channel: 'INSTAGRAM',
    recruit: 4,
    ends: 7,
    mode: 'FIRST_COME',
    title: '천연 발효빵 4종 포장 체험 (선착순)',
    reward: '발효빵 4종 포장',
    description:
      '매일 아침 굽는 천연 발효빵 4종을 포장해 가 맛보고 소개해 주세요. 신청 순서대로 바로 선정됩니다.',
    mission: '빵 단면 사진을 꼭 넣어 주세요.',
    channelGuide: '인스타그램 피드 사진 3장 이상',
    requirement: '#밀앤밀 #대구빵집 #협찬',
    location: SEOUL('밀앤밀 베이커리', '대구광역시 중구 동성로2길 15', '41939'),
    who: ['jiwoo', 'minji'],
  },
  {
    brand: '오후의 라떼',
    image: 'latte',
    category: '맛집',
    type: 'LOCAL',
    region: '서울',
    channel: 'INSTAGRAM',
    recruit: 3,
    ends: 3,
    mode: 'FIRST_COME',
    title: '연남동 로스터리 라떼 2잔 체험 (선착순)',
    reward: '시그니처 라떼 2잔 + 디저트 1개',
    description:
      '직접 볶은 원두로 내린 라떼와 디저트를 즐기고 공간을 소개해 주세요. 신청 순서대로 바로 선정되며 3명이 차면 마감됩니다.',
    mission: '라떼 아트와 매장 창가 자리를 담아 주세요.',
    channelGuide: '인스타그램 피드',
    requirement: '#오후의라떼 #연남동카페 #협찬',
    location: SEOUL(
      '오후의 라떼',
      '서울특별시 마포구 동교로 230',
      '03991',
      '1층',
    ),
    who: ['minji', 'yuna', 'seoyeon'],
  },
  {
    brand: '한그릇 면옥',
    image: 'naengmyeon',
    category: '맛집',
    type: 'LOCAL',
    region: '대전',
    channel: 'BLOG',
    recruit: 5,
    ends: 9,
    title: '둔산동 물냉면·수육 2인 체험',
    reward: '물냉면 2그릇 + 수육 소',
    description:
      '한우 육수로 만든 물냉면과 수육을 2인이 즐기고 맛을 소개해 주세요.',
    mission: '면 식감과 육수 색이 잘 보이게 찍어 주세요.',
    channelGuide: '블로그 사진 12장 이상, 지도 첨부',
    requirement: '제목에 "둔산동 냉면" 포함',
    location: SEOUL('한그릇 면옥', '대전광역시 서구 둔산로 100', '35242'),
    who: ['jiwoo'],
  },
  {
    brand: '브런치 소풍',
    image: 'pancake',
    category: '맛집',
    type: 'LOCAL',
    region: '광주',
    channel: 'INSTAGRAM',
    recruit: 4,
    ends: 12,
    starts: 0,
    title: '동명동 브런치 팬케이크 세트 체험',
    reward: '팬케이크 브런치 세트 2인',
    description:
      '수플레 팬케이크와 커피로 구성된 브런치 세트를 즐기고 소개해 주세요.',
    mission: '음식과 매장 햇살 자리를 함께 담아 주세요.',
    channelGuide: '인스타그램 피드 사진 3장 이상',
    requirement: '#브런치소풍 #동명동브런치 #협찬',
    location: SEOUL('브런치 소풍', '광주광역시 동구 동명로 21', '61477', '2층'),
    who: [],
  },
  {
    brand: '숲속 글램핑',
    image: 'glamping',
    category: '숙박',
    type: 'LOCAL',
    region: '강원',
    channel: 'YOUTUBE',
    recruit: 2,
    ends: 0,
    state: 'running',
    title: '홍천 숲속 글램핑 1박 체험',
    reward: '글램핑 1박 (2인, 바비큐 포함)',
    description:
      '숲속 글램핑장에서 1박을 머물며 낮과 밤의 분위기를 영상으로 담아 주세요.',
    mission: '텐트 안·바비큐·밤하늘을 모두 담아 주세요.',
    channelGuide: '유튜브 브이로그 5분 이상',
    requirement: '예약 방법 안내 포함',
    location: SEOUL(
      '숲속 글램핑',
      '강원특별자치도 홍천군 서면 팔봉산로 50',
      '25108',
    ),
    who: ['dohyun', 'yuna', 'haneul'],
    pick: ['dohyun'],
  },
  {
    brand: '파도 오션호텔',
    image: 'oceanhotel',
    category: '숙박',
    type: 'LOCAL',
    region: '부산',
    channel: 'INSTAGRAM',
    recruit: 1,
    ends: 2,
    premier: true,
    title: '송정 오션뷰 호텔 1박 체험',
    reward: '오션뷰 디럭스 1박 (2인, 조식 포함)',
    description:
      '바다가 보이는 객실과 수영장을 이용하고 호텔의 하루를 소개해 주세요.',
    mission: '객실 전망·수영장·조식을 모두 담아 주세요.',
    channelGuide: '인스타그램 피드 1개 + 릴스 1개',
    requirement: '호텔 계정·위치 태그 필수',
    location: SEOUL(
      '파도 오션호텔',
      '부산광역시 해운대구 송정해변로 50',
      '48071',
    ),
    who: ['yuna', 'seoyeon', 'haneul', 'minji', 'jiwoo'],
  },
  {
    brand: '전주 한옥 쉼',
    image: 'hanok',
    category: '숙박',
    type: 'LOCAL',
    region: '전라',
    channel: 'BLOG',
    recruit: 2,
    ends: 10,
    title: '전주 한옥마을 한옥 독채 1박',
    reward: '한옥 독채 1박 (2인)',
    description:
      '마당이 있는 한옥 독채에서 하룻밤을 보내고 한옥마을 산책 코스와 함께 소개해 주세요.',
    mission: '방·마당·주변 산책길을 담아 주세요.',
    channelGuide: '블로그 사진 20장 이상, 지도 첨부',
    requirement: '체크인·체크아웃 안내 포함',
    location: SEOUL(
      '전주 한옥 쉼',
      '전북특별자치도 전주시 완산구 은행로 30',
      '55041',
    ),
    who: ['seoyeon', 'haneul'],
  },
  {
    brand: '살롱 드 송도',
    image: 'salon',
    category: '뷰티',
    type: 'LOCAL',
    region: '인천',
    channel: 'INSTAGRAM',
    recruit: 3,
    ends: 5,
    title: '송도 헤어 살롱 컷·클리닉 체험',
    reward: '디자인 컷 + 두피 클리닉',
    description:
      '상담부터 컷, 두피 클리닉까지 받아 보고 시술 전후를 소개해 주세요.',
    mission: '시술 전후 사진(얼굴은 선택)을 비교해 주세요.',
    channelGuide: '인스타그램 피드 사진 3장 이상',
    requirement: '#살롱드송도 #협찬',
    location: SEOUL(
      '살롱 드 송도',
      '인천광역시 연수구 송도과학로 32',
      '21984',
      '2층',
    ),
    who: ['yuna', 'minji'],
  },
  {
    brand: '네일 아뜰리에',
    image: 'nail',
    category: '뷰티',
    type: 'LOCAL',
    region: '서울',
    channel: 'INSTAGRAM',
    recruit: 5,
    ends: 8,
    mode: 'FIRST_COME',
    title: '성수 젤네일 원컬러 체험 (선착순)',
    reward: '젤네일 원컬러 + 케어',
    description:
      '원하는 색으로 젤네일 원컬러를 받고 지속력을 소개해 주세요. 신청 순서대로 바로 선정됩니다.',
    mission: '시술 당일과 7일 뒤 손톱을 비교해 주세요.',
    channelGuide: '인스타그램 피드 또는 릴스',
    requirement: '#네일아뜰리에 #성수네일 #협찬',
    location: SEOUL(
      '네일 아뜰리에',
      '서울특별시 성동구 성수이로 88',
      '04782',
      '3층',
    ),
    who: ['minji', 'seoyeon'],
  },
  {
    brand: '무브 필라테스',
    image: 'pilates',
    category: '기타',
    type: 'LOCAL',
    region: '경기',
    channel: 'YOUTUBE',
    recruit: 3,
    ends: 6,
    title: '판교 기구 필라테스 4회 체험',
    reward: '기구 필라테스 그룹 수업 4회',
    description:
      '처음 해 보는 분도 따라갈 수 있는 기구 필라테스 수업을 4회 듣고 변화를 기록해 주세요.',
    mission: '수업 분위기와 4회 뒤 느낀 점을 담아 주세요.',
    channelGuide: '유튜브 영상 또는 쇼츠',
    requirement: '다른 수강생 얼굴은 가려 주세요',
    location: SEOUL(
      '무브 필라테스',
      '경기도 성남시 분당구 판교역로 166',
      '13529',
      '4층',
    ),
    who: ['dohyun', 'yuna'],
  },
  {
    brand: '흙과 손 공방',
    image: 'pottery',
    category: '문화',
    type: 'LOCAL',
    region: '경기',
    channel: 'BLOG',
    recruit: 4,
    ends: 0,
    state: 'closed',
    title: '이천 도자기 공방 원데이 클래스',
    reward: '물레 원데이 클래스 2인 + 소성 후 택배',
    description:
      '물레로 그릇을 빚고 색을 입히는 원데이 클래스를 체험하고 소개해 주세요.',
    mission: '만드는 과정과 완성품을 담아 주세요.',
    channelGuide: '블로그 사진 15장 이상',
    requirement: '예약 방법 안내 포함',
    location: SEOUL(
      '흙과 손 공방',
      '경기도 이천시 신둔면 도자예술로 12',
      '17414',
    ),
    who: ['seoyeon', 'haneul', 'jiwoo', 'minji'],
  },
  // ── 기자단(취재 방문) ──
  {
    brand: '로컬 매거진',
    image: 'market',
    category: '문화',
    type: 'REPORTER',
    region: '제주',
    channel: 'BLOG',
    recruit: 5,
    ends: 9,
    title: '제주 동문시장 먹거리 취재 기자단',
    reward: '취재비 5만 원 + 시장 상품권 2만 원',
    description:
      '제주 동문시장의 먹거리와 상인 이야기를 취재해 소개해 주실 기자단을 모집합니다.',
    mission: '가게 3곳 이상을 방문해 대표 메뉴와 이야기를 담아 주세요.',
    channelGuide: '블로그 사진 20장 이상',
    requirement: '가게 이름·위치 정확히 표기',
    location: SEOUL(
      '제주 동문시장',
      '제주특별자치도 제주시 관덕로14길 20',
      '63282',
    ),
    who: ['jiwoo', 'seoyeon', 'haneul'],
  },
  {
    brand: '로컬 매거진',
    image: 'showroom',
    category: '문화',
    type: 'REPORTER',
    region: '서울',
    channel: 'INSTAGRAM',
    recruit: 3,
    ends: 11,
    title: '한남동 리빙 쇼룸 오픈 취재',
    reward: '취재비 5만 원',
    description:
      '새로 문을 연 리빙 쇼룸의 공간 구성과 추천 가구를 취재해 소개해 주세요.',
    mission: '공간 전경과 추천 가구 3점 이상을 담아 주세요.',
    channelGuide: '인스타그램 피드 사진 5장 이상',
    requirement: '쇼룸 운영 시간 안내 포함',
    location: SEOUL(
      '한남 리빙 쇼룸',
      '서울특별시 용산구 한남대로 42',
      '04418',
      '1층',
    ),
    who: ['seoyeon'],
  },
  {
    brand: '로컬 매거진',
    image: 'gallery',
    category: '문화',
    type: 'REPORTER',
    region: '서울',
    channel: 'BLOG',
    recruit: 4,
    ends: 1,
    title: '삼청동 갤러리 기획전 관람 후기 기자단',
    reward: '취재비 3만 원 + 전시 도록',
    description:
      '삼청동 갤러리의 기획전을 관람하고 작품과 공간을 소개해 주실 기자단을 모집합니다.',
    mission: '촬영이 허용된 작품만 찍어 주세요.',
    channelGuide: '블로그 사진 10장 이상',
    requirement: '전시 기간·관람 시간 안내 포함',
    location: SEOUL('삼청 갤러리', '서울특별시 종로구 삼청로 30', '03062'),
    who: ['haneul', 'seoyeon', 'minji'],
  },
  // ── 구매평(직접 구매 후 환급) ──
  {
    brand: '한결 원두',
    image: 'coffeebean',
    category: '식품',
    type: 'PURCHASE_REVIEW',
    channel: 'OTHER',
    recruit: 10,
    ends: 6,
    title: '에티오피아 원두 200g 구매평 캠페인',
    reward: '구매평 승인 후 13,000원 환급',
    description:
      '스마트스토어에서 원두를 구매하고 포토 구매평을 남겨 주시면 승인 후 환급해 드립니다.',
    mission: '2회 이상 내려 마신 뒤 맛과 향을 적어 주세요.',
    channelGuide: '구매처 포토 구매평',
    requirement: '사진 2장 이상, 100자 이상',
    purchase: {
      storeName: '네이버 스마트스토어',
      productUrl: 'https://smartstore.naver.com/hangyeol-coffee/products/2001',
      productPrice: 16000,
      paybackAmount: 13000,
      purchaseGuide: "옵션은 '홀빈 200g'으로 구매해 주세요.",
    },
    who: ['jiwoo', 'minji'],
  },
  {
    brand: '데일리 비타민',
    image: 'vitamin',
    category: '식품',
    type: 'PURCHASE_REVIEW',
    channel: 'OTHER',
    recruit: 20,
    ends: 13,
    title: '비타민C 1000 한 달분 구매평 캠페인',
    reward: '구매평 승인 후 9,000원 환급',
    description:
      '하루 한 알 비타민C를 구매해 2주 이상 먹어 보고 포토 구매평을 남겨 주세요.',
    mission: '2주 이상 먹어 본 뒤 작성해 주세요.',
    channelGuide: '구매처 포토 구매평',
    requirement: '사진 1장 이상, 50자 이상',
    purchase: {
      storeName: '쿠팡',
      productUrl: 'https://www.coupang.com/vp/products/demo-daily-vitamin',
      productPrice: 12900,
      paybackAmount: 9000,
      purchaseGuide: '1통(60정) 옵션으로 구매해 주세요.',
    },
    who: ['junho', 'dohyun', 'haneul'],
  },
  {
    brand: '손결',
    image: 'handcream',
    category: '뷰티',
    type: 'PURCHASE_REVIEW',
    channel: 'OTHER',
    recruit: 15,
    ends: 4,
    title: '무화과 향 핸드크림 구매평 캠페인',
    reward: '구매평 승인 후 7,000원 환급',
    description:
      '무화과 향 핸드크림을 구매해 일주일 써 보고 포토 구매평을 남겨 주세요.',
    mission: '향과 흡수감을 함께 적어 주세요.',
    channelGuide: '구매처 포토 구매평',
    requirement: '사진 1장 이상',
    purchase: {
      storeName: '네이버 스마트스토어',
      productUrl: 'https://smartstore.naver.com/songyeol/products/3001',
      productPrice: 9800,
      paybackAmount: 7000,
      purchaseGuide: '50ml 단품으로 구매해 주세요.',
    },
    who: ['minji', 'yuna', 'seoyeon', 'haneul'],
  },
  {
    brand: '셰프의 칼',
    image: 'knife',
    category: '생활',
    type: 'PURCHASE_REVIEW',
    channel: 'OTHER',
    recruit: 8,
    ends: 9,
    title: '다용도 주방 칼 구매평 캠페인',
    reward: '구매평 승인 후 20,000원 환급',
    description:
      '채소·고기 모두 손질하기 좋은 다용도 주방 칼을 구매하고 사용 후기를 남겨 주세요.',
    mission: '일주일 이상 요리에 써 본 뒤 작성해 주세요.',
    channelGuide: '구매처 포토 구매평',
    requirement: '사진 2장 이상, 100자 이상',
    purchase: {
      storeName: '11번가',
      productUrl: 'https://www.11st.co.kr/products/demo-chef-knife',
      productPrice: 25900,
      paybackAmount: 20000,
      purchaseGuide: '8인치 옵션으로 구매해 주세요.',
    },
    who: ['jiwoo'],
  },
  {
    brand: '포근 펫',
    image: 'petbed',
    category: '반려동물',
    type: 'PURCHASE_REVIEW',
    channel: 'OTHER',
    recruit: 10,
    ends: 0,
    state: 'closed',
    title: '고양이 도넛 쿠션 방석 구매평 캠페인',
    reward: '구매평 승인 후 15,000원 환급',
    description:
      '포근한 도넛 쿠션 방석을 구매해 고양이가 쓰는 모습을 구매평으로 남겨 주세요.',
    mission: '고양이가 쓰는 사진을 꼭 넣어 주세요.',
    channelGuide: '구매처 포토 구매평',
    requirement: '사진 2장 이상',
    purchase: {
      storeName: '네이버 스마트스토어',
      productUrl: 'https://smartstore.naver.com/pogeun-pet/products/4001',
      productPrice: 19900,
      paybackAmount: 15000,
      purchaseGuide: 'M 사이즈로 구매해 주세요.',
    },
    who: ['minji', 'yuna', 'haneul'],
  },
]

// ───────── 실행 ─────────
export async function seedCatalog() {
  const { downloaded } = await fetchImages()
  if (downloaded) log(`시연 이미지 ${downloaded}장을 받았습니다`)
  prepareAccounts()
  const sellers = Object.fromEntries(
    await Promise.all(
      SELLERS.map(async ([email, , , , number]) => [
        number,
        await login(email),
      ]),
    ),
  )
  const creators = Object.fromEntries(
    await Promise.all(
      [
        ['haneul', 'haneul@movrit.local'],
        ['minji', 'minji@movrit.local'],
        ['junho', 'junho@movrit.local'],
        ...CREATORS.map(([email]) => [email.split('@')[0], email]),
      ].map(async ([key, email]) => [key, await login(email)]),
    ),
  )
  const addresses = {
    haneul: [
      '김하늘',
      '010-2481-3572',
      '서울특별시 강남구 테헤란로 152',
      '1203호',
    ],
    minji: [
      '이민지',
      '010-3920-1184',
      '서울특별시 마포구 와우산로 94',
      '302호',
    ],
    junho: [
      '박준호',
      '010-7731-5520',
      '경기도 성남시 분당구 정자일로 95',
      '1801호',
    ],
    seoyeon: [
      '정서연',
      '010-5521-0941',
      '서울특별시 송파구 올림픽로 300',
      '2304호',
    ],
    dohyun: [
      '한도현',
      '010-6612-3380',
      '경기도 고양시 일산동구 중앙로 1200',
      '501호',
    ],
    yuna: ['송유나', '010-4403-7712', '서울특별시 용산구 이태원로 55', '702호'],
    jiwoo: [
      '배지우',
      '010-2290-6635',
      '부산광역시 수영구 광안해변로 219',
      '1102호',
    ],
    taemin: ['조태민', '010-8814-2207', '대전광역시 유성구 대학로 99', '401호'],
  }

  async function upload(seller, image) {
    const body = new FormData()
    body.append(
      'file',
      new Blob([fs.readFileSync(imagePath(image))], { type: 'image/jpeg' }),
      `${image}.jpg`,
    )
    const res = await fetch(`${api}/campaign-image-assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller.accessToken}` },
      body,
    })
    const data = await res.json()
    if (!data.assetId)
      throw new Error(`이미지 올리기 실패 ${image} ${res.status}`)
    return data.assetId
  }

  async function create(spec) {
    const { id: brandId, number } = brandOf(spec.brand)
    const seller = sellers[number]
    const found = (
      await call(seller, 'GET', '/collaborations/campaigns/seller')
    ).data.find((c) => c.title === spec.title)
    if (found) return { id: found.id, seller, created: false }
    const ends = spec.state ? 6 : spec.ends
    const fulfillment =
      spec.type === 'PURCHASE_REVIEW'
        ? 'PURCHASE'
        : spec.type === 'PRODUCT'
          ? 'DELIVERY'
          : 'VISIT'
    const res = await call(seller, 'POST', '/campaigns/configured', {
      campaign: {
        selectionMode: spec.mode || 'BRAND_DIRECT',
        brandId,
        preorderId: null,
        title: spec.title,
        description: spec.description,
        category: spec.category,
        campaignType: spec.type,
        region: spec.region || null,
        contentChannel: spec.channel,
        recruitmentCount: spec.recruit,
        rewardDescription: spec.reward,
        startAt: spec.starts === 0 ? at(0, 0) : at(-3, 9),
        endAt: at(ends, 23),
        minFollowerCount: 0,
        details: {
          mission: spec.mission,
          channelGuide: spec.channelGuide,
          submissionRequirement: spec.requirement,
          deliveryGuide:
            fulfillment === 'DELIVERY'
              ? '선정 후 3일 안에 발송하며, 송장번호는 알림과 내 캠페인에서 확인할 수 있습니다.'
              : null,
          visitGuide:
            fulfillment === 'VISIT'
              ? '방문 희망 일시를 예약 요청해 주시면 확인 후 확정해 드립니다.'
              : null,
          caution:
            '제공받은 제품·서비스는 다른 사람에게 판매하거나 양도할 수 없습니다. 콘텐츠에 #협찬 표기를 꼭 넣어 주세요.',
          selectionAnnouncedAt: at(ends + 1, 12),
          experienceStartAt: at(ends + 2, 9),
          experienceEndAt: at(ends + 12, 23),
          contentSubmissionStartAt: at(ends + 2, 9),
          contentSubmissionEndAt: at(ends + 16, 23),
          resultsAnnouncedAt: at(ends + 18, 12),
        },
      },
      applicationForm: {
        allowedFulfillmentTypes: [fulfillment],
        questions: [],
        agreements: [
          {
            id: 'content-guide',
            title: '콘텐츠 작성 안내 동의',
            version: '1',
            required: true,
            body: '체험 후 정해진 기간 안에 콘텐츠를 올리고, 브랜드가 콘텐츠를 홍보에 쓰는 것에 동의합니다.',
          },
        ],
      },
      requirementMode: 'NONE',
      requirement: null,
      presentation: {
        representativeAssetId: await upload(seller, spec.image),
        detailImages: [],
        ...(fulfillment === 'VISIT' ? { visitLocation: spec.location } : {}),
      },
    })
    if (!res.data?.campaign?.id)
      throw new Error(
        `캠페인 생성 실패: ${spec.title} ${res.status} ${JSON.stringify(res.data)}`,
      )
    const id = res.data.campaign.id
    if (spec.purchase)
      await call(
        seller,
        'PUT',
        `/campaigns/${id}/purchase-review`,
        spec.purchase,
      )
    if (spec.premier)
      sql(`update collaboration_campaign set premier = true where id = ${id}`)
    return { id, seller, created: true, fulfillment }
  }

  async function apply(key, campaignId, fulfillment, title) {
    const user = creators[key]
    const mine = (await call(user, 'GET', '/campaigns/applications/mine')).data
    const found = mine.find((a) => a.campaignId === campaignId)
    if (found) return found.id
    const form = (
      await call(user, 'GET', `/campaigns/${campaignId}/application-form`)
    ).data
    const [name, phone, address1, address2] = addresses[key]
    const res = await call(
      user,
      'POST',
      `/campaigns/${campaignId}/applications`,
      {
        message: `${title}에 꼭 참여해 보고 싶습니다. 일정에 맞춰 꼼꼼하게 기록하겠습니다.`,
        expectedFormVersion: form.version,
        expectedEligibilityRequirementId: null,
        expectedEligibilityRequirementVersion: null,
        fulfillmentType: fulfillment,
        shippingContact:
          fulfillment === 'DELIVERY'
            ? {
                recipientName: name,
                recipientPhone: phone,
                postalCode: '06236',
                address1,
                address2,
              }
            : null,
        answers: [],
        agreementAcceptances: form.agreements.map((a) => ({
          agreementId: a.id,
          version: a.version,
          accepted: true,
        })),
      },
    )
    // 선착순 캠페인은 정원이 차면 409로 거절됩니다(정상).
    if (res.status !== 201 && res.status !== 409)
      throw new Error(
        `신청 실패 ${key} ${title} ${res.status} ${JSON.stringify(res.data)}`,
      )
    return res.data?.id
  }

  let made = 0
  for (const spec of CAMPAIGNS) {
    const { id, seller, created } = await create(spec)
    if (created) made++
    const fulfillment =
      spec.type === 'PURCHASE_REVIEW'
        ? 'PURCHASE'
        : spec.type === 'PRODUCT'
          ? 'DELIVERY'
          : 'VISIT'
    const ids = {}
    for (const key of spec.who)
      ids[key] = await apply(key, id, fulfillment, spec.title)
    for (const key of spec.pick || [])
      if (ids[key])
        await call(
          seller,
          'PATCH',
          `/campaigns/applications/${ids[key]}/select`,
        )
    // 모집 종료·진행 중 캠페인은 신청을 받은 뒤 일정을 지난 날짜로 옮깁니다(시연 데이터 전용, 처음 한 번만).
    if (spec.state === 'closed')
      sql(`update collaboration_campaign set
             start_at = date_trunc('day', now()) + interval '-12 day 9 hour',
             end_at = date_trunc('day', now()) + interval '-1 day 23 hour',
             selection_announced_at = date_trunc('day', now()) + interval '1 day 12 hour',
             experience_start_at = date_trunc('day', now()) + interval '2 day 9 hour',
             experience_end_at = date_trunc('day', now()) + interval '12 day 23 hour',
             content_submission_start_at = date_trunc('day', now()) + interval '2 day 9 hour',
             content_submission_end_at = date_trunc('day', now()) + interval '16 day 23 hour',
             results_announced_at = date_trunc('day', now()) + interval '18 day 12 hour'
           where id = ${id} and end_at > now()`)
    if (spec.state === 'running')
      sql(`update collaboration_campaign set
             start_at = date_trunc('day', now()) + interval '-15 day 9 hour',
             end_at = date_trunc('day', now()) + interval '-6 day 23 hour',
             selection_announced_at = date_trunc('day', now()) + interval '-5 day 12 hour',
             experience_start_at = date_trunc('day', now()) + interval '-4 day 9 hour',
             experience_end_at = date_trunc('day', now()) + interval '6 day 23 hour',
             content_submission_start_at = date_trunc('day', now()) + interval '-4 day 9 hour',
             content_submission_end_at = date_trunc('day', now()) + interval '9 day 23 hour',
             results_announced_at = date_trunc('day', now()) + interval '12 day 12 hour'
           where id = ${id} and end_at > now()`)
  }
  log(`캠페인 ${CAMPAIGNS.length}개 확인(새로 만든 캠페인 ${made}개)`)

  // ───────── 커뮤니티 글 ─────────
  const POSTS = [
    [
      'jiwoo',
      'free',
      '체험단',
      '부산 맛집 체험 다녀왔어요, 사진 팁 공유합니다',
      '해산물은 자연광에서 위에서 내려 찍으면 색이 제일 예쁘게 나와요. 매장 조명이 노랄 때는 화이트밸런스를 조금 낮춰 보세요.',
      ['seoyeon', '조명 팁 감사해요! 저도 노란 조명 때문에 고민이었어요.'],
    ],
    [
      'seoyeon',
      'free',
      '정보공유',
      '블로그 체험단 글, 저는 이 순서로 써요',
      '1. 한 줄 요약\n2. 제품·공간 소개\n3. 실제 사용·방문 후기\n4. 아쉬운 점과 추천 대상\n\n아쉬운 점을 솔직하게 쓰면 오히려 반응이 좋더라고요.',
      ['haneul', '아쉬운 점 쓰는 거 공감해요.'],
    ],
    [
      'dohyun',
      'free',
      '질문하기',
      '유튜브 영상은 마감 며칠 전에 올리시나요?',
      '편집하다 보면 마감이 빠듯해서요. 다들 촬영부터 업로드까지 며칠 정도 잡으시는지 궁금합니다.',
      ['taemin', '저는 촬영 후 3일 안에 올리는 걸 목표로 잡아요.'],
    ],
    [
      'yuna',
      'neighbor',
      '일상',
      '서울 성수·연남 쪽 체험 같이 다니실 분',
      '카페·네일 체험을 자주 다녀요. 같이 사진 찍어 주실 분 편하게 댓글 주세요!',
      ['minji', '연남동 자주 가요. 다음에 같이 가요!'],
    ],
    [
      'minji',
      'free',
      '일상',
      '이번 달 선정된 캠페인 정리해 봤어요',
      '그래놀라·핸드크림·라떼 체험이 겹쳐서 달력에 정리해 두니 훨씬 편하네요. 내 캠페인 달력 보기 추천해요.',
      ['yuna', '달력 보기 저도 잘 쓰고 있어요.'],
    ],
    [
      'taemin',
      'free',
      '정보공유',
      '전자기기 리뷰 영상 소리 녹음 팁',
      '키보드·이어폰 리뷰는 마이크를 기기에서 30cm 정도 떨어뜨리면 소리가 덜 뭉개져요.',
      ['dohyun', '거리 팁 바로 써 볼게요.'],
    ],
  ]
  const existingTitles = new Set()
  for (const board of ['free', 'neighbor'])
    for (const post of (
      await call(creators.minji, 'GET', `/community/posts?board=${board}`)
    ).data.items || [])
      existingTitles.add(post.title)
  for (const [
    key,
    board,
    category,
    title,
    body,
    [commenter, comment],
  ] of POSTS) {
    if (existingTitles.has(title)) continue
    const post = (
      await call(creators[key], 'POST', '/community/posts', {
        board,
        category,
        title,
        body,
      })
    ).data
    if (post?.id)
      await call(
        creators[commenter],
        'POST',
        `/community/posts/${post.id}/comments`,
        { body: comment },
      )
  }
  log('커뮤니티 글 준비 완료')
}

// 직접 실행했을 때만 바로 채웁니다.
if (import.meta.url === `file://${process.argv[1]}`) await seedCatalog()
