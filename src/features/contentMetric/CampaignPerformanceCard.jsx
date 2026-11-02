/**
 * 업체 '콘텐츠' 화면의 캠페인 성과 요약입니다.
 * 캠페인을 고르면 참여자가 낸 게시물마다 가장 최근 성과를 모아 합계와 참여율을 보여 줍니다.
 * - 서버 API: GET /api/collaborations/campaigns/seller(캠페인 목록), GET /api/campaigns/{id}/content-performance
 */
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { readCampaignPerformance } from '../../api/contentMetricApi'
import { CONTENT_CHANNELS } from '../membership/myContentModel'
import { compactCount, engagementRate } from './contentMetricModel'
import './contentMetric.css'

export default function CampaignPerformanceCard() {
  const [campaigns, setCampaigns] = useState([])
  const [campaignId, setCampaignId] = useState('')
  const [result, setResult] = useState({ id: '', data: null, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/collaborations/campaigns/seller', {
        signal: controller.signal,
        timeout: 15000,
      })
      .then(({ data }) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!campaignId) return undefined
    const controller = new AbortController()
    readCampaignPerformance(campaignId, controller.signal)
      .then((data) => setResult({ id: campaignId, data, error: '' }))
      .catch(() => {
        if (controller.signal.aborted) return
        setResult({
          id: campaignId,
          data: null,
          error: '성과 요약을 불러오지 못했습니다.',
        })
      })
    return () => controller.abort()
  }, [campaignId])

  const loading = Boolean(campaignId) && result.id !== campaignId
  const data = result.id === campaignId ? result.data : null
  const totals = data && {
    viewCount: data.totalViews,
    likeCount: data.totalLikes,
    commentCount: data.totalComments,
  }

  return (
    <section className="business-panel content-metric-summary">
      <header>
        <h3>캠페인 콘텐츠 성과</h3>
        <select
          aria-label="성과를 볼 캠페인"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
        >
          <option value="">캠페인 선택</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.title}
            </option>
          ))}
        </select>
      </header>
      {!campaignId ? (
        <p className="content-metric__help">
          캠페인을 고르면 참여자 게시물의 최근 조회수·좋아요·댓글 합계를 볼 수
          있습니다.
        </p>
      ) : loading ? (
        <p role="status">성과 요약을 불러오고 있습니다.</p>
      ) : result.error ? (
        <p role="alert">{result.error}</p>
      ) : data.rows.length === 0 ? (
        <p>아직 제출된 콘텐츠가 없습니다.</p>
      ) : (
        <>
          <dl className="content-metric__numbers is-summary">
            <div>
              <dt>게시물</dt>
              <dd>
                {data.recordedLinkCount} / {data.linkCount}
              </dd>
              <small>성과 기록 / 전체</small>
            </div>
            <div>
              <dt>조회수 합계</dt>
              <dd title={data.totalViews.toLocaleString('ko-KR')}>
                {compactCount(data.totalViews)}
              </dd>
            </div>
            <div>
              <dt>좋아요 합계</dt>
              <dd>{compactCount(data.totalLikes)}</dd>
            </div>
            <div>
              <dt>댓글 합계</dt>
              <dd>{compactCount(data.totalComments)}</dd>
            </div>
            <div>
              <dt>평균 참여율</dt>
              <dd>{engagementRate(totals)}</dd>
            </div>
          </dl>
          <div className="business-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>참여자</th>
                  <th>채널</th>
                  <th>조회수</th>
                  <th>좋아요</th>
                  <th>댓글</th>
                  <th>기준일</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={`${row.submissionId}-${row.contentUrl}`}>
                    <td>{row.creatorNickname}</td>
                    <td>
                      <a
                        className="business-link"
                        href={row.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {CONTENT_CHANNELS[row.channelType] || '게시물'} ↗
                      </a>
                    </td>
                    <td>
                      {row.latest ? compactCount(row.latest.viewCount) : '-'}
                    </td>
                    <td>
                      {row.latest ? compactCount(row.latest.likeCount) : '-'}
                    </td>
                    <td>
                      {row.latest ? compactCount(row.latest.commentCount) : '-'}
                    </td>
                    <td>{row.latest?.measuredOn || '기록 없음'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
