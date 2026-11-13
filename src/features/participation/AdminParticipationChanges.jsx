/**
 * 운영자 '패널티·마감 알림' 화면의 참여 조정 영역입니다.
 * - 협의 취소 요청: 참여자가 올린 증빙 이미지를 보고 승인(취소 횟수 없이 참여 취소)하거나 사유와 함께 반려합니다.
 * - 자동 처리: 30분마다 도는 '마감 지난 미제출 자동 취소'와 '업체 미선정 기록'을 바로 실행합니다(시연·점검용).
 * - 업체 미선정 기록: 신청자가 있었는데 선정 발표까지 아무도 선정하지 않은 캠페인 목록입니다.
 * - 기간 연장 요청: 전체 캠페인의 참여자 연장 요청(1~30일, 신청당 1회)을 보고 운영자가 대신 승인·반려합니다.
 *   업체·운영자 직접 연장은 참여자 상세에서 하고, 참여자별 연장 횟수는 회원 상세(참여자 이름 링크)에서 확인합니다.
 */
import { useEffect, useState } from 'react'
import { AdminCard } from '../../components/admin/AdminLayout'
import { Link } from 'react-router-dom'
import {
  decideCancelRequest,
  decideExtension,
  readAdminCancelRequests,
  readAdminExtensions,
  readAllUnselected,
  readCancelEvidence,
  runParticipationJobs,
} from '../../api/participationChangeApi'
import { dateLabel } from '../business/businessModel'
import { REQUEST_STATUS } from './participationChangeModel'

function useLoad(load, revision) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ loading: false, data, error: '' })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            data: null,
            error: '불러오지 못했습니다.',
          })
      })
    return () => controller.abort()
  }, [load, revision])
  return state
}

export default function AdminParticipationChanges() {
  const [revision, setRevision] = useState(0)
  const requests = useLoad(readAdminCancelRequests, revision)
  const unselected = useLoad(readAllUnselected, revision)
  const extensions = useLoad(readAdminExtensions, revision)
  const [rejectingId, setRejectingId] = useState(null)
  const [extensionNote, setExtensionNote] = useState('')
  const [openId, setOpenId] = useState(null)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // 다른 요청을 열거나 화면을 떠나면 내려받은 증빙 이미지 주소를 해제합니다.
  useEffect(
    () => () => {
      if (evidenceUrl) URL.revokeObjectURL(evidenceUrl)
    },
    [evidenceUrl],
  )

  const openRequest = async (item) => {
    setError('')
    setNote('')
    if (openId === item.id) {
      setOpenId(null)
      setEvidenceUrl('')
      return
    }
    setOpenId(item.id)
    setEvidenceUrl('')
    try {
      setEvidenceUrl(await readCancelEvidence(item.id))
    } catch {
      setError('증빙 이미지를 불러오지 못했습니다.')
    }
  }
  const decide = async (item, approve) => {
    if (busy) return
    if (!approve && !note.trim()) {
      setError('반려 사유를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await decideCancelRequest(item.id, approve, note)
      setNotice(
        approve
          ? `${item.participantNickname}님의 협의 취소를 승인했습니다.`
          : `${item.participantNickname}님의 협의 취소를 반려했습니다.`,
      )
      setOpenId(null)
      setEvidenceUrl('')
      setRevision((value) => value + 1)
    } catch (failure) {
      setError(failure.response?.data?.detail || '처리하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }
  // 참여자 연장 요청을 운영자가 승인(체험·마감 함께 연장)하거나 사유와 함께 반려합니다.
  const decideRequest = async (item, approve) => {
    if (busy) return
    if (!approve && !extensionNote.trim()) {
      setError('반려 사유를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await decideExtension(
        item.applicationId,
        approve,
        approve ? null : extensionNote,
      )
      setNotice(
        approve
          ? `${item.participantNickname}님의 체험·마감을 ${item.days}일 늘렸습니다.`
          : `${item.participantNickname}님에게 반려 사유를 보냈습니다.`,
      )
      setRejectingId(null)
      setExtensionNote('')
      setRevision((value) => value + 1)
    } catch (failure) {
      setError(failure.response?.data?.detail || '처리하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }
  const runJobs = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await runParticipationJobs()
      setNotice(
        `마감 지난 미제출 ${result.missedDeadlineCancelled}건을 취소하고, 업체 미선정 ${result.unselectedRecorded}건을 기록했습니다.`,
      )
      setRevision((value) => value + 1)
    } catch (failure) {
      setError(
        failure.response?.data?.detail || '자동 처리를 실행하지 못했습니다.',
      )
    } finally {
      setBusy(false)
    }
  }

  const list = requests.data || []
  const waiting = list.filter((item) => item.status === 'REQUESTED').length
  const extensionList = extensions.data || []
  const extensionWaiting = extensionList.filter(
    (item) => item.status === 'REQUESTED',
  ).length
  return (
    <>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      <AdminCard title="참여 자동 처리">
        <p>
          콘텐츠 마감(연장 포함)이 지나도록 제출하지 않은 참여는 자동으로
          취소하고 취소 횟수 1회를 남깁니다(연장·협의 취소 요청이 진행 중이면
          기다립니다). 선정 발표까지 아무도 선정하지 않은 캠페인은 업체
          미선정으로 기록합니다. 30분마다 자동으로 확인합니다.
        </p>
        <button className="admin-button" disabled={busy} onClick={runJobs}>
          자동 처리 지금 실행
        </button>
      </AdminCard>
      <AdminCard
        title={`협의 취소 요청 ${list.length}건${waiting ? ` · 대기 ${waiting}건` : ''}`}
      >
        {requests.loading ? (
          <p role="status">요청을 불러오고 있습니다.</p>
        ) : requests.error ? (
          <p role="alert">협의 취소 요청을 불러오지 못했습니다.</p>
        ) : list.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>참여자</th>
                <th>캠페인</th>
                <th>사유</th>
                <th>요청일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id}>
                  <td>{item.participantNickname}</td>
                  <td>
                    {item.campaignTitle}
                    <br />
                    <small>{item.brandName}</small>
                  </td>
                  <td>
                    {item.reason}
                    {openId === item.id && (
                      <div className="admin-cancel-evidence">
                        {evidenceUrl ? (
                          <img src={evidenceUrl} alt="협의 취소 증빙 이미지" />
                        ) : (
                          !error && (
                            <span>증빙 이미지를 불러오고 있습니다.</span>
                          )
                        )}
                        {item.status === 'REQUESTED' && (
                          <span className="admin-inline-form">
                            <input
                              aria-label="처리 메모"
                              maxLength={500}
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="반려할 때는 사유를 적어 주세요"
                            />
                            <button
                              className="admin-button"
                              disabled={busy}
                              onClick={() => decide(item, true)}
                            >
                              승인
                            </button>
                            <button
                              className="admin-button admin-button--danger"
                              disabled={busy}
                              onClick={() => decide(item, false)}
                            >
                              반려
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>{dateLabel(item.createdAt)}</td>
                  <td>
                    <span title={item.decisionNote || undefined}>
                      {REQUEST_STATUS[item.status]}
                    </span>{' '}
                    <button
                      className="admin-button admin-button--secondary"
                      aria-expanded={openId === item.id}
                      onClick={() => openRequest(item)}
                    >
                      {openId === item.id ? '닫기' : '증빙 보기'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>협의 취소 요청이 없습니다.</p>
        )}
      </AdminCard>
      <AdminCard
        title={`기간 연장 요청 ${extensionList.length}건${extensionWaiting ? ` · 대기 ${extensionWaiting}건` : ''}`}
      >
        <p className="admin-muted">
          참여자 요청은 신청마다 한 번입니다. 업체·운영자 직접 연장은 참여자
          상세에서 하고, 참여자별 연장 횟수는 참여자 이름을 눌러 회원 상세에서
          확인합니다.
        </p>
        {extensions.loading ? (
          <p role="status">요청을 불러오고 있습니다.</p>
        ) : extensions.error ? (
          <p role="alert">기간 연장 요청을 불러오지 못했습니다.</p>
        ) : extensionList.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>참여자</th>
                <th>캠페인</th>
                <th>요청</th>
                <th>마감</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {extensionList.map((item) => (
                <tr key={item.applicationId}>
                  <td>
                    <Link to={`/admin/members/${item.participantMemberId}`}>
                      {item.participantNickname}
                    </Link>
                  </td>
                  <td>
                    {item.campaignTitle}
                    <br />
                    <small>{item.brandName}</small>
                  </td>
                  <td>
                    {item.days}일 · {item.reason}
                    {rejectingId === item.applicationId && (
                      <span className="admin-inline-form">
                        <input
                          aria-label="연장 반려 사유"
                          maxLength={500}
                          value={extensionNote}
                          onChange={(e) => setExtensionNote(e.target.value)}
                          placeholder="반려 사유"
                        />
                        <button
                          className="admin-button admin-button--danger"
                          disabled={busy}
                          onClick={() => decideRequest(item, false)}
                        >
                          반려 보내기
                        </button>
                      </span>
                    )}
                  </td>
                  <td>
                    {dateLabel(item.previousDeadline)} →{' '}
                    {dateLabel(item.extendedDeadline)}
                  </td>
                  <td>
                    <span title={item.decisionNote || undefined}>
                      {REQUEST_STATUS[item.status]}
                    </span>
                    {item.status === 'REQUESTED' && (
                      <>
                        {' '}
                        <button
                          className="admin-button"
                          disabled={busy}
                          onClick={() => decideRequest(item, true)}
                        >
                          승인
                        </button>{' '}
                        <button
                          className="admin-button admin-button--secondary"
                          disabled={busy}
                          aria-expanded={rejectingId === item.applicationId}
                          onClick={() => {
                            setRejectingId(
                              rejectingId === item.applicationId
                                ? null
                                : item.applicationId,
                            )
                            setExtensionNote('')
                            setError('')
                          }}
                        >
                          {rejectingId === item.applicationId ? '닫기' : '반려'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>기간 연장 요청이 없습니다.</p>
        )}
      </AdminCard>
      <AdminCard title={`업체 미선정 기록 ${unselected.data?.count ?? 0}건`}>
        {unselected.loading ? (
          <p role="status">기록을 불러오고 있습니다.</p>
        ) : unselected.error ? (
          <p role="alert">업체 미선정 기록을 불러오지 못했습니다.</p>
        ) : unselected.data.records.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>업체</th>
                <th>캠페인</th>
                <th>신청 수</th>
                <th>기록일</th>
              </tr>
            </thead>
            <tbody>
              {unselected.data.records.map((record) => (
                <tr key={record.campaignId}>
                  <td>{record.brandName}</td>
                  <td>{record.campaignTitle}</td>
                  <td>{record.applicationCount}</td>
                  <td>{dateLabel(record.recordedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>업체 미선정 기록이 없습니다.</p>
        )}
      </AdminCard>
    </>
  )
}
