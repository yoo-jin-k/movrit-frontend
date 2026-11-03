/**
 * '내 캠페인'의 참여 조정 영역입니다.
 * - 선정 발표 전: 신청 철회(취소 횟수 없음). 철회하면 같은 캠페인에 다시 신청할 수 없습니다.
 * - 선정·진행 중(콘텐츠 제출 전): 단순 참여 취소(취소 횟수 1회) 또는 업체와 협의한 취소(증빙 이미지, 운영자 확인 후 횟수 없음).
 * - 콘텐츠 마감 전: 기간 연장 7·14일 요청(신청당 1회, 업체가 승인하면 이 신청의 체험 기간과 콘텐츠 마감이 함께 늘어납니다).
 * 가능 여부는 서버 응답(GET /changes)을 그대로 따릅니다.
 */
import { useEffect, useState } from 'react'
import {
  readParticipationChanges,
  requestAgreedCancel,
  requestExtension,
  selfCancelApplication,
  withdrawApplication,
} from '../../api/participationChangeApi'
import { workspaceTime } from '../membership/campaignWorkspaceModel'
import {
  EXTENSION_DAYS,
  REQUEST_STATUS,
  cancelCountText,
  evidenceError,
  extensionError,
  reasonError,
} from './participationChangeModel'
import './participation.css'

const FORMS = {
  withdraw: '신청 철회',
  cancel: '참여 취소',
  agreed: '업체와 협의한 취소',
  extension: '기간 연장 요청',
}

export default function ParticipationChangePanel({ application, onChanged }) {
  const [status, setStatus] = useState(undefined)
  const [form, setForm] = useState('')
  const [reason, setReason] = useState('')
  const [days, setDays] = useState(7)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    readParticipationChanges(application.id, controller.signal)
      .then(setStatus)
      .catch(() => {
        if (!controller.signal.aborted) setStatus(null)
      })
    return () => controller.abort()
  }, [application.id])

  if (status === undefined) return null
  if (status === null)
    return (
      <p role="alert" className="participation-change__error">
        참여 조정 정보를 불러오지 못했습니다.
      </p>
    )

  const open = (name) => {
    setForm(form === name ? '' : name)
    setReason('')
    setFile(null)
    setError('')
    setNotice('')
  }
  const run = async (task, done, changesApplication) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      setStatus(await task())
      setNotice(done)
      setForm('')
      if (changesApplication) onChanged?.()
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }
  const submit = (event) => {
    event.preventDefault()
    const problem =
      form === 'withdraw'
        ? reasonError(reason, { required: false })
        : form === 'extension'
          ? extensionError(days, reason)
          : reasonError(reason) ||
            (form === 'agreed' ? evidenceError(file) : '')
    if (problem) {
      setError(problem)
      return
    }
    if (form === 'withdraw')
      run(
        () => withdrawApplication(application.id, reason),
        '신청을 철회했습니다.',
        true,
      )
    else if (form === 'cancel')
      run(
        () => selfCancelApplication(application.id, reason),
        '참여를 취소했습니다. 업체에 알렸습니다.',
        true,
      )
    else if (form === 'agreed')
      run(
        () => requestAgreedCancel(application.id, reason, file),
        '협의 취소를 요청했습니다. 운영자가 확인하면 알려 드립니다.',
      )
    else
      run(
        () => requestExtension(application.id, Number(days), reason),
        '기간 연장을 요청했습니다. 업체가 확인하면 알려 드립니다.',
      )
  }

  const cancelOpen = status.cancelRequest?.status === 'REQUESTED'
  const actions = [
    status.canWithdraw && 'withdraw',
    status.canCancel && !cancelOpen && 'cancel',
    status.canCancel && !cancelOpen && 'agreed',
    status.canRequestExtension && 'extension',
  ].filter(Boolean)
  const hasInfo =
    actions.length ||
    status.extension ||
    status.cancelRequest ||
    status.extendedUntil
  if (!hasInfo && !notice) return null

  return (
    <section
      className="participation-change campaign-workspace__section"
      aria-label="참여 조정"
    >
      <h2>참여 조정</h2>
      {status.extendedUntil && (
        <p className="participation-change__extended">
          {status.experienceExtendedUntil && (
            <>
              <strong>연장된 체험 기간</strong>{' '}
              {workspaceTime(status.experienceExtendedUntil)}까지
              <br />
            </>
          )}
          <strong>연장된 콘텐츠 마감</strong>{' '}
          {workspaceTime(status.extendedUntil)} 전까지 (한국 시간)
        </p>
      )}
      {status.extension && (
        <p>
          기간 연장 {status.extension.days}일 ·{' '}
          <span
            className={`participation-badge is-${status.extension.status.toLowerCase()}`}
          >
            {REQUEST_STATUS[status.extension.status]}
          </span>
          {status.extension.decisionNote && (
            <small> · {status.extension.decisionNote}</small>
          )}
        </p>
      )}
      {status.cancelRequest && (
        <p>
          협의 취소 요청 ·{' '}
          <span
            className={`participation-badge is-${status.cancelRequest.status.toLowerCase()}`}
          >
            {REQUEST_STATUS[status.cancelRequest.status]}
          </span>
          {status.cancelRequest.decisionNote && (
            <small> · {status.cancelRequest.decisionNote}</small>
          )}
        </p>
      )}
      {actions.length > 0 && (
        <div className="participation-change__actions">
          {actions.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={form === name}
              onClick={() => open(name)}
            >
              {FORMS[name]}
            </button>
          ))}
        </div>
      )}
      {form && (
        <form className="participation-change__form" onSubmit={submit}>
          <p className="participation-change__help">
            {form === 'withdraw' &&
              '선정 발표 전이라 취소 횟수는 남지 않습니다. 철회한 캠페인에는 다시 신청할 수 없습니다.'}
            {form === 'cancel' &&
              '취소 횟수 1회가 남고 업체에 알림이 갑니다. 업체와 미리 이야기했다면 ‘업체와 협의한 취소’를 이용해 주세요.'}
            {form === 'agreed' &&
              '업체와 취소를 합의한 대화 화면 등 이미지 1장을 올려 주세요. 운영자가 확인하고 승인하면 취소 횟수 없이 취소됩니다.'}
            {form === 'extension' &&
              '연장은 신청마다 한 번만 요청할 수 있고, 업체가 승인하면 이 신청의 체험 기간과 콘텐츠 마감이 함께 늘어납니다(다른 참여자 일정은 그대로).'}
          </p>
          {form === 'extension' && (
            <fieldset className="participation-change__days">
              <legend>연장 기간</legend>
              {EXTENSION_DAYS.map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="extension-days"
                    checked={Number(days) === value}
                    onChange={() => setDays(value)}
                  />{' '}
                  {value}일
                </label>
              ))}
            </fieldset>
          )}
          <label>
            {form === 'withdraw' ? '철회 사유 (선택)' : '사유'}
            <textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {form === 'agreed' && (
            <label>
              증빙 이미지 (JPG·PNG, 5MB 이하)
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
          <div className="participation-change__actions">
            <button type="submit" disabled={busy}>
              {busy ? '처리 중…' : `${FORMS[form]} 보내기`}
            </button>
            <button type="button" disabled={busy} onClick={() => open('')}>
              돌아가기
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <small className="participation-change__count">
        {cancelCountText(status.cancelCount, status.cancelLimit)}
      </small>
    </section>
  )
}
