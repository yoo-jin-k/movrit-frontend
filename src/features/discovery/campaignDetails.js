/**
 * 개발용 캠페인의 유형별 질문·문서·일정 예시를 구성합니다.
 * 여기의 조건은 서버 정책이 아니며 예시 ID의 상세와 신청 미리보기에서만 사용합니다.
 */
// QA용 캠페인 조건은 서버 정책이 아닙니다. 서로 다른 폼과 미구성 상태를 확인하는 예시입니다.
const question = (id, label, type, required, options = []) => ({
  id: String(id),
  version: 1,
  label,
  type,
  required,
  maxLength: type === 'SHORT_TEXT' ? 300 : null,
  minSelections: type === 'MULTIPLE_CHOICE' ? 1 : 0,
  maxSelections: type === 'MULTIPLE_CHOICE' ? 2 : 1,
  options: options.map((label, index) => ({
    id: String(id * 10 + index),
    label,
  })),
})

const documents = [
  {
    documentId: '901',
    documentVersionId: '90101',
    title: '신청 정보 처리 안내',
    required: true,
    status: 'PREVIEW',
    body: '화면 검수용 문서입니다. 실제 개인정보 처리 동의문은 아직 구성되지 않았습니다. 이 선택은 법적 동의로 저장되거나 전송되지 않습니다.',
  },
  {
    documentId: '902',
    documentVersionId: '90201',
    title: '캠페인 참여 조건 확인',
    required: true,
    status: 'PREVIEW',
    body: '해당 캠페인의 제공 내역, 미션, 일정과 조건 버전을 확인하는 화면 예시입니다. 실제 운영 조건은 확정 후 표시됩니다.',
  },
  {
    documentId: '903',
    documentVersionId: '90301',
    title: '추가 소식 안내',
    required: false,
    status: 'PREVIEW',
    body: '선택 동의의 수락과 거절을 검수하기 위한 예시입니다. 마케팅 수신 동의나 연락처 저장은 수행하지 않습니다.',
  },
]

const profiles = {
  delivery: {
    title: '[미리보기] 수분 케어 세럼 체험단',
    category: '뷰티',
    kind: '제품',
    media: '블로그',
    image: '/assets/discovery/banners/review.png',
    description: '세럼 체험 세트 · 배송형 예시',
    experienceType: 'DELIVERY',
    provided: ['수분 케어 세럼 체험 세트입니다. 제공 구성은 예시입니다.'],
    fulfillment: {
      title: '배송 및 체험안내',
      paragraphs: [
        '배송형 캠페인으로 신청 시 수령정보가 필요합니다.',
        '배송 가능 지역과 발송일은 실제 캠페인 조건 확정 후 안내됩니다.',
      ],
    },
    missions: [
      '제품의 제형과 사용 경험을 블로그 콘텐츠로 소개하는 예시입니다.',
      '글자 수·사진 수·필수 링크는 캠페인별 설정 항목이며 이 예시에서는 수치를 확정하지 않았습니다.',
    ],
    keywords: ['MOVRIT', '수분 케어'],
    submissions: ['블로그 게시물 URL'],
    qualifications: ['본인인증과 블로그 채널 연결 상태를 확인해야 합니다.'],
    warnings: ['사용 전 제품 설명과 본인에게 맞는 사용 조건을 확인해 주세요.'],
    questions: [
      question(
        101,
        '평소 관심 있는 제품 특징을 선택해 주세요.',
        'SINGLE_CHOICE',
        true,
        ['보습', '사용감', '휴대성'],
      ),
      question(102, '체험 시 참고할 내용을 알려주세요.', 'SHORT_TEXT', false),
    ],
  },
  visit: {
    title: '[미리보기] 우리 동네 다이닝 방문 체험',
    category: '맛집',
    kind: '지역',
    media: '인스타그램',
    image: '/assets/discovery/banners/dining.png',
    description: '방문 식사 체험 · 예약형 예시',
    experienceType: 'VISIT',
    provided: [
      '방문 식사 체험권 예시입니다. 메뉴와 동반 인원은 캠페인별 조건을 따릅니다.',
    ],
    fulfillment: {
      title: '방문 및 예약안내',
      paragraphs: [
        '예약이 필요한 방문형 예시입니다. 방문 가능 시간은 아래 질문에서 선택합니다.',
        '매장 위치와 예약 연락처는 실제 캠페인 등록 후 표시됩니다.',
      ],
    },
    missions: [
      '방문 경험을 인스타그램 릴스로 소개하는 예시입니다.',
      '영상 길이, 사람 태그, 해시태그는 해당 캠페인의 가이드가 있을 때만 적용합니다.',
    ],
    keywords: ['MOVRIT', '다이닝 체험'],
    submissions: ['인스타그램 릴스 URL'],
    qualifications: ['본인인증과 인스타그램 채널 연결 상태를 확인해야 합니다.'],
    warnings: ['예약 변경이나 방문 취소는 안내된 절차를 확인해 주세요.'],
    questions: [
      question(
        201,
        '방문 가능한 시간대를 선택해 주세요.',
        'SINGLE_CHOICE',
        true,
        ['평일 오후', '주말 오전'],
      ),
      question(202, '방문 시 참고할 내용을 알려주세요.', 'SHORT_TEXT', false),
    ],
  },
  editorial: {
    title: '[미리보기] 여행 브랜드 소개 기자단',
    category: '서비스',
    kind: '기자단',
    media: '블로그',
    image: '/assets/discovery/banners/travel.png',
    description: '제공 자료를 활용하는 소개 콘텐츠 예시',
    experienceType: null,
    provided: [
      '캠페인 소개 자료와 사진 제공을 가정한 기자단 예시입니다. 보상 조건은 미구성입니다.',
    ],
    fulfillment: {
      title: '자료 제공 및 참여안내',
      paragraphs: [
        '브랜드가 제공하는 가이드와 사진의 이용 범위를 먼저 확인해야 합니다.',
        '자료 제공 방식과 이행 유형이 확정되지 않아 신청은 제한됩니다.',
      ],
    },
    missions: [
      '브랜드 제공 자료를 바탕으로 소개 콘텐츠를 작성하는 예시입니다.',
      '직접 방문하거나 사용한 것처럼 표현하지 않도록 가이드와 자료 출처를 확인해야 합니다.',
    ],
    keywords: ['MOVRIT', '브랜드 소개'],
    submissions: ['소개 콘텐츠 URL'],
    qualifications: ['필수 채널과 자료 이용 조건을 확인해야 합니다.'],
    warnings: ['자료 사용 권한, 보상, 이행 유형은 현재 미구성입니다.'],
    blockingReason: '자료 이용 조건과 캠페인 이행 유형을 준비 중입니다.',
    questions: [
      question(
        301,
        '소개할 수 있는 주제를 선택해 주세요.',
        'MULTIPLE_CHOICE',
        true,
        ['브랜드 이야기', '서비스 이용 안내', '제품 특징'],
      ),
      question(302, '콘텐츠 기획을 간단히 소개해 주세요.', 'SHORT_TEXT', false),
    ],
  },
  premier: {
    title: '[미리보기] 프리미어 뷰티 캠페인',
    category: '뷰티',
    kind: '제품',
    media: '블로그',
    image: '/assets/discovery/banners/review.png',
    description: '프리미어 자격 제한 예시',
    experienceType: 'DELIVERY',
    premier: true,
    provided: ['프리미어 체험 세트 예시입니다.'],
    fulfillment: {
      title: '배송 및 체험안내',
      paragraphs: ['자격 확인이 완료된 선정자에게 제공되는 배송형 예시입니다.'],
    },
    missions: [
      '제품 특징과 사용 경험을 소개하는 콘텐츠 예시입니다.',
      '필수 링크·영상·사진 구성은 캠페인별 미션 데이터로 안내됩니다.',
    ],
    keywords: ['MOVRIT', '프리미어 체험'],
    submissions: ['블로그 게시물 URL', '캠페인에서 요구하는 영상 또는 링크'],
    qualifications: [
      '프리미어 회원 자격 확인이 필요한 캠페인 예시입니다.',
      'MOVRIT의 등급 기준과 자격 판정 규칙은 아직 확정되지 않았습니다.',
    ],
    warnings: [
      '현재 회원 자격을 임의로 인정하지 않으며 신청을 진행할 수 없습니다.',
    ],
    blockingReason: '프리미어 자격 확인 정책을 준비 중입니다.',
    questions: [
      question(
        401,
        '주로 작성하는 콘텐츠 분야를 알려주세요.',
        'SHORT_TEXT',
        true,
      ),
    ],
  },
  purchase: {
    title: '[미리보기] 구매 후 후기 작성 캠페인',
    category: '식품',
    kind: '제품',
    media: '기타',
    image: '/assets/discovery/banners/review.png',
    description: '구매 조건·후기 제출 구성 예시',
    experienceType: null,
    shoppingreview: true,
    provided: [
      '구매 후 후기 작성 방식의 화면 예시입니다. 구매 금액, 지원 금액, 적립 시점은 미구성입니다.',
    ],
    fulfillment: {
      title: '구매 및 참여조건',
      paragraphs: [
        '지정 판매처 회원 여부와 구매 조건이 필요한 유형입니다.',
        '구매처·자가 구매 여부·환급 또는 페이백 정책은 미확정입니다. 실제 구매를 진행하지 마세요.',
      ],
    },
    missions: ['구매 후기 작성과 증빙 제출이 있는 유형을 보여주는 예시입니다.'],
    keywords: [],
    submissions: [
      '구매 후기 URL',
      '구매 닉네임',
      '후기 화면 캡처 · 실제 업로드 미연동',
    ],
    qualifications: ['구매처 회원 조건과 구매·보상 규칙 확정이 필요합니다.'],
    warnings: [
      '화면의 예시만으로 구매하거나 환급을 기대하지 않도록 실제 신청을 제한합니다.',
    ],
    blockingReason: '구매·보상 조건과 제출 정책을 준비 중입니다.',
    questions: [
      question(501, '구매 후기 닉네임을 입력해 주세요.', 'SHORT_TEXT', true),
    ],
  },
  clip: {
    title: '[미리보기] 문화 공간 클립 체험',
    category: '문화',
    kind: '지역',
    media: '클립',
    image: '/assets/discovery/banners/clip.png',
    description: '방문형 클립 콘텐츠 예시',
    experienceType: 'VISIT',
    provided: ['문화 공간 방문 체험 예시입니다.'],
    fulfillment: {
      title: '방문 및 예약안내',
      paragraphs: [
        '안내된 체험 기간에 방문하는 캠페인 예시입니다.',
        '방문 가능 날짜와 예약 여부는 캠페인별 데이터로 표시합니다.',
      ],
    },
    missions: [
      '네이버 클립 계정으로 방문 경험을 영상에 담는 예시입니다.',
      '영상 길이, 해시태그, 장소 태그는 캠페인별 미션에 명시된 경우에만 적용합니다.',
    ],
    keywords: ['MOVRIT', '공간 체험'],
    submissions: ['클립 영상 URL', '캠페인에서 요구하는 장소 태그'],
    qualifications: ['클립 채널 연결 상태 확인이 필요합니다.'],
    warnings: [
      '다른 방문자의 얼굴이나 개인정보가 노출되지 않도록 촬영해 주세요.',
    ],
    questions: [
      question(
        601,
        '촬영하고 싶은 장면을 선택해 주세요.',
        'MULTIPLE_CHOICE',
        true,
        ['공간 소개', '체험 과정', '방문 팁'],
      ),
      question(602, '방문 희망 시간대를 알려주세요.', 'SHORT_TEXT', true),
    ],
  },
  incomplete: {
    title: '[미리보기] 조건 준비 중인 캠페인',
    category: '디지털',
    kind: '제품',
    media: '유튜브',
    image: '/assets/discovery/banners/living.png',
    description: '조건 미구성 상태 예시',
    experienceType: null,
    provided: [],
    fulfillment: null,
    missions: [],
    keywords: [],
    submissions: [],
    qualifications: [],
    warnings: [],
    blockingReason: '제공 내역·미션·일정·동의 문서를 준비 중입니다.',
    questions: [],
  },
}

// 조건·질문·동의 버전을 캠페인에 묶어 메뉴 전환이나 카드 재사용 시 조건이 섞이지 않도록 합니다.
export function createCampaignDetails(profileName, index) {
  const profile = profiles[profileName]
  const day = 18 + (index % 7)
  const date = (value) =>
    `2026-10-${String(value).padStart(2, '0')}T10:00:00+09:00`
  const schedule =
    profileName === 'incomplete'
      ? null
      : {
          recruitmentStartsAt: date(day - 3),
          recruitmentEndsAt: date(day),
          selectionDueAt: date(day + 1),
          experienceStartsAt: date(day + 2),
          experienceEndsAt: '2026-11-07T18:00:00+09:00',
          submissionDueAt: '2026-11-10T23:59:00+09:00',
        }
  return {
    ...profile,
    profileName,
    schedule,
    form: {
      termsVersion: index + 1,
      experienceType: profile.experienceType,
      deliveryAddressRequired: profile.experienceType === 'DELIVERY',
      questions: profile.questions,
      consents: profileName === 'incomplete' ? [] : documents,
      requirements: {
        identityRequired: true,
        channels: [{ label: profile.media, requiredItemCount: 1 }],
      },
      canSubmit: false,
      blockingReasons: [
        {
          code: 'PROVIDER_NOT_CONFIGURED',
          message:
            '실제 인증 제공자와 신청 저장 기능은 아직 연결되지 않았습니다.',
        },
      ],
      initialPreviewState:
        profileName === 'clip'
          ? 'mediaExpired'
          : profileName === 'incomplete'
            ? 'unconfigured'
            : profileName === 'visit'
              ? 'identityRequired'
              : 'ready',
    },
  }
}
