/**
 * 참여자 콘텐츠 제출 화면의 '제출 전 점검' 영역입니다.
 * 게시할 본문을 붙여 넣으면 캠페인 미션·제출 요구사항·주의사항과 협찬 표시 기준으로 빠진 항목을 알려 줍니다.
 * 점검 기준은 서버가 캠페인에서 읽으며, 본문과 결과는 저장하지 않습니다. 제출은 아래 제출 버튼으로 따로 합니다.
 * 서버 API: POST /api/campaign-contents/ai/applications/{applicationId}/precheck (신청 당사자, 하루 횟수 제한)
 */
import { useState } from 'react'
import { requestContentPrecheck } from '../../api/contentPrecheckApi'
import {
  PRECHECK_CONTENT_MAX,
  PRECHECK_STATUS,
  precheckError,
  precheckRequest,
  precheckView,
} from './contentPrecheckModel'

export default function ContentPrecheckPanel({
  applicationId,
  channelType,
  disabled = false,
}) {
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fieldId = `content-precheck-${applicationId}`

  const check = async () => {
    if (busy) return
    let request
    try {
      request = precheckRequest(content, channelType)
    } catch (problem) {
      setError(problem.message)
      return
    }
    setBusy(true)
    setError('')
    try {
      setResult(await requestContentPrecheck(applicationId, request))
    } catch (failure) {
      setResult(null)
      setError(precheckError(failure))
    } finally {
      setBusy(false)
    }
  }

  const view = result && precheckView(result)

  return (
    <fieldset
      className="my-campaign-content__precheck"
      disabled={disabled || busy}
    >
      <legend>제출 전 점검 (선택)</legend>
      <p>
        게시할 본문(영상은 설명·자막)을 붙여 넣으면 캠페인 미션·제출
        요구사항·협찬 표시를 지켰는지 확인해 드립니다. 본문은 저장되지 않으며,
        결과는 참고용입니다. 최종 확인은 업체와 운영자가 합니다.
      </p>
      <label htmlFor={fieldId}>
        게시할 본문
        <textarea
          id={fieldId}
          rows={6}
          maxLength={PRECHECK_CONTENT_MAX}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      <small>
        {content.length.toLocaleString()} /{' '}
        {PRECHECK_CONTENT_MAX.toLocaleString()}자
      </small>
      <div className="my-campaign-content__precheck-actions">
        <button type="button" onClick={check}>
          {busy ? '점검하고 있습니다' : '제출 전 점검하기'}
        </button>
        {busy && <span role="status">10초쯤 걸립니다.</span>}
      </div>
      {error && <p role="alert">{error}</p>}
      {view && (
        <div className="my-campaign-content__precheck-result" role="status">
          <p>
            <strong>{result.summary || '점검을 마쳤습니다.'}</strong>
            <br />
            보완 필요 {view.missing}개 · 직접 확인 {view.unclear}개 · 확인됨{' '}
            {view.met}개
          </p>
          <p>
            협찬 표시 문구:{' '}
            {result.disclosureFound
              ? '본문에서 찾았습니다.'
              : '찾지 못했습니다. 협찬받은 콘텐츠임을 본문 첫 부분에 표시해 주세요.'}
          </p>
          <ul>
            {view.items.map((item, index) => (
              <li
                key={index}
                className={`my-campaign-content__precheck-item is-${item.status.toLowerCase()}`}
              >
                <span>{PRECHECK_STATUS[item.status]}</span>
                <strong>{item.criterion}</strong>
                {item.comment && <p>{item.comment}</p>}
              </li>
            ))}
          </ul>
          <small>
            {result.live
              ? `오늘 ${result.remainingToday}번 더 점검할 수 있습니다.`
              : 'AI 설정이 없어 견본 결과를 보여 드렸습니다. 협찬 표시 확인은 실제 결과입니다.'}
          </small>
        </div>
      )}
    </fieldset>
  )
}
