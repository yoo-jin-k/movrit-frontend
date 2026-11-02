/**
 * 운영자 '패널티·마감 알림' 화면입니다(/admin/participation).
 * - 업체가 기록한 미제출·노쇼 패널티를 보고, 잘못 기록된 패널티는 사유와 함께 취소합니다(등급·신청 제한 계산에서 빠짐).
 * - 콘텐츠 마감 알림(D-3·D-1)은 30분마다 자동으로 보내며, 시연·점검 때는 '지금 확인'으로 바로 보낼 수 있습니다.
 * - 서버 API: GET /api/admin/penalties, PATCH /api/admin/penalties/{id}/revoke, POST /api/admin/deadline-reminders/run
 */
import { useState } from 'react'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
import useBusinessList from '../features/business/useBusinessList'
import { dateLabel } from '../features/business/businessModel'
import { revokePenalty, runDeadlineReminders } from '../api/participationApi'
import { PENALTY_LABELS } from '../features/participation/participationModel'
import '../features/participation/participation.css'

export default function AdminParticipationPage() {
  const state = useBusinessList('/admin/penalties')
  const [revokingId, setRevokingId] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const revoke = async (penalty) => {
    if (busy) return
    if (!reason.trim()) {
      setError('취소 사유를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await revokePenalty(penalty.id, reason.trim())
      setNotice(`${penalty.memberNickname}님의 패널티를 취소하고 알렸습니다.`)
      setRevokingId(null)
      setReason('')
      state.reload()
    } catch (failure) {
      setError(
        failure.response?.data?.detail || '패널티를 취소하지 못했습니다.',
      )
    } finally {
      setBusy(false)
    }
  }

  const runReminders = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await runDeadlineReminders()
      setNotice(`마감 알림 ${result.sent}건을 보냈습니다.`)
    } catch (failure) {
      setError(
        failure.response?.data?.detail || '마감 알림을 보내지 못했습니다.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="패널티·마감 알림">
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      <AdminCard title="콘텐츠 마감 알림">
        <p>
          진행 중인 참여자에게 콘텐츠 제출 마감 3일 전(D-3)과 1일 전(D-1)에
          알림을 보냅니다. 30분마다 자동으로 확인하며, 같은 알림은 한 번만
          보냅니다.
        </p>
        <button className="admin-button" disabled={busy} onClick={runReminders}>
          지금 확인해 보내기
        </button>
      </AdminCard>
      <AdminCard title={`패널티 기록 ${state.data?.length ?? 0}건`}>
        <p>
          최근 90일 동안 유효한 패널티가 2회 쌓이면 마지막 패널티일로부터 30일
          동안 새 캠페인에 신청할 수 없습니다.
        </p>
        {state.loading ? (
          <p role="status">패널티를 불러오고 있습니다.</p>
        ) : state.error ? (
          <p role="alert">패널티를 불러오지 못했습니다.</p>
        ) : state.data.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>회원</th>
                <th>종류</th>
                <th>캠페인</th>
                <th>사유</th>
                <th>기록일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((item) => (
                <tr key={item.id}>
                  <td>{item.memberNickname}</td>
                  <td>{PENALTY_LABELS[item.type]}</td>
                  <td>{item.campaignTitle}</td>
                  <td>{item.reason}</td>
                  <td>{dateLabel(item.createdAt)}</td>
                  <td>
                    {item.active ? (
                      revokingId === item.id ? (
                        <span className="admin-inline-form">
                          <input
                            aria-label="취소 사유"
                            maxLength={500}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="취소 사유"
                          />
                          <button
                            className="admin-button"
                            disabled={busy}
                            onClick={() => revoke(item)}
                          >
                            취소 확정
                          </button>
                        </span>
                      ) : (
                        <button
                          className="admin-button admin-button--secondary"
                          onClick={() => {
                            setRevokingId(item.id)
                            setReason('')
                          }}
                        >
                          패널티 취소
                        </button>
                      )
                    ) : (
                      <span title={item.revokeReason}>취소됨</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>기록된 패널티가 없습니다.</p>
        )}
      </AdminCard>
    </AdminLayout>
  )
}
