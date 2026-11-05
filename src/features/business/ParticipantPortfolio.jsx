/** 선택한 신청의 공개 프로필·현재 지표·답변·최종 완료 이력만 표시합니다. */
import {
  channelLabel,
  completedCountLabel,
  metricValueLabel,
  requirementResult,
} from './participantPortfolioModel'
import { metricVerificationLabel } from '../membership/channelProfileModel'
import { myContentLink } from '../membership/myContentModel'
import { workspaceTime } from '../membership/campaignWorkspaceModel'
import { campaignRequirementSummary } from '../discovery/eligibilityModel'
import {
  connectionBadge,
  followerText,
} from '../membership/channelConnectModel'

// 참여자가 연결·등록한 SNS 채널입니다. 로그인 연결·운영자 확인 여부를 배지로 함께 보여줍니다(반려된 채널은 서버가 빼고 보냅니다).
function LinkedChannels({ channels }) {
  if (!Array.isArray(channels) || !channels.length)
    return <p>연결한 SNS 채널이 없습니다.</p>
  return (
    <ul className="participant-linked-channels">
      {channels.map((channel) => {
        const badge = connectionBadge(channel)
        const url = myContentLink(channel.profileUrl)
        return (
          <li key={channel.provider}>
            <strong>{channel.label}</strong>
            {url ? (
              <a
                className="business-link"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {channel.accountName} ↗
              </a>
            ) : (
              <span>{channel.accountName}</span>
            )}
            <span>{followerText(channel.provider, channel.followerCount)}</span>
            {badge && (
              <em className={`participant-channel-badge ${badge.tone}`}>
                {badge.text}
              </em>
            )}
          </li>
        )
      })}
    </ul>
  )
}
export function ParticipantMetrics({ metrics, compact = false }) {
  if (!Array.isArray(metrics)) return <span>채널·지표 확인 필요</span>
  if (!metrics.length) return <span>등록된 채널 지표가 없습니다.</span>
  return (
    <ul className={`participant-metrics ${compact ? 'is-compact' : ''}`}>
      {metrics.map((metric, index) => (
        <li key={`${metric.channelType}-${metric.metricType}-${index}`}>
          <strong>{channelLabel(metric.channelType)}</strong>
          <span>
            {metric.metricName || '지표'} {metricValueLabel(metric.value)}
          </span>
          <small>{metricVerificationLabel(metric.verificationStatus)}</small>
          {!compact && (
            <small>
              출처:{' '}
              {metric.source === 'UNKNOWN' ? '출처 정보 없음' : '확인 필요'} ·
              측정일: {workspaceTime(metric.measuredAt)}
              {metric.measurementPeriod &&
                ` · 집계 기간: ${metric.measurementPeriod}`}
            </small>
          )}
        </li>
      ))}
    </ul>
  )
}
export default function ParticipantPortfolio({ data }) {
  const {
    profile,
    metrics,
    applicationAnswers,
    requirementEvaluation: evaluation,
    completedCampaignCount,
    completedCampaigns,
    linkedChannels,
  } = data
  const channelUrl = myContentLink(profile.channelUrl)
  return (
    <div className="participant-portfolio">
      <section aria-label="참여자 프로필">
        <h3>참여자 프로필</h3>
        <div className="participant-profile">
          <span className="business-avatar" aria-hidden="true">
            {(profile.accountNickname || profile.channelNickname || 'M').slice(
              0,
              1,
            )}
          </span>
          <div>
            <strong>
              {profile.accountNickname ||
                profile.channelNickname ||
                '닉네임 미등록'}
            </strong>
            <p>활동 닉네임: {profile.channelNickname || '미등록'}</p>
            <p>{profile.primaryCategory || '활동 분야 미등록'}</p>
          </div>
        </div>
        <p>{profile.bio || '등록된 소개가 없습니다.'}</p>
        <p className="business-badge">
          {completedCountLabel(completedCampaignCount)}
        </p>
        {channelUrl ? (
          <p>
            <a
              className="business-link"
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              활동 채널 바로가기 ↗
            </a>
          </p>
        ) : (
          <p>열 수 있는 활동 채널 주소가 없습니다.</p>
        )}
      </section>
      <section aria-label="연결한 SNS 채널">
        <h3>연결한 SNS 채널</h3>
        <LinkedChannels channels={linkedChannels} />
      </section>
      <section aria-label="채널 지표">
        <h3>채널·지표</h3>
        <ParticipantMetrics metrics={metrics} />
      </section>
      <section aria-label="참여 조건 확인">
        <h3>조건 충족 여부</h3>
        <strong>{requirementResult(evaluation)}</strong>
        <p>
          {evaluation.evaluationBasis === 'NO_REQUIREMENT_AT_APPLICATION'
            ? '신청 당시 추가 채널 조건이 없었습니다.'
            : campaignRequirementSummary(
                evaluation.applicationRequirementSnapshot ?? undefined,
              )}
        </p>
        {evaluation.evaluationBasis === 'METRIC_AT_APPLICATION' ? (
          <>
            {/* 블로그 방문자 조건은 참여자가 신청할 때 확인한 값만 보여줍니다. */}
            <p>
              신청 당시 일평균 방문자:{' '}
              {metricValueLabel(evaluation.currentMetricValue)}
              {evaluation.currentMetricValue != null && '명'}
            </p>
            <p className="business-info">
              참여자가 신청할 때 블로그 방문자 위젯에서 확인한 최근 4일
              평균(오늘 제외)입니다. 방문자 수는 이 조건이 있는 캠페인에서만
              공개됩니다.
            </p>
          </>
        ) : (
          <>
            {evaluation.applicationRequirementSnapshot && (
              <p>
                현재 비교 지표:{' '}
                {metricValueLabel(evaluation.currentMetricValue)} ·{' '}
                {metricVerificationLabel(evaluation.currentVerificationStatus)}
              </p>
            )}
            <p className="business-info">
              신청 당시 저장한 조건과 현재 지표를 비교한 결과입니다. 신청 당시의
              판정 또는 새로운 신청 가능 여부를 의미하지 않습니다.
            </p>
          </>
        )}
      </section>
      <section aria-label="해당 신청 답변">
        <h3>해당 신청 답변</h3>
        {applicationAnswers.length ? (
          <dl className="business-details">
            {applicationAnswers.map((answer, index) => (
              <div key={`${answer.questionId}-${index}`}>
                <dt>
                  {answer.labelSource === 'CURRENT_FORM_VERSION_MATCH' &&
                  answer.questionLabel
                    ? answer.questionLabel
                    : `질문 ${answer.questionId} (당시 질문명 확인 불가)`}
                </dt>
                <dd>{answer.value || '답변 없음'}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>추가 신청 답변이 없습니다.</p>
        )}
      </section>
      <section aria-label="이전 완료 캠페인">
        <h3>
          이전 완료 캠페인{' '}
          <span>{completedCountLabel(completedCampaignCount)}</span>
        </h3>
        <p>참여 완료와 운영자 최종 승인이 모두 확인된 이력입니다.</p>
        {!completedCampaigns.length ? (
          <p>
            {completedCampaignCount === 0
              ? '아직 완료한 캠페인이 없습니다.'
              : '표시 가능한 완료 이력이 없습니다.'}
          </p>
        ) : (
          <ul className="participant-history">
            {completedCampaigns.map((campaign, index) => (
              <li key={`${campaign.campaignId}-${index}`}>
                <h4>
                  {campaign.campaignTitle || `캠페인 #${campaign.campaignId}`}
                </h4>
                <p>
                  {campaign.category || '분류 미등록'} · 완료일{' '}
                  {workspaceTime(campaign.completedAt)}
                </p>
                {campaign.publicContentLinks?.length ? (
                  campaign.publicContentLinks.map((link, i) =>
                    myContentLink(link.contentUrl) ? (
                      <a
                        key={i}
                        className="business-link"
                        href={myContentLink(link.contentUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {channelLabel(link.channelType)} 콘텐츠 보기 ↗
                      </a>
                    ) : (
                      <p key={i}>열 수 없는 콘텐츠 주소입니다.</p>
                    ),
                  )
                ) : (
                  <p>공개된 콘텐츠 링크가 없습니다.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
