/**
 * 마이페이지 상단의 '나의 캠페인' 단계별 요약 카드입니다.
 * 본인 신청 목록(GET /campaigns/applications/mine)만 조회하며,
 * 조회 실패는 0건과 구분해 다시 시도 버튼으로 안내합니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { summarizeCampaignStages } from './campaignSummaryModel'

export default function MyCampaignSummary() {
  // stages가 null이면 아직 조회 전이거나 실패한 상태입니다. error로 두 경우를 구분합니다.
  const [state, setState] = useState({ stages: null, error: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/campaigns/applications/mine', {
        signal: controller.signal,
        timeout: 15000,
      })
      .then(({ data }) => {
        const stages = summarizeCampaignStages(data)
        if (!stages) throw new Error('신청 목록 형식을 확인할 수 없습니다.')
        setState({ stages, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ stages: null, error: true })
      })
    return () => controller.abort()
  }, [attempt])

  return (
    <section className="buyer-campaign-summary" aria-label="나의 캠페인 현황">
      <header>
        <h2>나의 캠페인</h2>
        <Link to="/mypage/campaigns">전체보기 ›</Link>
      </header>
      {state.error ? (
        <p role="alert">
          캠페인 현황을 불러오지 못했습니다.{' '}
          <button type="button" onClick={() => setAttempt((v) => v + 1)}>
            다시 시도
          </button>
        </p>
      ) : (
        <ol>
          {(state.stages || summarizeCampaignStages([])).map((stage) => (
            <li key={stage.key}>
              <Link
                to={
                  stage.status
                    ? `/mypage/campaigns?status=${stage.status}`
                    : '/mypage/campaigns'
                }
                aria-label={`${stage.label} ${state.stages ? `${stage.count}건` : '조회 중'}`}
              >
                <strong>{state.stages ? stage.count : '·'}</strong>
                <span>{stage.label}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
