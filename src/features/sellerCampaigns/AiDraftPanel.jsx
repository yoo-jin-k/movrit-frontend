/**
 * 캠페인 작성 화면의 'AI로 초안 만들기' 영역입니다.
 * 제목·종류·채널·카테고리·제공 내역과 업체가 적은 특징으로 설명·미션·제출 요구사항·주의사항 초안을 받아,
 * 비어 있는 칸에만 넣습니다. 초안은 저장되지 않으며 업체가 읽고 고친 뒤 캠페인과 함께 저장합니다.
 * 서버 API: POST /api/campaigns/ai/draft (승인된 업체·운영자, 하루 횟수 제한)
 *
 * 변경 이력: 고치기 전에는 완료 안내가 입력 칸 아래쪽에 나와 끝났는지 알아보기 어려웠습니다.
 * 고친 후에는 완료·실패 안내를 버튼 바로 옆에 보여 주고, 항상 있는 aria-live 영역으로 화면 낭독기에도 읽힙니다.
 */
import { useState } from 'react'
import { requestCampaignDraft } from '../../api/campaignDraftApi'
import {
  aiDraftError,
  aiDraftNotice,
  aiDraftRequest,
  applyAiDraft,
} from './aiDraftModel'

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
      setNotice('')
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
      setNotice(
        aiDraftNotice({
          filled,
          kept,
          live: draft.live,
          remainingToday: draft.remainingToday,
        }),
      )
    } catch (failure) {
      // 응답 형식 검사 실패는 한국어로 만든 오류라 그대로 보이고, 통신 실패는 상태별 안내로 바꿉니다.
      setError(
        failure.response
          ? aiDraftError(failure)
          : failure.message || aiDraftError(failure),
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
        {/* 진행·완료 안내는 버튼 옆 같은 자리에 둡니다. 영역을 늘 두어야 바뀐 문구가 화면 낭독기에 읽힙니다. */}
        <p className="seller-ai-draft__result" role="status" aria-live="polite">
          {busy ? '10~20초쯤 걸립니다.' : notice}
        </p>
        {error && (
          <p className="seller-ai-draft__result" role="alert">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  )
}
