/**
 * 운영자 채널 확인 화면입니다(/admin/channel-verifications).
 *
 * 흐름: 회원이 설정에서 채널 '직접 등록'(주소·팔로워 수·프로필 캡처) → (이 화면) 운영자가 캡처와 실제 채널을 비교 → 확인 또는 반려
 * - 서버 API: GET /api/admin/channel-verifications, GET …/{id}/evidence, PATCH …/{id}/approve, PATCH …/{id}/reject
 * - 확인하면 회원의 팔로워 수가 '확인됨'이 되어 캠페인 참여 조건 판정에 쓰이고, 회원에게 알림이 갑니다.
 * - 반려하면 사유가 회원 설정 화면과 알림에 그대로 보입니다. 회원은 다시 등록할 수 있습니다.
 * - 로그인으로 연결한 채널은 SNS가 직접 확인한 값이라 이 화면에 나오지 않습니다.
 * - 소개글 코드 등록 중 자동으로 확인하지 못한 인스타그램 계정도 여기로 옵니다. 캡처 대신 인증 코드가 보이며, 채널 소개글에 그 코드가 있는지 봅니다.
 */
import { useEffect, useRef, useState } from 'react'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
import useBusinessList from '../features/business/useBusinessList'
import { dateLabel } from '../features/business/businessModel'
import {
  approveChannel,
  readChannelEvidence,
  rejectChannel,
} from '../api/channelConnectApi'
import {
  CONNECTION_METHODS,
  followerText,
} from '../features/membership/channelConnectModel'
import {
  CHANNEL_REVIEW_FILTERS,
  CHANNEL_REVIEW_STATUS,
  filterChannelReviews,
  rejectReasonError,
} from '../features/admin/channelVerificationModel'

// 선택한 등록의 캡처를 운영자 인증 요청으로 받아 임시 주소로 보여줍니다. 다른 항목을 고르면 이전 주소를 해제합니다.
function EvidenceImage({ id }) {
  const [state, setState] = useState({ id: null, url: '', error: false })
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''
    readChannelEvidence(id, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setState({ id, url: objectUrl, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ id, url: '', error: true })
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])
  if (state.id !== id) return <p role="status">캡처를 불러오고 있습니다.</p>
  if (state.error) return <p role="alert">캡처를 불러오지 못했습니다.</p>
  return (
    <img
      className="admin-channel-evidence"
      src={state.url}
      alt="회원이 올린 프로필 화면 캡처"
    />
  )
}

export default function AdminChannelVerificationsPage() {
  const state = useBusinessList('/admin/channel-verifications')
  const [filter, setFilter] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const detailRef = useRef(null)
  const shown = filterChannelReviews(state.data, filter, search)
  // 목록을 새로 불러와도 최신 행을 보여주도록 id로 다시 찾습니다.
  const selected =
    (state.data || []).find((item) => item.id === selectedId) || null

  useEffect(() => {
    if (selectedId) detailRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedId])

  const choose = (item) => {
    setSelectedId(item.id)
    setReason('')
    setError('')
  }

  // 확인 또는 반려를 보냅니다. 다른 화면에서 먼저 처리했다면(409) 최신 목록을 다시 불러옵니다.
  const decide = async (action) => {
    if (busy || !selected) return
    if (action === 'reject') {
      const problem = rejectReasonError(reason)
      if (problem) {
        setError(problem)
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      if (action === 'approve') await approveChannel(selected.id)
      else await rejectChannel(selected.id, reason.trim())
      setNotice(
        `${selected.memberNickname || '회원'}님의 ${selected.label} 채널을 ${
          action === 'approve' ? '확인했습니다' : '반려했습니다'
        }. 회원에게 알림을 보냈습니다.`,
      )
      setSelectedId(null)
      state.reload()
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '처리 결과를 확인하지 못했습니다. 최신 목록을 확인해 주세요.',
      )
      if (failure.response?.status === 409) state.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="채널 확인">
      <p>
        회원이 직접 등록한 SNS 채널을 확인합니다. 캡처의 아이디·팔로워 수가 실제
        채널과 같은지 비교한 뒤 확인하거나 반려해 주세요.
      </p>
      <div className="admin-filters">
        <input
          aria-label="회원 또는 계정 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="닉네임·이메일·계정 이름"
        />
        <select
          aria-label="확인 상태"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          {CHANNEL_REVIEW_FILTERS.map(([value, label]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="admin-button admin-button--secondary"
          disabled={busy || state.loading}
          onClick={state.reload}
        >
          새로고침
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {state.loading ? (
        <p role="status">채널 등록 목록을 확인하고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : !shown.length ? (
        <p>조건에 맞는 채널 등록이 없습니다.</p>
      ) : (
        <AdminCard title="직접 등록한 채널">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>회원</th>
                  <th>채널</th>
                  <th>계정</th>
                  <th>수치</th>
                  <th>상태</th>
                  <th>요청일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td data-label="회원">
                      {item.memberNickname || '닉네임 없음'}
                      <br />
                      <small>{item.memberEmail}</small>
                    </td>
                    <td data-label="채널">
                      {item.label}
                      <br />
                      <small>
                        {CONNECTION_METHODS[item.method] || '직접 등록'}
                      </small>
                    </td>
                    <td data-label="계정">{item.accountName}</td>
                    <td data-label="수치">
                      {followerText(item.provider, item.followerCount)}
                    </td>
                    <td data-label="상태">
                      {CHANNEL_REVIEW_STATUS[item.verificationStatus] ||
                        item.verificationStatus}
                    </td>
                    <td data-label="요청일">{dateLabel(item.requestedAt)}</td>
                    <td data-label="관리">
                      <button
                        className="admin-button admin-button--secondary"
                        disabled={busy}
                        onClick={() => choose(item)}
                      >
                        확인하기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
      {selected && (
        <div ref={detailRef}>
          <AdminCard
            title={`${selected.memberNickname || '회원'} · ${selected.label}`}
          >
            <p>
              <a
                href={selected.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selected.accountName} 채널 열기 ↗
              </a>{' '}
              · 입력한 수치:{' '}
              {followerText(selected.provider, selected.followerCount)}
            </p>
            {selected.method === 'BIO_CODE' ? (
              // 소개글 코드 등록: 채널을 열어 소개글에 이 코드가 있는지, 팔로워 수가 맞는지 확인합니다.
              <p className="admin-bio-code">
                소개글 인증 코드 <code>{selected.verificationCode}</code> — 채널
                소개글에 이 코드가 있고 팔로워 수가 맞는지 확인해 주세요.
              </p>
            ) : selected.hasEvidence ? (
              <EvidenceImage id={selected.id} />
            ) : (
              <p>첨부된 캡처가 없습니다.</p>
            )}
            {selected.verificationStatus === 'PENDING' ? (
              <div className="admin-review-form">
                <label>
                  반려 사유 (반려할 때만 필수, 회원에게 그대로 전달됩니다)
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    disabled={busy}
                    placeholder="예: 캡처의 아이디와 등록한 주소가 다릅니다."
                  />
                </label>
                <div className="admin-actions-row">
                  <button
                    className="admin-button"
                    disabled={busy}
                    onClick={() => decide('approve')}
                  >
                    {busy ? '처리 중...' : '확인'}
                  </button>
                  <button
                    className="admin-button admin-button--secondary"
                    disabled={busy}
                    onClick={() => decide('reject')}
                  >
                    반려
                  </button>
                </div>
              </div>
            ) : (
              <p>
                이미 처리된 등록입니다(
                {CHANNEL_REVIEW_STATUS[selected.verificationStatus]}
                {selected.reviewNote ? ` · 사유: ${selected.reviewNote}` : ''}
                ).
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            <button
              className="admin-button admin-button--secondary"
              disabled={busy}
              onClick={() => setSelectedId(null)}
            >
              상세 닫기
            </button>
          </AdminCard>
        </div>
      )}
    </AdminLayout>
  )
}
