import { createCampaignDetails } from './campaignDetails'
import { campaignTiming } from './campaignDates'
import { periodHasEnded } from './scheduleModel'

export const MENU_ITEMS = [
  ['홈', '/home'],
  ['제품', '/category/제품'],
  ['지역', '/category/지역'],
  ['기자단', '/category/기자단'],
  ['저금통', '/offerwall'],
  ['오늘오픈', '/category/오늘오픈'],
  ['프리미어', '/category/프리미어'],
  ['구매평', '/special/shoppingreview'],
  ['클립', '/special/clip'],
  ['커뮤니티', '/community/free'],
]
export const PRODUCT_CATEGORIES = [
  '전체',
  '생활',
  '서비스',
  '유아동',
  '디지털',
  '뷰티',
  '패션',
  '도서',
  '식품',
  '반려동물',
]
export const LOCAL_CATEGORIES = [
  '전체',
  '맛집',
  '뷰티',
  '숙박',
  '문화',
  '배달',
  '테이크아웃',
  '기타',
]
export const MEDIA = [
  '미디어 전체',
  '블로그',
  '인스타그램',
  '유튜브',
  '클립',
  '기타',
]
export const REGIONS = [
  '전국',
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '강원',
  '충청',
  '전라',
  '경상',
  '제주',
]
export const SHORTCUTS = [
  ['오늘오픈', 'calendar', '/category/오늘오픈'],
  ['저금통', 'pig', '/offerwall'],
  ['맛집', 'dining', '/category/지역?category=맛집'],
  ['뷰티', 'beauty', '/category/제품?category=뷰티'],
  ['여행', 'travel', '/category/지역?category=숙박'],
  ['문화', 'culture', '/category/지역?category=문화'],
  ['식품', 'food', '/category/제품?category=식품'],
  ['생활', 'living', '/category/제품?category=생활'],
  ['디지털', 'digital', '/category/제품?category=디지털'],
  ['커뮤니티', 'community', '/community/free'],
  ['이용가이드', 'guide', '/community/guide'],
  ['광고문의', 'biz', '/support'],
]

// 실제 모집 정보가 아닌 개발용 화면 샘플입니다. 운영 빌드에서는 노출하지 않습니다.
const SAMPLES = [
  ['[미리보기] 동네 다이닝 체험', '식사 체험권 예시', '맛집', 'dining'],
  ['[미리보기] 일상을 기록하는 카메라', '카메라 체험 예시', '디지털', 'clip'],
  ['[미리보기] 산뜻한 음료 체험', '음료 세트 예시', '식품', 'dining'],
  ['[미리보기] 간편한 한 끼', '간편식 세트 예시', '식품', 'dining'],
  ['[미리보기] 건강한 아침 루틴', '아침 식사 세트 예시', '식품', 'review'],
  ['[미리보기] 나만의 데스크', '데스크 용품 예시', '디지털', 'living'],
  ['[미리보기] 가벼운 하루의 옷', '의류 체험 예시', '패션', 'travel'],
  ['[미리보기] 수분 케어', '스킨케어 체험 예시', '뷰티', 'review'],
  ['[미리보기] 포근한 공간', '생활 용품 예시', '생활', 'living'],
  ['[미리보기] 달콤한 오후', '디저트 세트 예시', '식품', 'dining'],
]
export const PREVIEW_CAMPAIGNS = import.meta.env.DEV
  ? Array.from({ length: 40 }, (_, i) => {
      const [title, description, category, photo] = SAMPLES[i % SAMPLES.length]
      const representative = {
        0: 'delivery',
        1: 'editorial',
        2: 'purchase',
        3: 'clip',
        4: 'premier',
        5: 'incomplete',
        10: 'visit',
        20: 'editorial',
      }
      const profile =
        representative[i] ||
        (i >= 10 && i < 20
          ? 'visit'
          : i >= 20 && i < 30
            ? 'editorial'
            : 'delivery')
      const detail = createCampaignDetails(profile, i)
      return {
        id: `demo-${i + 1}`,
        preview: true,
        title,
        description,
        category,
        image: `/assets/discovery/banners/${photo}.png`,
        kind: i < 10 ? '제품' : i < 20 ? '지역' : i < 30 ? '기자단' : '제품',
        localCategory:
          LOCAL_CATEGORIES[1 + (i % (LOCAL_CATEGORIES.length - 1))],
        region: REGIONS[1 + (i % (REGIONS.length - 1))],
        media: MEDIA[1 + (i % (MEDIA.length - 1))],
        applicants: 124 + (40 - i) * 17,
        capacity: 4 + (i % 16),
        premier: Boolean(detail.premier),
        shoppingreview: Boolean(detail.shoppingreview),
        ...campaignTiming(detail.schedule),
        recruitmentEnded: periodHasEnded(detail.schedule?.recruitmentEndsAt),
        ...detail,
        detail,
      }
    })
  : []

export const COMMUNITY_POSTS = [
  {
    id: 'guide',
    board: 'guide',
    category: '이용안내',
    title: 'MOVRIT 캠페인 참여 가이드',
    body: '관심 있는 캠페인의 제공 내역과 참여 일정을 확인해 주세요. 신청 전에는 자신의 채널과 캠페인 미션이 맞는지 살펴보는 것이 좋습니다. 현재 화면은 서비스 준비를 위한 미리보기이며 실제 모집 일정은 확정된 캠페인에서 안내됩니다.',
  },
  {
    id: 'welcome',
    board: 'free',
    category: '일상',
    title: 'MOVRIT 커뮤니티에 오신 것을 환영합니다.',
    body: '브랜드와의 새로운 경험을 함께 나누는 공간입니다. 서로를 존중하는 말로 취향과 경험을 공유해 주세요.',
  },
  {
    id: 'photo',
    board: 'free',
    category: '정보공유',
    title: '제품 사진을 촬영할 때 확인하면 좋은 것들',
    body: '자연광이 들어오는 곳에서 제품의 특징이 잘 드러나도록 촬영해 보세요. 사용한 경험을 자신의 말로 정리하면 더 유용한 콘텐츠가 됩니다.',
  },
  {
    id: 'first',
    board: 'free',
    category: '체험단',
    title: '처음 참여하는 캠페인, 무엇부터 준비할까요?',
    body: '제공 내역, 방문 가능 시간, 콘텐츠 등록 기간을 먼저 확인해 주세요. 궁금한 사항은 담당자에게 문의해 주세요.',
  },
  {
    id: 'question',
    board: 'free',
    category: '질문하기',
    title: '캠페인 일정을 확인하고 싶습니다.',
    body: '캠페인 상세 화면에서 신청 기간과 콘텐츠 등록 기간을 확인할 수 있습니다. 실제 운영 일정은 서비스 오픈 후 안내됩니다.',
  },
  {
    id: 'neighbor',
    board: 'neighbor',
    category: '이웃찾기',
    title: '비슷한 취향의 크리에이터를 만나보세요.',
    body: '좋아하는 분야와 콘텐츠를 서로 소개하는 공간입니다. 커뮤니티 연동을 준비 중입니다.',
  },
  {
    id: 'event',
    board: 'event',
    category: '이벤트',
    title: 'MOVRIT의 새로운 소식을 만나보세요.',
    body: '이벤트 일정과 참여 방법은 확정 후 이곳에서 안내합니다.',
  },
]
