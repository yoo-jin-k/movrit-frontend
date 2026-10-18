/**
 * 서버 신청 상태에 따라 참여 수락·체험 확인·최초 제출·재제출 동작을 구분합니다.
 * 진행 중 요청을 ref로 중복 방지하고 성공 또는 불명확한 결과 뒤에는 최신 내역 조회를 요구합니다.
 */
import { useRef, useState } from 'react'
import {
  submitMyCampaignContent,
  updateMyParticipation,
} from '../../api/myCampaignContentApi'
import {
  contentSubmissionAllowed,
  myParticipationAction,
  MY_CONTENT_STATUS,
  myContentLink,
  myContentPayload,
} from './myContentModel'
import './myCampaignContent.css'

// 서버 상태와 최신 version을 함께 사용합니다. 저장 결과가 불명확하면 자동 재전송하지 않습니다.
export default function MyContentSubmission({
  application,
  submission,
  available,
  onReload,
}) {
  const [url, setUrl] = useState(submission?.contentUrl || '')
  const [note, setNote] = useState(submission?.note || '')
  const [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [confirmAction, setConfirmAction] = useState(false)
  const inFlight = useRef(false)
  const participationAction = myParticipationAction(application)
  const canSubmit =
    available && contentSubmissionAllowed(application, submission)
  // 최초 제출과 재제출을 같은 서버 경로로 보내되 payload의 expectedVersion으로 구분합니다.
  // 진행 중 ref와 상태를 함께 검사해 연속 입력으로 같은 요청이 겹치지 않도록 합니다.
  const submit = async (event) => {
    event.preventDefault()
    if (inFlight.current || locked || !canSubmit) return
    let payload
    try {
      payload = myContentPayload(application, submission, url, note)
    } catch (failure) {
      setError(failure.message)
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await submitMyCampaignContent(application.id, payload)
      setLocked(true)
      setNotice(
        '콘텐츠를 제출했습니다. 최신 내역 확인에서 반영된 상태를 확인해 주세요.',
      )
    } catch (failure) {
      setLocked(true)
      setError(
        failure.response?.status === 409
          ? '콘텐츠 또는 참여 상태가 변경되었습니다. 최신 내역을 확인한 후 다시 제출해 주세요.'
          : failure.response?.status === 403 || failure.response?.status === 404
            ? '이 신청에 콘텐츠를 제출할 수 없습니다. 권한과 최신 상태를 확인해 주세요.'
            : '제출 결과를 확인하지 못했습니다. 중복 제출을 방지하기 위해 최신 내역에서 반영 여부를 먼저 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  // 참여 수락과 체험 확인은 화면의 확인 단계 후 실행합니다.
  // 응답 후 로컬에서 다음 업무 상태를 추측하지 않고 최신 내역을 다시 확인하도록 합니다.
  const confirmParticipation = async () => {
    if (!participationAction || !confirmAction || inFlight.current || locked)
      return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await updateMyParticipation(application.id, participationAction)
      setLocked(true)
      setNotice(
        participationAction === 'activate'
          ? '참여 수락이 반영되었습니다. 최신 내역을 확인해 주세요.'
          : '체험 완료 확인이 반영되었습니다. 최신 내역에서 콘텐츠 제출을 진행해 주세요.',
      )
    } catch (failure) {
      setLocked(true)
      setError(
        failure.response?.status === 409
          ? '참여 상태가 변경되었습니다. 최신 내역을 확인해 주세요.'
          : '처리 결과를 확인하지 못했습니다. 다시 실행하기 전에 최신 내역을 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <section
      className="my-campaign-content"
      aria-label={`신청 ${application.id} 콘텐츠`}
    >
      <h3>콘텐츠 제출·검토</h3>
      {participationAction && (
        <div className="my-campaign-content__review">
          <p>
            {participationAction === 'activate'
              ? '선정되었습니다. 참여 여부를 직접 확인해 주세요.'
              : '배송 상품을 실제 수령했거나 방문 체험을 완료한 후 확인해 주세요.'}
          </p>
          <button
            type="button"
            disabled={busy || locked}
            onClick={() => setConfirmAction(true)}
          >
            {participationAction === 'activate'
              ? '참여 수락'
              : '체험 완료 확인'}
          </button>
          {confirmAction && (
            <div>
              <p>
                {participationAction === 'activate'
                  ? '이 캠페인에 참여하시겠습니까?'
                  : '실제 수령 또는 방문 체험을 완료하셨습니까?'}
              </p>
              <button
                type="button"
                disabled={busy || locked}
                onClick={confirmParticipation}
              >
                {busy ? '처리 중...' : '확인하여 반영'}
              </button>
              <button
                type="button"
                disabled={busy || locked}
                onClick={() => setConfirmAction(false)}
              >
                돌아가기
              </button>
            </div>
          )}
        </div>
      )}
      {!available ? (
        <p role="alert">
          콘텐츠 상태를 불러오지 못했습니다. 조회가 완료되기 전에는 제출할 수
          없습니다.
        </p>
      ) : submission ? (
        <>
          <p className="my-campaign-content__status">
            {MY_CONTENT_STATUS[submission.status] || '콘텐츠 상태 확인 필요'} ·
            버전 {submission.version ?? '미확인'}
          </p>
          <p>
            {myContentLink(submission.contentUrl) ? (
              <a
                href={myContentLink(submission.contentUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                현재 제출한 콘텐츠 열기 ↗
              </a>
            ) : (
              '콘텐츠 링크를 확인해 주세요.'
            )}
          </p>
          {submission.note && <p>제출 메모: {submission.note}</p>}
          {submission.reviewComment && (
            <div className="my-campaign-content__review">
              <strong>
                {submission.status === 'REVISION_REQUESTED'
                  ? '수정 요청 의견'
                  : '최근 검토 의견'}
              </strong>
              <p>{submission.reviewComment}</p>
            </div>
          )}
        </>
      ) : (
        <p>아직 제출한 콘텐츠가 없습니다.</p>
      )}
      {canSubmit && (
        <form onSubmit={submit}>
          <label>
            콘텐츠 URL
            <input
              type="url"
              required
              maxLength={1000}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
              disabled={busy || locked}
            />
          </label>
          <label>
            제출 메모 (선택)
            <textarea
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy || locked}
            />
          </label>
          <p>
            등록한 게시물의 공개 URL을 입력해 주세요. 업체 검토와 운영자 최종
            승인은 별도 단계입니다.
          </p>
          <button type="submit" disabled={busy || locked}>
            {busy
              ? '제출 중...'
              : submission
                ? '수정한 콘텐츠 재제출'
                : '콘텐츠 제출'}
          </button>
        </form>
      )}
      {available && !canSubmit && !submission && (
        <p>
          {application.status === 'ACTIVE' && !application.experienceConfirmedAt
            ? '체험 완료 확인 후 콘텐츠를 제출하실 수 있습니다.'
            : '참여 진행 상태에 따라 콘텐츠 제출이 열립니다.'}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <button type="button" disabled={busy} onClick={onReload}>
        최신 내역 확인
      </button>
      {locked && (
        <small>
          재조회하면 현재 작성값 대신 서버에 저장된 최신 내용을 표시합니다.
        </small>
      )}
    </section>
  )
}
