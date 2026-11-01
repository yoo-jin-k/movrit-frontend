/**
 * 캠페인 상세의 모집 현황입니다. 예) 신청 1 / 모집 2명 · 선정 1명
 *
 * - GET /api/collaborations/campaigns/{id}/recruitment 를 15초마다, 그리고 창으로 돌아올 때 다시 불러옵니다.
 * - 화면이 숨겨져 있으면 불러오지 않고, 실패하면 마지막으로 받은 값을 그대로 보여줍니다.
 * - 처음 불러오기 전에는 상세 응답의 모집 인원만 보여줍니다.
 */
import { useEffect, useState } from 'react'
import { readCampaignRecruitment } from '../../api/campaignReadApi'

const REFRESH_MS = 15000

export default function RecruitmentProgress({
  campaignId,
  recruitmentCount,
  open,
}) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    let controller = null
    const load = () => {
      if (document.visibilityState !== 'visible') return
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      readCampaignRecruitment(campaignId, signal)
        .then((data) => {
          if (!signal.aborted) setStatus(data)
        })
        .catch(() => {
          // 실패하면 마지막 값을 유지합니다.
        })
    }
    load()
    const timer = window.setInterval(load, REFRESH_MS)
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', load)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
      document.removeEventListener('visibilitychange', load)
      controller?.abort()
    }
  }, [campaignId])

  const capacity = status?.recruitmentCount ?? recruitmentCount
  const isOpen = status ? status.open : open
  const applied = status?.applicationCount
  const percent =
    capacity && applied != null
      ? Math.min(100, Math.round((applied / capacity) * 100))
      : 0
  return (
    <section className="recruitment-progress" aria-label="모집 현황">
      <p className="recruitment-progress__count">
        <strong>
          신청 {applied ?? '-'} / 모집 {capacity ?? '-'}명
        </strong>
        <span>{isOpen ? '모집 중' : '모집 종료'}</span>
      </p>
      <div className="recruitment-progress__bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      {status && (
        <p className="recruitment-progress__detail">
          선정 {status.selectedCount}명
          {capacity != null &&
            applied > capacity &&
            ` · 경쟁률 ${(applied / capacity).toFixed(1)} : 1`}
        </p>
      )}
    </section>
  )
}
