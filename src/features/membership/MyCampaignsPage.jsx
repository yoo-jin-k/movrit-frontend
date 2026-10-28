/** 본인 전용 작업공간을 조회하여 선택한 신청의 일정·안내·제출을 함께 표시합니다. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import BuyerLayout from '../../components/buyer/BuyerLayout'
import CampaignSchedule from '../discovery/CampaignSchedule'
import { liveCampaignSchedule } from '../discovery/scheduleModel'
import VisitEvidence from '../sellerCampaigns/VisitEvidence'
import { liveCampaignVisitEvidenceApi } from '../../api/liveCampaignVisitEvidenceApi'
import MyContentSubmission from './MyContentSubmission'
import {
  APPLICATION_STATUS,
  nextCampaignAction,
  workspaceTime,
} from './campaignWorkspaceModel'
import './myCampaignWorkspace.css'

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
          {APPLICATION_STATUS[application.status] || '상태 확인 필요'}
        </span>
        <h2>{campaign.title || `캠페인 #${application.campaignId}`}</h2>
        <p>
          {campaign.brandName || '브랜드명 미등록'} · 신청 #{application.id}
        </p>
        <Link to={`/campaign/${application.campaignId}`}>
          캠페인 상세 보기 ↗
        </Link>
      </header>
      <p className="campaign-workspace__next" role="status">
        {nextCampaignAction(application, content)}
      </p>
      <section className="campaign-workspace__section">
        <h2>참여 일정</h2>
        <p className="campaign-workspace__deadline">
          <strong>콘텐츠 제출 마감</strong>{' '}
          {workspaceTime(campaign.contentSubmissionEndAt)}
          {campaign.contentSubmissionEndAt && ' 전까지 (한국 시간)'}
        </p>
        <CampaignSchedule
          schedule={liveCampaignSchedule(campaign)}
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
        {application.fulfillmentType === 'VISIT' && (
          <>
            <Guide title="방문 안내" value={campaign.visitGuide} />
            <Guide
              title="방문 장소"
              value={[campaign.visitPlaceName, campaign.visitAddress]
                .filter(Boolean)
                .join(' · ')}
            />
            <VisitEvidence
              key={`visit-${application.id}-${attempt}`}
              api={liveCampaignVisitEvidenceApi}
              applicationId={application.id}
            />
          </>
        )}
      </section>
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
  // 진입 시에는 상세를 열지 않고 사용자가 직접 선택한 신청만 표시합니다.
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('')
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
    (item) => !filter || item.application.status === filter,
  )
  const selected = shown.find((item) => item.application.id === selectedId)
  return (
    <BuyerLayout title="내 캠페인" className="campaign-workspace">
      <div className="campaign-workspace__toolbar">
        <p>신청부터 체험, 콘텐츠 제출과 검토까지 한곳에서 확인하세요.</p>
        <button onClick={reload} disabled={state.loading}>
          새로고침
        </button>
      </div>
      <p className="campaign-workspace__submission-help">
        목록에서 캠페인을 선택하면 일정과 제출 작업을 확인하실 수 있습니다. 선정
        후 참여 수락과 체험 완료 확인을 진행하면 상세 하단의 ‘콘텐츠
        제출·검토’에서 게시물 링크를 제출하실 수 있습니다. 제출한 링크와 브랜드
        검토 결과도 같은 곳에 표시됩니다.
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
                        aria-current={selected === item ? 'true' : undefined}
                        onClick={() => setSelectedId(item.application.id)}
                      >
                        <span className="campaign-workspace__status">
                          {APPLICATION_STATUS[item.application.status] ||
                            '상태 확인 필요'}
                        </span>
                        <strong>
                          {item.campaign.title ||
                            `캠페인 #${item.application.campaignId}`}
                        </strong>
                        <span>
                          {item.campaign.brandName || '브랜드명 미등록'}
                        </span>
                        <small>
                          콘텐츠 마감{' '}
                          {workspaceTime(item.campaign.contentSubmissionEndAt)}
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
      <Link className="campaign-workspace__browse" to="/home">
        캠페인 둘러보기 →
      </Link>
    </BuyerLayout>
  )
}
