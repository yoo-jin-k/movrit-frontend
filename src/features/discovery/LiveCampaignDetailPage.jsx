/**
 * 실제 캠페인 상세 화면입니다.
 *
 * 화면 구성
 * - 왼쪽(넓은 칸): 대표 이미지 → 탭(캠페인 정보 · 상세페이지 · 미션·제출 요건 · 일정 · 유의사항) → 탭 내용
 *                  → 신청 영역(로그인·이메일 인증·참여 조건·신청서)
 * - 오른쪽(좁은 칸): 요약 카드(브랜드·종류·채널, 찜 하트, 제목, 일정과 캘린더, 모집 현황, 신청서 작성 버튼).
 *                    스크롤해도 화면 위쪽에 붙어 있어 언제든 신청 영역으로 이동할 수 있습니다.
 * - 모바일: 대표 이미지 → 요약 카드 → 탭 → 신청 영역 순서로 한 줄에 쌓고, 화면 아래에 신청 바를 고정합니다.
 *
 * 공개 본문·신청 폼·표시정보(이미지)는 따로 불러와 한쪽이 실패해도 나머지는 보여 줍니다.
 * '정보 새로고침'을 누르면 세 가지를 모두 다시 불러옵니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  campaignReadError,
  readCampaign,
  readCampaignForm,
} from '../../api/campaignReadApi'
import PurchaseInfoCard from '../purchaseReview/PurchaseInfoCard'
import { fulfillmentLabel } from '../purchaseReview/purchaseReviewModel'
import CampaignDetailImages from './CampaignDetailImages'
import CampaignParticipation from './CampaignParticipation'
import CampaignSchedule from './CampaignSchedule'
import ChannelIcon from './ChannelIcon'
import VisitMap from './VisitMap'
import DiscoveryLayout from './DiscoveryLayout'
import FavoriteButton from './FavoriteButton'
import RecruitmentProgress from './RecruitmentProgress'
import { isRecruiting, recruitmentDeadlineLabel } from './campaignDates'
import { campaignKindLabel } from './campaignReadAdapter'
import { liveCampaignSchedule } from './scheduleModel'
import { useCampaignPresentation } from './useCampaignPresentation'

// 상세 탭 목록입니다. [키, 탭 이름]
const TABS = [
  ['info', '캠페인 정보'],
  ['page', '상세페이지'],
  ['mission', '미션·제출 요건'],
  ['schedule', '일정'],
  ['notice', '유의사항'],
]

// 신청서 질문 형식 이름입니다.
const QUESTION_TYPES = {
  SINGLE_CHOICE: '단일 선택',
  TEXTAREA: '장문',
  TEXT: '단답',
}

// 신청 영역으로 부드럽게 이동합니다. '동작 줄이기'를 켠 사용자는 바로 이동합니다.
function scrollToApply() {
  const target = document.getElementById('campaign-apply')
  if (!target) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  })
}

// 제목·내용 한 줄입니다. 내용이 없으면 '안내가 등록되지 않았습니다.'를 보여 줍니다.
function InfoRow({ title, children, text }) {
  return (
    <div>
      <dt>{title}</dt>
      <dd>
        {children ??
          (text ? (
            <p className="campaign-detail__text">{text}</p>
          ) : (
            <p className="discovery-muted">안내가 등록되지 않았습니다.</p>
          ))}
      </dd>
    </div>
  )
}

// '캠페인 정보' 탭: 소개, 제공 내역, 미션 요약, 참여 채널, 방문 장소
function InfoPanel({ detail, location }) {
  return (
    <>
      {detail.description && (
        <p className="campaign-detail__lead">{detail.description}</p>
      )}
      <dl className="campaign-detail__rows">
        <InfoRow title="제공 내역" text={detail.rewardDescription} />
        <InfoRow title="미션" text={detail.mission} />
        <InfoRow title="채널">
          {detail.contentChannel ? (
            <div className="campaign-detail__channel">
              <ChannelIcon channel={detail.contentChannel} />
              {detail.channelGuide && (
                <p className="campaign-detail__text">{detail.channelGuide}</p>
              )}
            </div>
          ) : (
            <p className="discovery-muted">안내가 등록되지 않았습니다.</p>
          )}
        </InfoRow>
        {location && (
          <InfoRow title="방문 장소">
            <p>
              <strong>{location.venueName}</strong>
            </p>
            <p className="discovery-muted">
              {location.postalCode && `(${location.postalCode}) `}
              {location.address1}
              {location.address2 && ` ${location.address2}`}
            </p>
            {/* 네이버 지도 키(VITE_NAVER_MAP_KEY_ID)가 있으면 주소 아래에 지도를 그립니다. 키가 없거나 실패하면 주소만 보입니다. */}
            <VisitMap key={location.address1} location={location} />
          </InfoRow>
        )}
      </dl>
    </>
  )
}

// '미션·제출 요건' 탭: 미션, 채널 안내, 제출 요건, 참여 방식과 신청서 질문
function MissionPanel({ detail, form, formError }) {
  return (
    <dl className="campaign-detail__rows">
      <InfoRow title="캠페인 미션" text={detail.mission} />
      <InfoRow title="참여 채널 안내" text={detail.channelGuide} />
      <InfoRow title="제출 요건" text={detail.submissionRequirement} />
      <InfoRow title="신청서">
        {formError ? (
          <p role="alert">{formError}</p>
        ) : form ? (
          <>
            <p>
              참여 방식:{' '}
              {(form.allowedFulfillmentTypes || [])
                .map(fulfillmentLabel)
                .join(', ')}
            </p>
            {(form.questions || []).length > 0 ? (
              <ul className="campaign-detail__list">
                {form.questions.map((q) => (
                  <li key={q.id}>
                    {q.label}{' '}
                    <span className="discovery-muted">
                      · {q.required ? '필수' : '선택'}
                      {q.type && ` · ${QUESTION_TYPES[q.type] || '기타 형식'}`}
                      {q.maxLength != null && ` · 최대 ${q.maxLength}자`}
                    </span>
                    {q.options?.length > 0 && (
                      <p className="discovery-muted">
                        선택지: {q.options.join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="discovery-muted">추가 질문이 없습니다.</p>
            )}
            <p className="discovery-muted">신청 조건 버전 {form.version}</p>
          </>
        ) : (
          <p className="discovery-muted">신청 조건이 준비되지 않았습니다.</p>
        )}
      </InfoRow>
    </dl>
  )
}

// '유의사항' 탭: 추가 안내, 배송·방문 안내, 신청할 때 확인하는 문서
function NoticePanel({ detail, form }) {
  return (
    <dl className="campaign-detail__rows">
      <InfoRow title="추가 안내사항" text={detail.caution} />
      {detail.deliveryGuide && (
        <InfoRow title="배송 안내" text={detail.deliveryGuide} />
      )}
      {detail.visitGuide && (
        <InfoRow title="방문 안내" text={detail.visitGuide} />
      )}
      {form?.agreements?.length > 0 && (
        <InfoRow title="확인 문서">
          <ul className="campaign-detail__list">
            {form.agreements.map((d) => (
              <li key={d.id}>
                <details>
                  <summary>
                    {d.title}{' '}
                    <span className="discovery-muted">
                      · {d.required ? '필수' : '선택'} · 버전 {d.version}
                    </span>
                  </summary>
                  <p className="campaign-detail__text">
                    {d.body || '문서 본문이 등록되지 않았습니다.'}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </InfoRow>
      )}
    </dl>
  )
}

// 실제 상세와 신청 폼은 따로 읽습니다. 폼 조회가 실패해도 공개 상세는 보여 줍니다.
export default function LiveCampaignDetailPage({ campaignId }) {
  const [state, setState] = useState({
    detail: null,
    form: null,
    loading: true,
    error: '',
    formError: '',
  })
  const [attempt, setAttempt] = useState(0)
  const [tab, setTab] = useState('info')
  const media = useCampaignPresentation(campaignId, attempt)

  useEffect(() => {
    const controller = new AbortController()
    Promise.allSettled([
      readCampaign(campaignId, controller.signal),
      readCampaignForm(campaignId, controller.signal),
    ]).then(([detail, form]) => {
      if (controller.signal.aborted) return
      setState({
        loading: false,
        detail: detail.status === 'fulfilled' ? detail.value : null,
        error:
          detail.status === 'rejected' ? campaignReadError(detail.reason) : '',
        form: form.status === 'fulfilled' ? form.value : null,
        formError:
          form.status === 'rejected' ? campaignReadError(form.reason) : '',
      })
    })
    return () => controller.abort()
  }, [campaignId, attempt])

  const retry = () => {
    setState((current) => ({ ...current, loading: true }))
    setAttempt((value) => value + 1)
  }

  // 탭은 좌우 화살표로도 옮길 수 있습니다.
  const onTabKey = (event) => {
    const index = TABS.findIndex(([key]) => key === tab)
    const delta =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const [next] = TABS[(index + delta + TABS.length) % TABS.length]
    setTab(next)
    document.getElementById(`campaign-tab-${next}`)?.focus()
  }

  const { detail, form } = state
  const cover =
    media.data?.representativeImageUrl || detail?.representativeImageUrl
  const recruiting = detail ? isRecruiting(detail) : false
  const kind = detail ? campaignKindLabel(detail.campaignType) : ''
  const fulfillment = (form?.allowedFulfillmentTypes || [])
    .map(fulfillmentLabel)
    .join('·')

  return (
    <DiscoveryLayout>
      <main className="discovery-width campaign-detail">
        {state.loading && !detail ? (
          <div className="main-home__state" role="status">
            캠페인을 불러오는 중입니다.
          </div>
        ) : state.error || !detail ? (
          <div className="main-home__state" role="alert">
            <p>{state.error || '캠페인을 찾을 수 없습니다.'}</p>
            <button type="button" onClick={retry}>
              다시 시도
            </button>
            <Link to="/home">메인으로 돌아가기</Link>
          </div>
        ) : (
          <div className="campaign-detail__layout">
            {/* 왼쪽: 대표 이미지 · 탭 · 신청 영역 */}
            <div className="campaign-detail__main">
              <figure className="campaign-detail__cover">
                {cover ? (
                  <img src={cover} alt={`${detail.title} 대표 이미지`} />
                ) : (
                  <figcaption>대표 이미지 준비 중</figcaption>
                )}
              </figure>

              <div className="campaign-detail__content">
                <div
                  className="campaign-detail__tabs"
                  role="tablist"
                  aria-label="캠페인 상세"
                >
                  {TABS.map(([key, label]) => (
                    <button
                      key={key}
                      id={`campaign-tab-${key}`}
                      type="button"
                      role="tab"
                      aria-selected={tab === key}
                      aria-controls="campaign-tab-panel"
                      tabIndex={tab === key ? 0 : -1}
                      onClick={() => setTab(key)}
                      onKeyDown={onTabKey}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div
                  id="campaign-tab-panel"
                  className="campaign-detail__panel"
                  role="tabpanel"
                  aria-labelledby={`campaign-tab-${tab}`}
                  tabIndex={0}
                >
                  {tab === 'info' && (
                    <InfoPanel
                      detail={detail}
                      location={media.data?.visitLocation}
                    />
                  )}
                  {tab === 'page' && (
                    <CampaignDetailImages
                      images={media.data?.detailImages}
                      legacyImageUrl={detail.detailImageUrl}
                      loading={media.loading}
                      error={media.error}
                      onRetry={media.retry}
                    />
                  )}
                  {tab === 'mission' && (
                    <MissionPanel
                      detail={detail}
                      form={form}
                      formError={state.formError}
                    />
                  )}
                  {tab === 'schedule' && (
                    <>
                      <CampaignSchedule
                        key={`tab-${detail.scheduleVersion}`}
                        schedule={liveCampaignSchedule(detail)}
                        defaultExpanded
                      />
                      {detail.scheduleGuide && (
                        <p className="campaign-detail__text">
                          {detail.scheduleGuide}
                        </p>
                      )}
                    </>
                  )}
                  {tab === 'notice' && (
                    <NoticePanel detail={detail} form={form} />
                  )}
                </div>
              </div>

              {/* 신청 영역: 로그인·이메일 인증·참여 조건·신청서 */}
              <section
                className="campaign-detail__apply"
                id="campaign-apply"
                aria-labelledby="campaign-apply-title"
              >
                <h2 id="campaign-apply-title">신청</h2>
                {state.formError && <p role="alert">{state.formError}</p>}
                <CampaignParticipation
                  campaignId={campaignId}
                  form={form}
                  onRefresh={retry}
                />
                {state.formError && (
                  <button
                    className="discovery-outline-button"
                    type="button"
                    onClick={retry}
                  >
                    신청 조건 다시 조회
                  </button>
                )}
              </section>
            </div>

            {/* 오른쪽: 요약 카드(화면 위쪽에 붙어 따라옵니다) */}
            <div className="campaign-detail__side">
              <section
                className="campaign-detail__summary"
                aria-label="캠페인 요약"
              >
                <div className="campaign-detail__summary-head">
                  <p>
                    {[detail.brandName, kind, fulfillment]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <FavoriteButton
                    campaignId={String(detail.id)}
                    title={detail.title}
                    className="campaign-detail__favorite"
                  />
                </div>
                <h1>{detail.title}</h1>
                {detail.contentChannel && (
                  <ChannelIcon channel={detail.contentChannel} />
                )}
                {/* 선착순(방문형): 신청하면 모집 인원이 찰 때까지 바로 선정됩니다. */}
                {detail.selectionMode === 'FIRST_COME' && (
                  <p className="campaign-detail__first-come">
                    <strong>선착순</strong> 신청하면 바로 선정되고, 모집 인원이
                    차면 신청이 마감됩니다.
                  </p>
                )}
                <CampaignSchedule
                  key={detail.scheduleVersion}
                  schedule={liveCampaignSchedule(detail)}
                />
                {/* 신청·선정 인원을 주기적으로 다시 불러와 '신청 1 / 모집 2명'처럼 보여 줍니다. */}
                <RecruitmentProgress
                  campaignId={campaignId}
                  recruitmentCount={detail.recruitmentCount}
                  open={recruiting}
                />
                {/* 구매평 캠페인은 구매처·판매가·환급액 안내를 함께 보여 줍니다. */}
                {detail.campaignType === 'PURCHASE_REVIEW' && (
                  <PurchaseInfoCard campaignId={campaignId} />
                )}
                <button
                  type="button"
                  className="campaign-detail__cta"
                  onClick={scrollToApply}
                  disabled={!recruiting}
                >
                  {recruiting
                    ? detail.selectionMode === 'FIRST_COME'
                      ? '선착순 신청하기'
                      : '신청서 작성하기'
                    : '모집이 끝났습니다'}
                </button>
                <button
                  type="button"
                  className="campaign-detail__refresh"
                  onClick={retry}
                >
                  정보 새로고침
                </button>
              </section>
            </div>
          </div>
        )}

        {/* 모바일 전용 하단 고정 신청 바입니다. 넓은 화면에서는 CSS로 숨깁니다. */}
        {detail && !state.error && (
          <div className="discovery-detail__mobile-cta">
            <span>
              <strong>{recruitmentDeadlineLabel(detail)}</strong>
              모집 {detail.recruitmentCount ?? '-'}명
            </span>
            <button
              type="button"
              onClick={scrollToApply}
              disabled={!recruiting}
            >
              {recruiting ? '신청하기' : '모집 종료'}
            </button>
          </div>
        )}
      </main>
    </DiscoveryLayout>
  )
}
