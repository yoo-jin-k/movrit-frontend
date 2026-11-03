/**
 * 기본 캠페인 정보와 모집 일정을 부모가 관리하는 입력값으로 표시합니다.
 * 생성/수정 여부와 disabled 상태를 전달받아 입력 가능 범위를 제한합니다.
 *
 * 운영 브랜드: 캠페인이 속할 브랜드입니다. 브랜드가 여러 개일 때만 선택이 필수입니다.
 * 함께 판매할 프리오더: 선택 항목입니다. 비워 두면 프리오더 없이 체험단만 운영합니다.
 * 수정 화면에서는 두 값을 바꿀 수 없습니다(신청·선정 기록의 소속이 바뀌지 않도록).
 *
 * 캠페인 종류·지역·콘텐츠 채널: 사용자 탐색 메뉴(제품·지역·기자단·구매평, 지역 필터, 미디어 필터)에 쓰입니다.
 * 구매평 종류를 고르면 구매처·상품 주소·판매가·환급액 입력 칸이 함께 나옵니다.
 * 세부 일정·참여 안내(선택): 사용자 캠페인 상세와 '내 캠페인'의 참여 일정·미션 안내에 그대로 표시됩니다.
 * 채널 기본 요건 넣기: 고른 콘텐츠 채널(블로그·인스타그램·유튜브·클립)의 기본 제출 요건을 비어 있는 칸에만 넣습니다.
 */
import { useState } from 'react'
import {
  applyChannelDefaults,
  hasChannelDefaults,
} from './channelRequirementModel'
import {
  LOCAL_CATEGORIES,
  PRODUCT_CATEGORIES,
  REGIONS,
} from '../discovery/catalog.js'
import PurchaseInfoFields from '../purchaseReview/PurchaseInfoFields'
import { emptyPurchaseInfo } from '../purchaseReview/purchaseReviewModel'

// 세부 일정 입력 항목(서버 필드, 화면 이름)입니다. 비워 두면 사용자 화면에 '미정'으로 표시됩니다.
const SCHEDULE_INPUTS = [
  ['selectionAnnouncedAt', '선정 발표'],
  ['experienceStartAt', '체험 시작'],
  ['experienceEndAt', '체험 종료'],
  ['contentSubmissionStartAt', '콘텐츠 등록 시작'],
  ['contentSubmissionEndAt', '콘텐츠 등록 마감'],
  ['resultsAnnouncedAt', '결과 발표'],
]
// 참여 안내 입력 항목(서버 필드, 화면 이름, 입력 예시, 최대 글자 수)입니다.
const GUIDE_INPUTS = [
  [
    'mission',
    '요청사항 · 미션',
    '예) 제품을 2주간 사용한 뒤 사용 전후 사진과 함께 후기를 올려 주세요.',
    10000,
  ],
  [
    'submissionRequirement',
    '제출 요구사항',
    '예) 사진 5장 이상, 본문 1,000자 이상, #MOVRIT 해시태그 필수',
    5000,
  ],
  [
    'channelGuide',
    '채널별 작성 안내',
    '예) 인스타그램은 피드 게시물로 올리고 브랜드 계정을 태그해 주세요.',
    5000,
  ],
  ['deliveryGuide', '배송 안내', '예) 선정 발표 후 3일 안에 발송합니다.', 5000],
  [
    'visitGuide',
    '방문 안내',
    '예) 평일 11시~20시, 방문 전 전화로 예약해 주세요.',
    5000,
  ],
  [
    'scheduleGuide',
    '일정 추가 안내',
    '예) 콘텐츠 마감일이 지나면 수정 요청이 어렵습니다.',
    5000,
  ],
  ['caution', '주의사항', '예) 제공 제품은 재판매할 수 없습니다.', 5000],
]

// 서버 코드와 화면 이름의 짝입니다.
const CAMPAIGN_TYPES = [
  ['PRODUCT', '제품 (배송형 체험)'],
  ['LOCAL', '지역 (방문형 체험)'],
  ['REPORTER', '기자단 (취재·소개형)'],
  ['PURCHASE_REVIEW', '구매평 (직접 구매 후 환급)'],
]
const CONTENT_CHANNELS = [
  ['', '지정하지 않음'],
  ['BLOG', '블로그'],
  ['INSTAGRAM', '인스타그램'],
  ['YOUTUBE', '유튜브'],
  ['CLIP', '클립'],
  ['OTHER', '기타'],
]

// 서버 시각(초 포함 가능)을 datetime-local 입력 형식(YYYY-MM-DDTHH:mm)으로 맞춥니다.
function toLocalInput(value) {
  return typeof value === 'string' ? value.slice(0, 16) : ''
}

export default function CampaignFields({
  value,
  onChange,
  brands = [],
  preorders,
  editing = false,
  disabled = false,
}) {
  const change = (name, next) => onChange({ ...value, [name]: next })
  const [defaultsNotice, setDefaultsNotice] = useState('')
  const insertChannelDefaults = () => {
    const { next, filled } = applyChannelDefaults(value)
    if (filled.length) onChange(next)
    setDefaultsNotice(
      filled.length
        ? '비어 있던 제출 요구사항·채널별 작성 안내에 기본 요건을 넣었습니다. 캠페인에 맞게 고쳐 주세요.'
        : '이미 적어 둔 내용이 있어 바꾸지 않았습니다. 기본 요건을 쓰려면 두 칸을 비운 뒤 다시 눌러 주세요.',
    )
  }
  // 브랜드를 바꾸면 다른 브랜드의 프리오더 선택은 비웁니다.
  const changeBrand = (next) =>
    onChange({ ...value, brandId: next, preorderId: '' })
  // 고른 브랜드의 프리오더만 보여줍니다. 브랜드를 아직 고르지 않았으면 전체를 보여줍니다.
  // 종류에 맞는 카테고리 추천 목록입니다. 직접 입력도 할 수 있습니다.
  const categoryOptions = (
    value.campaignType === 'LOCAL' ? LOCAL_CATEGORIES : PRODUCT_CATEGORIES
  ).slice(1)
  const brandPreorders = value.brandId
    ? preorders.filter((item) => String(item.brandId) === String(value.brandId))
    : preorders
  return (
    <>
      <fieldset className="seller-campaign-fields" disabled={disabled}>
        <legend>기본 정보</legend>
        {!editing && (
          <label>
            운영 브랜드
            <select
              required={brands.length > 1}
              value={value.brandId ?? ''}
              onChange={(e) => changeBrand(e.target.value)}
            >
              {brands.length !== 1 && <option value="">선택해 주세요</option>}
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          함께 판매할 프리오더 (선택)
          <select
            disabled={editing}
            value={value.preorderId ?? ''}
            onChange={(e) => change('preorderId', e.target.value)}
          >
            <option value="">
              {editing && !value.preorderId
                ? '연결된 프리오더 없음'
                : '연결하지 않음 (체험단만 운영)'}
            </option>
            {brandPreorders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          선정 방식
          <select
            required
            value={value.selectionMode || ''}
            onChange={(event) => change('selectionMode', event.target.value)}
          >
            <option value="" disabled>
              선정 방식 확인 필요
            </option>
            <option value="BRAND_DIRECT">브랜드 직접 선정</option>
            <option value="OPERATOR">운영자 선정</option>
            <option value="FIRST_COME">선착순 (방문형)</option>
          </select>
        </label>
        <p>
          브랜드 직접 선정은 업체가, 운영자 선정은 관리자가 참여자를 선정합니다.
          선착순은 방문형 캠페인 전용으로, 신청한 순서대로 모집 인원이 찰 때까지
          바로 선정됩니다. 신청 이력이 생기면 선정 방식을 변경할 수 없습니다.
        </p>
        <label>
          모집 제목
          <input
            required
            value={value.title}
            onChange={(e) => change('title', e.target.value)}
          />
        </label>
        <label>
          설명
          <textarea
            rows={3}
            value={value.description || ''}
            onChange={(e) => change('description', e.target.value)}
          />
        </label>
        <label>
          캠페인 종류
          <select
            value={value.campaignType || 'PRODUCT'}
            onChange={(e) =>
              // 지역 캠페인이 아니게 되면 고른 지역은 비웁니다.
              onChange({
                ...value,
                campaignType: e.target.value,
                region: e.target.value === 'LOCAL' ? value.region : '',
              })
            }
          >
            {CAMPAIGN_TYPES.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {value.campaignType === 'LOCAL' && (
          <label>
            방문 지역
            <select
              required
              value={value.region || ''}
              onChange={(e) => change('region', e.target.value)}
            >
              <option value="">선택해 주세요</option>
              {REGIONS.slice(1).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          콘텐츠 채널
          <select
            value={value.contentChannel || ''}
            onChange={(e) => change('contentChannel', e.target.value)}
          >
            {CONTENT_CHANNELS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          카테고리
          <input
            list="seller-campaign-category-options"
            value={value.category || ''}
            onChange={(e) => change('category', e.target.value)}
          />
          <datalist id="seller-campaign-category-options">
            {categoryOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label>
          제공 내역
          <input
            value={value.rewardDescription || ''}
            onChange={(e) => change('rewardDescription', e.target.value)}
          />
        </label>
      </fieldset>
      {/* 구매평 캠페인은 구매처·판매가·환급액 안내를 함께 받습니다. */}
      {value.campaignType === 'PURCHASE_REVIEW' && (
        <PurchaseInfoFields
          value={value.purchaseReview || emptyPurchaseInfo()}
          onChange={(next) => change('purchaseReview', next)}
          disabled={disabled}
        />
      )}
      <fieldset className="seller-campaign-fields" disabled={disabled}>
        <legend>모집 일정과 인원</legend>
        <p>
          모든 일정은 한국 시간(KST) 기준입니다. 선정하면 참여자의 수락 없이
          바로 참여가 시작됩니다.
        </p>
        <label>
          모집 인원
          <input
            required
            type="number"
            min="1"
            step="1"
            value={value.recruitmentCount}
            onChange={(e) => change('recruitmentCount', e.target.value)}
          />
        </label>
        <label>
          모집 시작 (한국시간)
          <input
            required
            type="datetime-local"
            value={value.startAt}
            onChange={(e) => change('startAt', e.target.value)}
          />
        </label>
        <label>
          모집 종료 (한국시간)
          <input
            required
            type="datetime-local"
            value={value.endAt}
            onChange={(e) => change('endAt', e.target.value)}
          />
        </label>
      </fieldset>
      <fieldset className="seller-campaign-fields" disabled={disabled}>
        <legend>세부 일정 (선택)</legend>
        <p>
          모집 이후 일정을 정해 두면 참여자 화면의 일정과 달력에 표시됩니다.
          순서는 모집 종료 → 선정 발표 → 체험 → 콘텐츠 등록 → 결과 발표입니다.
        </p>
        {SCHEDULE_INPUTS.map(([field, label]) => (
          <label key={field}>
            {label} (한국시간)
            <input
              type="datetime-local"
              value={toLocalInput(value[field])}
              onChange={(e) => change(field, e.target.value)}
            />
          </label>
        ))}
      </fieldset>
      <fieldset className="seller-campaign-fields" disabled={disabled}>
        <legend>참여 안내 (선택)</legend>
        <p>참여자가 체험·콘텐츠 작성 전에 확인할 내용을 적어 주세요.</p>
        {hasChannelDefaults(value.contentChannel) && (
          <div className="seller-campaign-fields__defaults">
            <button type="button" onClick={insertChannelDefaults}>
              채널 기본 요건 넣기
            </button>
            <small>
              고른 콘텐츠 채널에 맞는 기본 제출 요건을 비어 있는 칸에 넣습니다.
            </small>
            {defaultsNotice && <p role="status">{defaultsNotice}</p>}
          </div>
        )}
        {GUIDE_INPUTS.map(([field, label, placeholder, max]) => (
          <label key={field}>
            {label}
            <textarea
              rows={3}
              maxLength={max}
              placeholder={placeholder}
              value={value[field] || ''}
              onChange={(e) => change(field, e.target.value)}
            />
          </label>
        ))}
      </fieldset>
    </>
  )
}
