/**
 * 본인 전용 작업공간을 조회하여 선택한 신청의 일정·안내·제출을 함께 표시합니다.
 * '목록'과 '달력' 보기를 바꿀 수 있고, 선택한 신청에서는 신청 철회·참여 취소·기간 연장(참여 조정)을 할 수 있습니다.
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import BuyerLayout from '../../components/buyer/BuyerLayout'
import CampaignSchedule from '../discovery/CampaignSchedule'
import { liveCampaignSchedule } from '../discovery/scheduleModel'
import VisitEvidence from '../sellerCampaigns/VisitEvidence'
import { liveCampaignVisitEvidenceApi } from '../../api/liveCampaignVisitEvidenceApi'
import MyContentSubmission from './MyContentSubmission'
import PurchaseInfoCard from '../purchaseReview/PurchaseInfoCard'
import ApplicationEditPanel from '../participation/ApplicationEditPanel'
import VisitReservationPanel from '../participation/VisitReservationPanel'
import ShipmentCard from '../shipping/ShipmentCard'
import PurchaseProofPanel from '../purchaseReview/PurchaseProofPanel'
import ParticipationChangePanel from '../participation/ParticipationChangePanel'
import MyCampaignCalendar from '../participation/MyCampaignCalendar'
import { extendedResultsAt } from '../participation/participationChangeModel'
import {
  APPLICATION_STATUS,
  applicationStatusLabel,
  nextCampaignAction,
  workspaceDate,
  workspaceTime,
} from './campaignWorkspaceModel'
import { SELECTION_MODES } from '../business/selectionModeModel'
import {
  CAMPAIGN_STAGES,
  filterFromParams,
  matchesFilter,
  paramsFromFilter,
} from './campaignSummaryModel'

function Guide({ title, value }) {
  return (
    <div className="campaign-workspace__guide">
      <h3>{title}</h3>
      <p>{value || '등록된 안내가 없습니다.'}</p>
    </div>
  )
}
function Workspace({ item, onReload, attempt }) {
  const { application, campaign, brandContact, content } = item
  const shipping = application.shippingContact
  return (
    <article
      className="campaign-workspace__detail"
      aria-label="선택한 캠페인 작업"
    >
      <header>
        <span className="campaign-workspace__status">
          {applicationStatusLabel(application)}
        </span>
        <h2>{campaign.title || `캠페인 #${application.campaignId}`}</h2>
        <p>
          {campaign.brandName || '브랜드명 미등록'} · 신청 #{application.id}
        </p>
        {/* 언제 신청했는지 상세 머리에도 함께 보여줍니다. */}
        <p>신청 일시 {workspaceTime(application.submittedAt)}</p>
        <Link to={`/campaign/${application.campaignId}`}>
          캠페인 상세 보기 ↗
        </Link>
      </header>
      <p>선정 방식: {SELECTION_MODES[campaign.selectionMode] || '확인 필요'}</p>
      <p className="campaign-workspace__next" role="status">
        {nextCampaignAction(application, content)}
      </p>
      {/* 신청 철회(발표 전) · 참여 취소(단순·협의) · 기간 연장 */}
      <ParticipationChangePanel
        key={`change-${application.id}-${attempt}`}
        application={application}
        onChanged={onReload}
      />
      {/* 선정 전(접수)에는 신청 메시지·배송지·질문 답변을 고칠 수 있습니다. */}
      {application.status === 'SUBMITTED' && (
        <ApplicationEditPanel
          key={`edit-${application.id}`}
          application={application}
          onSaved={onReload}
        />
      )}
      <section className="campaign-workspace__section">
        <h2>참여 일정</h2>
        <p className="campaign-workspace__deadline">
          <strong>콘텐츠 제출 마감</strong>{' '}
          {workspaceTime(
            application.contentDeadlineExtendedUntil ||
              campaign.contentSubmissionEndAt,
          )}
          {(application.contentDeadlineExtendedUntil ||
            campaign.contentSubmissionEndAt) &&
            ' 전까지 (한국 시간)'}
          {application.contentDeadlineExtendedUntil && ' · 연장 승인됨'}
        </p>
        {/* 기간 연장이 승인된 신청은 늘어난 체험 기간·콘텐츠 마감으로 보여 줍니다. */}
        <CampaignSchedule
          schedule={liveCampaignSchedule({
            ...campaign,
            experienceEndAt:
              application.experienceExtendedUntil || campaign.experienceEndAt,
            contentSubmissionEndAt:
              application.contentDeadlineExtendedUntil ||
              campaign.contentSubmissionEndAt,
            // 마감이 늘어 결과 발표가 마감보다 앞서면 같은 만큼 미뤄 보여 줍니다.
            resultsAnnouncedAt: extendedResultsAt(campaign, application),
          })}
          defaultExpanded
        />
        {campaign.scheduleGuide && <p>{campaign.scheduleGuide}</p>}
      </section>
      <section className="campaign-workspace__section">
        <h2>미션과 제출 안내</h2>
        <Guide title="요청사항 · 미션" value={campaign.mission} />
        <Guide title="채널별 작성 안내" value={campaign.channelGuide} />
        <Guide title="제출 요구사항" value={campaign.submissionRequirement} />
        <Guide title="주의사항" value={campaign.caution} />
        {application.fulfillmentType === 'DELIVERY' && (
          <Guide title="배송 안내" value={campaign.deliveryGuide} />
        )}
        {/* 선정된 배송형 참여자는 발송 여부와 송장번호를 확인합니다. */}
        {application.fulfillmentType === 'DELIVERY' &&
          [
            'SELECTED',
            'ACTIVE',
            'CONTENT_SUBMITTED',
            'REVISION_REQUESTED',
            'COMPLETED',
          ].includes(application.status) && (
            <ShipmentCard
              key={`shipment-${application.id}-${attempt}`}
              application={application}
            />
          )}
        {application.fulfillmentType === 'VISIT' && (
          <>
            <Guide title="방문 안내" value={campaign.visitGuide} />
            <Guide
              title="방문 장소"
              value={[campaign.visitPlaceName, campaign.visitAddress]
                .filter(Boolean)
                .join(' · ')}
            />
            {/* 선정된 방문형 참여자는 방문 희망 일시를 예약 요청합니다. */}
            {[
              'ACTIVE',
              'CONTENT_SUBMITTED',
              'REVISION_REQUESTED',
              'COMPLETED',
            ].includes(application.status) && (
              <VisitReservationPanel
                key={`reservation-${application.id}-${attempt}`}
                application={application}
                mode="participant"
              />
            )}
            <VisitEvidence
              key={`visit-${application.id}-${attempt}`}
              api={liveCampaignVisitEvidenceApi}
              applicationId={application.id}
            />
          </>
        )}
      </section>
      {/* 구매평 캠페인: 구매 안내와 구매 인증·환급 상태 */}
      {application.fulfillmentType === 'PURCHASE' && (
        <>
          <PurchaseInfoCard campaignId={application.campaignId} />
          <PurchaseProofPanel
            key={`purchase-${application.id}`}
            application={application}
            onReload={onReload}
          />
        </>
      )}
      <section className="campaign-workspace__section">
        <h2>연락처 확인</h2>
        <div className="campaign-workspace__contacts">
          <div>
            <h3>브랜드 담당자</h3>
            {brandContact ? (
              <p>
                {brandContact.name || '담당자명 미등록'}
                <br />
                {brandContact.phone || '연락처 미등록'}
              </p>
            ) : (
              <p>
                {['SUBMITTED', 'REJECTED', 'CANCELLED'].includes(
                  application.status,
                )
                  ? '선정된 참여자만 담당자 연락처를 확인하실 수 있습니다.'
                  : '브랜드가 등록한 담당자 연락처가 없습니다.'}
              </p>
            )}
            <small>브랜드가 이 캠페인에 공개한 연락처입니다.</small>
          </div>
          {application.fulfillmentType === 'DELIVERY' && (
            <div>
              <h3>내 신청 배송 정보</h3>
              {shipping ? (
                <p>
                  {shipping.recipientName}
                  <br />
                  {shipping.recipientPhone}
                  <br />
                  {[shipping.postalCode, shipping.address1, shipping.address2]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              ) : (
                <p>저장된 배송 정보가 없습니다.</p>
              )}
              <small>신청할 때 입력한 본인의 정보입니다.</small>
            </div>
          )}
        </div>
      </section>
      <MyContentSubmission
        application={application}
        campaign={campaign}
        submission={content}
        available
        onReload={onReload}
      />
    </article>
  )
}
export default function MyCampaignsPage() {
  const [state, setState] = useState({ loading: true, items: [], error: '' })
  const [attempt, setAttempt] = useState(0)
  // 그냥 들어오면 상세를 열지 않고, 알림처럼 특정 신청을 가리켜 들어오면 그 신청 상세를 바로 엽니다(아래 효과).
  // undefined는 아직 고르지 않음(알림으로 가리킨 신청을 자동으로 엶), null은 사용자가 상세를 닫은 상태입니다.
  const [selectedId, setSelectedId] = useState(undefined)
  // 'list'(목록) 또는 'calendar'(월 달력)
  const [view, setView] = useState('list')
  const [params, setParams] = useSearchParams()
  const targetApplication = params.get('applicationId')
  const targetContent = params.get('contentId')
  // 마이페이지·계정 메뉴의 단계 요약(신청·선정·진행·완료)에서 ?status= 또는 ?stage=로 들어오면 그 단계로 목록을 좁혀 보여줍니다.
  // 필터는 주소에서 바로 읽으므로, 이 화면에 있는 채로 계정 메뉴의 다른 단계를 눌러도 목록이 바로 바뀝니다.
  const filter = filterFromParams(params, Object.keys(APPLICATION_STATUS))
  const setFilter = (value) => setParams(paramsFromFilter(value))
  const reload = () => {
    setState((old) => ({ ...old, loading: true }))
    setAttempt((v) => v + 1)
  }
  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/campaigns/applications/mine/workspaces', {
        signal: controller.signal,
        timeout: 15000,
      })
      .then(({ data }) => {
        // 부분 응답을 제출 전 상태로 오해하지 않도록 작업공간 전체 형식을 확인합니다.
        if (
          !Array.isArray(data) ||
          data.some(
            (item) =>
              !item.application?.id ||
              !item.campaign?.id ||
              !Object.hasOwn(item, 'content'),
          )
        )
          throw new Error('작업공간 응답을 확인할 수 없습니다.')
        if (!controller.signal.aborted)
          setState({ loading: false, items: data, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            items: [],
            error:
              error.response?.data?.detail ||
              '내 캠페인을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.',
          })
      })
    return () => controller.abort()
  }, [attempt])
  const shown = state.items.filter(
    (item) =>
      matchesFilter(item.application.status, filter) &&
      (!targetApplication ||
        String(item.application.id) === targetApplication) &&
      (!targetContent || String(item.content?.id) === targetContent),
  )
  // 알림·링크로 신청 하나를 가리켜 들어왔다면 목록을 한 번 더 누르지 않아도 상세가 열리게 합니다.
  const onlyTarget =
    (targetApplication || targetContent) && shown.length === 1
      ? shown[0].application.id
      : null
  const activeId = selectedId === undefined ? onlyTarget : selectedId
  const selected = shown.find((item) => item.application.id === activeId)
  return (
    <BuyerLayout title="내 캠페인" className="campaign-workspace">
      <div className="campaign-workspace__toolbar">
        <p>신청부터 체험, 콘텐츠 제출과 검토까지 한곳에서 확인하세요.</p>
        <button onClick={reload} disabled={state.loading}>
          새로고침
        </button>
      </div>
      {(targetApplication || targetContent) && (
        <p>
          알림과 연결된 캠페인 목록입니다.{' '}
          <button
            onClick={() => {
              setParams({})
              setSelectedId(null)
            }}
          >
            전체 캠페인 보기
          </button>
        </p>
      )}
      <p className="campaign-workspace__submission-help">
        목록에서 캠페인을 선택하면 일정과 제출 작업을 확인하실 수 있습니다.
        선정되면 바로 참여가 시작되며, 체험 완료 확인을 진행하면 상세 하단의
        ‘콘텐츠 제출·검토’에서 게시물 링크를 제출하실 수 있습니다. 제출한 링크와
        브랜드 검토 결과도 같은 곳에 표시됩니다.
      </p>
      {state.loading ? (
        <p role="status">내 캠페인을 불러오고 있습니다.</p>
      ) : state.error ? (
        <div role="alert">
          <p>{state.error}</p>
          <button onClick={reload}>다시 시도</button>
        </div>
      ) : !state.items.length ? (
        <p>아직 신청한 캠페인이 없습니다.</p>
      ) : (
        <>
          <div
            className="campaign-workspace__views"
            role="tablist"
            aria-label="보기 방식"
          >
            {[
              ['list', '목록'],
              ['calendar', '달력'],
            ].map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {view === 'calendar' ? (
            <MyCampaignCalendar
              items={state.items}
              onOpen={(id) => {
                setParams({})
                setSelectedId(id)
                setView('list')
              }}
            />
          ) : (
            <>
              <label className="campaign-workspace__filter">
                진행 상태{' '}
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value)
                    setSelectedId(null)
                  }}
                >
                  <option value="">전체 ({state.items.length})</option>
                  {CAMPAIGN_STAGES.filter(
                    (stage) => stage.statuses.length > 1,
                  ).map((stage) => (
                    <option key={stage.key} value={`stage:${stage.key}`}>
                      {stage.label} 전체 (
                      {
                        state.items.filter((item) =>
                          stage.statuses.includes(item.application.status),
                        ).length
                      }
                      )
                    </option>
                  ))}
                  {Object.entries(APPLICATION_STATUS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {!shown.length ? (
                <p>선택한 상태의 캠페인이 없습니다.</p>
              ) : (
                <div className="campaign-workspace__grid">
                  <nav aria-label="내 캠페인 선택">
                    <ul className="campaign-workspace__list">
                      {shown.map((item) => (
                        <li key={item.application.id}>
                          <button
                            aria-current={
                              selected === item ? 'true' : undefined
                            }
                            onClick={() => setSelectedId(item.application.id)}
                          >
                            <span className="campaign-workspace__status">
                              {applicationStatusLabel(item.application)}
                            </span>
                            <strong>
                              {item.campaign.title ||
                                `캠페인 #${item.application.campaignId}`}
                            </strong>
                            <span>
                              {item.campaign.brandName || '브랜드명 미등록'}
                            </span>
                            {/* 목록에서도 신청한 날짜를 바로 볼 수 있게 합니다. */}
                            <small>
                              신청 {workspaceDate(item.application.submittedAt)}
                            </small>
                            <small>
                              콘텐츠 마감{' '}
                              {workspaceTime(
                                item.application.contentDeadlineExtendedUntil ||
                                  item.campaign.contentSubmissionEndAt,
                              )}
                            </small>
                            <span className="campaign-workspace__open">
                              일정·제출 확인 →
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  {selected && (
                    <Workspace
                      key={`${selected.application.id}-${attempt}`}
                      item={selected}
                      attempt={attempt}
                      onReload={reload}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
      <Link className="campaign-workspace__browse" to="/home">
        캠페인 둘러보기 →
      </Link>
    </BuyerLayout>
  )
}
