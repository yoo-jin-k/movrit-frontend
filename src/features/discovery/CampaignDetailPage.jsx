import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DiscoveryLayout from './DiscoveryLayout'
import CampaignGrid from './CampaignGrid'
import CampaignApplicationDialog from './CampaignApplicationDialog'
import { PREVIEW_CAMPAIGNS } from './catalog'
import LiveCampaignDetailPage from './LiveCampaignDetailPage'
import CampaignSchedule from './CampaignSchedule'

function InformationSection({ title, lines, children }) {
  return (
    <div>
      <dt>{title}</dt>
      <dd>
        {lines?.length ? (
          lines.map((line) => <p key={line}>{line}</p>)
        ) : (
          <p className="discovery-muted">
            해당 캠페인의 안내가 아직 구성되지 않았습니다.
          </p>
        )}
        {children}
      </dd>
    </div>
  )
}

// 공통 레이아웃만 재사용하고 유형·미션·채널·자격·신청 조건은 캠페인 데이터로 렌더링합니다.
function PreviewCampaignDetailPage() {
  const { campaignId } = useParams()
  const item = PREVIEW_CAMPAIGNS.find((campaign) => campaign.id === campaignId)
  const [expanded, setExpanded] = useState(false)
  const [notice, setNotice] = useState('')
  const dialog = useRef(null)
  const detail = item?.detail
  const schedule = detail?.schedule

  return (
    <DiscoveryLayout notice={notice} onCloseNotice={() => setNotice('')}>
      {!item ? (
        <main className="discovery-width main-home__state">
          <h1>캠페인을 찾을 수 없습니다.</h1>
          <Link to="/category/제품">캠페인 목록으로 돌아가기</Link>
        </main>
      ) : (
        <main className="discovery-width discovery-detail">
          <div className="discovery-detail__layout">
            <div className="discovery-detail__body">
              <div
                className={`discovery-detail__visual ${expanded ? 'is-expanded' : ''}`}
              >
                <img src={item.image} alt={item.title} />
                <div className="discovery-detail__visual-copy">
                  <span>MOVRIT CAMPAIGN</span>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
              </div>
              <button
                className="discovery-detail__expand"
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? '상세이미지 접기 ⌃' : '상세이미지 더보기 ⌄'}
              </button>
              <dl className="discovery-detail__information">
                <InformationSection title="제공 내역" lines={detail.provided} />
                <InformationSection
                  title={detail.fulfillment?.title || '참여 및 이행안내'}
                  lines={detail.fulfillment?.paragraphs}
                />
                <InformationSection
                  title="참여 자격 및 조건"
                  lines={detail.qualifications}
                />
                <InformationSection
                  title="캠페인 미션"
                  lines={detail.missions}
                />
                <InformationSection
                  title="필수 채널 및 제출요건"
                  lines={
                    detail.submissions.length
                      ? [`참여 채널: ${item.media}`, ...detail.submissions]
                      : []
                  }
                />
                {detail.keywords.length > 0 && (
                  <InformationSection title="키워드" lines={detail.keywords}>
                    <button
                      type="button"
                      className="discovery-outline-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            detail.keywords.join(', '),
                          )
                          setNotice('이 캠페인의 예시 키워드를 복사했습니다.')
                        } catch {
                          setNotice(
                            '복사하지 못했습니다. 키워드를 직접 선택해 주세요.',
                          )
                        }
                      }}
                    >
                      키워드 복사
                    </button>
                  </InformationSection>
                )}
                <InformationSection
                  title="추가 안내사항"
                  lines={detail.warnings}
                />
              </dl>
            </div>
            <aside className="discovery-detail__summary">
              <h1>{item.title}</h1>
              <div className="discovery-detail__tags">
                <span>{item.media}</span>
                <span>
                  {detail.experienceType === 'DELIVERY'
                    ? '배송형'
                    : detail.experienceType === 'VISIT'
                      ? '방문형'
                      : '이행 유형 미구성'}
                </span>
                <span>개발 미리보기</span>
              </div>
              <CampaignSchedule schedule={schedule} />
              <p>
                신청 {item.applicants.toLocaleString()} / {item.capacity}명
              </p>
              <small>
                모집·일정·조건은 화면 검수용 예시이며 실제 모집이 아닙니다.
              </small>
              {detail.blockingReason && (
                <p className="discovery-info">{detail.blockingReason}</p>
              )}
              <button
                className="discovery-primary-button"
                type="button"
                disabled={Boolean(detail.blockingReason)}
                onClick={() => dialog.current?.showModal()}
              >
                {detail.blockingReason
                  ? '신청 조건 준비 중'
                  : '캠페인 신청하기'}
              </button>
              {detail.blockingReason && import.meta.env.DEV && (
                <button
                  className="discovery-outline-button"
                  type="button"
                  onClick={() => dialog.current?.showModal()}
                >
                  신청 폼 미리보기
                </button>
              )}
            </aside>
          </div>
          <section className="main-campaign-section">
            <div className="main-campaign-section__heading">
              <h2>연관 캠페인</h2>
            </div>
            <CampaignGrid
              items={PREVIEW_CAMPAIGNS.filter(
                (campaign) =>
                  campaign.id !== item.id && campaign.kind === item.kind,
              ).slice(0, 5)}
            />
          </section>
          <CampaignApplicationDialog
            key={item.id}
            item={item}
            dialogRef={dialog}
          />
        </main>
      )}
    </DiscoveryLayout>
  )
}

// 예시 ID와 실제 캠페인 ID를 분리하여 실제 조회에 예시 상세를 섞지 않습니다.
export default function CampaignDetailPage() {
  const { campaignId } = useParams()
  return campaignId.startsWith('demo-') ? (
    <PreviewCampaignDetailPage key={campaignId} />
  ) : (
    <LiveCampaignDetailPage key={campaignId} campaignId={campaignId} />
  )
}
