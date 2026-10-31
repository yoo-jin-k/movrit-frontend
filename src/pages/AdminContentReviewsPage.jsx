/**
 * 운영자 콘텐츠 최종 승인 화면입니다(/admin/content-reviews).
 *
 * 흐름: 참여자 콘텐츠 제출 → 업체 검토 완료 → (이 화면) 운영자 최종 승인 → 신청 '완료'
 * - 서버 API: GET /api/admin/campaign-contents, PATCH …/{id}/approve, PATCH …/{id}/request-revision
 * - 최종 승인하면 참여자의 신청이 '완료'로 바뀌고 완료 알림이 갑니다.
 * - 수정 요청하면 참여자가 내용을 고쳐 다시 제출할 수 있습니다.
 * - 다른 화면에서 먼저 처리했으면(버전 불일치) 409로 막히고, 최신 목록을 다시 불러오도록 안내합니다.
 */
import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
import useBusinessList from '../features/business/useBusinessList'
import {
  dateLabel,
  safeContentUrl,
  statusNames,
} from '../features/business/businessModel'
import { CONTENT_CHANNELS } from '../features/membership/myContentModel'
import {
  REVIEW_FILTERS,
  canOperatorReview,
  filterSubmissions,
  reviewPayload,
} from '../features/admin/contentReviewModel'

export default function AdminContentReviewsPage() {
  const state = useBusinessList('/admin/campaign-contents')
  const [filter, setFilter] = useState(REVIEW_FILTERS[0][0])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [action, setAction] = useState('approve')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [locked, setLocked] = useState(false)
  const inFlight = useRef(false)
  const detailRef = useRef(null)
  const shown = filterSubmissions(state.data, filter, search)

  // 콘텐츠를 고르면 목록 아래의 확인 영역으로 화면을 옮깁니다.
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected])

  // 목록에서 콘텐츠를 고르면 처리 입력을 초기화합니다.
  const choose = (item) => {
    setSelected(item)
    setAction('approve')
    setComment('')
    setError('')
    setLocked(false)
  }
  // 처리 후나 충돌 후에는 상세를 닫고 최신 목록을 다시 불러옵니다.
  const reload = () => {
    setSelected(null)
    setLocked(false)
    state.reload()
  }
  // 최종 승인 또는 수정 요청을 서버에 보냅니다. 같은 요청이 두 번 가지 않도록 막습니다.
  const submit = async (event) => {
    event.preventDefault()
    if (inFlight.current || locked) return
    let payload
    try {
      payload = reviewPayload(action, selected, comment)
    } catch (failure) {
      setError(failure.message)
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await api.patch(
        `/admin/campaign-contents/${selected.id}/${action}`,
        payload,
        { timeout: 15000 },
      )
      setNotice(
        action === 'approve'
          ? `콘텐츠 #${selected.id}를 최종 승인했습니다. 참여자의 신청이 완료로 바뀌었습니다.`
          : `콘텐츠 #${selected.id}에 수정을 요청했습니다. 참여자가 다시 제출할 수 있습니다.`,
      )
      reload()
    } catch (failure) {
      setLocked(true)
      setError(
        failure.response?.status === 409
          ? '다른 화면에서 먼저 처리되었거나 상태가 바뀌었습니다. 최신 목록을 확인해 주세요.'
          : failure.response?.status === 403
            ? '운영자 권한을 확인해 주세요.'
            : '처리 결과를 확인하지 못했습니다. 최신 목록에서 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="콘텐츠 최종 승인">
      <p>
        업체 검토가 끝난 콘텐츠를 확인하고 최종 승인합니다. 최종 승인하면
        참여자의 캠페인이 완료됩니다.
      </p>
      <div className="admin-filters">
        <input
          aria-label="참여자 또는 캠페인 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="참여자·캠페인 이름 또는 번호"
        />
        <select
          aria-label="콘텐츠 상태"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          {REVIEW_FILTERS.map(([value, label]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="admin-button admin-button--secondary"
          disabled={busy || state.loading}
          onClick={reload}
        >
          새로고침
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {state.loading ? (
        <p role="status">콘텐츠 목록을 확인하고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : !shown.length ? (
        <p>조건에 맞는 콘텐츠가 없습니다.</p>
      ) : (
        <AdminCard title="제출 콘텐츠">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>콘텐츠</th>
                  <th>캠페인</th>
                  <th>참여자</th>
                  <th>상태</th>
                  <th>수정 횟수</th>
                  <th>제출일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td data-label="콘텐츠">#{item.id}</td>
                    <td data-label="캠페인">{item.campaignTitle}</td>
                    <td data-label="참여자">{item.creatorNickname}</td>
                    <td data-label="상태">
                      {statusNames[item.status] || item.status}
                    </td>
                    <td data-label="수정 횟수">{item.revisionCount ?? 0}회</td>
                    <td data-label="제출일">{dateLabel(item.submittedAt)}</td>
                    <td data-label="관리">
                      <button
                        className="admin-button admin-button--secondary"
                        disabled={busy}
                        onClick={() => choose(item)}
                      >
                        콘텐츠 확인
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
          <AdminCard title={`콘텐츠 #${selected.id} 확인`}>
            <p>
              {selected.campaignTitle} · {selected.creatorNickname} ·{' '}
              {statusNames[selected.status] || selected.status}
            </p>
            <h3>게시물 링크</h3>
            {(selected.links?.length
              ? selected.links
              : [{ channelType: null, contentUrl: selected.contentUrl }]
            ).map((link, index) => {
              const url = safeContentUrl(link.contentUrl)
              return (
                <p key={`${link.contentUrl}-${index}`}>
                  {CONTENT_CHANNELS[link.channelType] || '게시물'} ·{' '}
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      새 창에서 열기 ↗
                    </a>
                  ) : (
                    '열 수 있는 주소가 아닙니다.'
                  )}
                </p>
              )
            })}
            <h3>제출 메모</h3>
            <p>{selected.note || '제출 메모가 없습니다.'}</p>
            <h3>최근 검토 의견</h3>
            <p>{selected.reviewComment || '아직 검토 의견이 없습니다.'}</p>
            {selected.status === 'SUBMITTED' && (
              <p role="note">
                업체 검토 전 콘텐츠입니다. 필요하면 운영자가 바로 처리할 수
                있습니다.
              </p>
            )}
            {canOperatorReview(selected) ? (
              <form className="admin-review-form" onSubmit={submit}>
                <label>
                  처리 방법
                  <select
                    value={action}
                    onChange={(event) => {
                      // 처리 방법을 바꾸면 이전 안내 문구를 지웁니다.
                      setAction(event.target.value)
                      setError('')
                    }}
                    disabled={busy || locked}
                  >
                    <option value="approve">최종 승인</option>
                    <option value="request-revision">수정 요청</option>
                  </select>
                </label>
                <label>
                  의견 {action === 'request-revision' ? '(필수)' : '(선택)'}
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    disabled={busy || locked}
                  />
                </label>
                <button
                  className="admin-button"
                  type="submit"
                  disabled={busy || locked}
                >
                  {busy
                    ? '처리 중...'
                    : action === 'approve'
                      ? '최종 승인'
                      : '수정 요청 보내기'}
                </button>
              </form>
            ) : (
              <p>이미 처리가 끝난 콘텐츠입니다.</p>
            )}
            {error && <p role="alert">{error}</p>}
            {locked && (
              <button
                className="admin-button admin-button--secondary"
                disabled={busy}
                onClick={reload}
              >
                최신 목록 확인
              </button>
            )}
            <button
              className="admin-button admin-button--secondary"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              상세 닫기
            </button>
          </AdminCard>
        </div>
      )}
    </AdminLayout>
  )
}
