/**
 * 캠페인 작성 화면의 'AI로 초안 만들기' 영역입니다.
 * 제목·종류·채널·카테고리·제공 내역과 업체가 적은 특징으로 설명·미션·제출 요구사항·주의사항 초안을 받아,
 * 비어 있는 칸에만 넣습니다. 초안은 저장되지 않으며 업체가 읽고 고친 뒤 캠페인과 함께 저장합니다.
 * 서버 API: POST /api/campaigns/ai/draft (승인된 업체·운영자, 하루 횟수 제한)
 */
import { useState } from 'react'
import { requestCampaignDraft } from '../../api/campaignDraftApi'
import { aiDraftRequest, applyAiDraft } from './aiDraftModel'

export default function AiDraftPanel({ value, onChange, disabled = false }) {
  const [highlights, setHighlights] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    if (busy) return
    let request
    try {
      request = aiDraftRequest(value, highlights)
    } catch (problem) {
      setError(problem.message)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const draft = await requestCampaignDraft(request)
      const { next, filled, kept } = applyAiDraft(value, draft)
      onChange(next)
      const parts = []
      parts.push(
        filled.length
          ? `${filled.join(', ')} 칸에 초안을 넣었습니다. 내용을 읽고 캠페인에 맞게 고쳐 주세요.`
          : '비어 있는 칸이 없어 초안을 넣지 않았습니다.',
      )
      if (kept.length)
        parts.push(`직접 적으신 ${kept.join(', ')} 칸은 그대로 두었습니다.`)
      if (!draft.live)
        parts.push('AI 키가 설정되지 않아 견본 초안을 넣었습니다.')
      else parts.push(`오늘 ${draft.remainingToday}번 더 만들 수 있습니다.`)
      setNotice(parts.join(' '))
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          failure.message ||
          'AI 초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset
      className="seller-campaign-fields seller-ai-draft"
      disabled={disabled || busy}
    >
      <legend>AI로 초안 만들기 (선택)</legend>
      <p>
        모집 제목과 종류·채널·카테고리·제공 내역을 먼저 고른 뒤 누르면 설명,
        미션, 제출 요구사항, 주의사항 초안을 비어 있는 칸에 채웁니다. 가격·효능
        같은 사실은 지어내지 않도록 되어 있으니, 빈칸으로 남은 부분은 직접 채워
        주세요.
      </p>
      <label htmlFor="ai-draft-highlights">
        제품·매장 특징 (선택)
        <textarea
          id="ai-draft-highlights"
          rows={3}
          maxLength={1000}
          placeholder="예) 민감 피부용 시카 앰플, 끈적임이 적고 아침저녁 사용, 30ml"
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
        />
      </label>
      <div className="seller-ai-draft__actions">
        <button type="button" onClick={generate}>
          {busy ? '초안을 쓰고 있습니다' : 'AI로 초안 만들기'}
        </button>
        {busy && <span role="status">10~20초쯤 걸립니다.</span>}
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  )
}
