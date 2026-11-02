/**
 * 운영자 '커뮤니티 관리' 화면입니다(/admin/community).
 *
 * 신고가 들어오지 않아도 운영자가 커뮤니티 글·댓글을 직접 살펴보고 바로 가리거나 다시 보이게 합니다.
 * - 목록: 게시판·상태(보이는 글·가린 글·지운 글)·검색어로 거르고 20개씩 봅니다. 가린 댓글 수도 함께 보입니다.
 * - 상세: 가린 댓글·지운 댓글도 원문 그대로 보여 판단할 수 있게 합니다.
 * - 가리기·다시 보이기: 메모는 작성자 알림과 운영 기록에 남습니다. 지운 글·댓글은 바꿀 수 없습니다.
 * - 회원 화면에서 가린 글은 목록·상세에서 빠지고, 가린 댓글은 자리만 남아 안내 문구로 보입니다.
 * - 서버 API: GET /api/admin/community/posts, GET …/posts/{id}, PATCH …/posts/{id}/visibility, PATCH …/comments/{id}/visibility
 */
import { useEffect, useState } from 'react'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
import { dateLabel } from '../features/business/businessModel'
import {
  listAdminCommunityPosts,
  readAdminCommunityPost,
  setCommentHidden,
  setPostHidden,
} from '../api/adminCommunityApi'
import {
  COMMUNITY_BOARDS,
  COMMUNITY_STATUSES,
  VISIBILITY_LABELS,
  boardLabel,
  postMeta,
  visibilityAction,
  visibilityError,
} from '../features/admin/communityAdminModel'
import '../features/participation/participation.css'
import '../features/admin/communityAdmin.css'

const EMPTY_PAGE = { items: [], page: 0, totalPages: 0, total: 0 }

function StatusBadge({ status }) {
  return (
    <span className={`community-admin-badge is-${status.toLowerCase()}`}>
      {VISIBILITY_LABELS[status] || status}
    </span>
  )
}

export default function AdminCommunityPage() {
  const [filters, setFilters] = useState({
    board: '',
    status: 'ALL',
    q: '',
    page: 0,
  })
  const [keyword, setKeyword] = useState('')
  const [revision, setRevision] = useState(0)
  const [list, setList] = useState({ key: '', data: EMPTY_PAGE, error: '' })
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 목록: 조건이나 새로고침 번호가 바뀌면 다시 불러오고, 이전 요청은 취소합니다.
  const listKey = JSON.stringify([filters, revision])
  useEffect(() => {
    const controller = new AbortController()
    listAdminCommunityPosts(filters, controller.signal)
      .then((data) => setList({ key: listKey, data, error: '' }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setList({
          key: listKey,
          data: EMPTY_PAGE,
          error:
            error.response?.status === 403
              ? '운영자만 볼 수 있습니다.'
              : '글 목록을 불러오지 못했습니다.',
        })
      })
    return () => controller.abort()
  }, [filters, listKey])
  const loading = list.key !== listKey

  // 상세: 고른 글이 바뀌면 불러옵니다(가리기 결과는 응답으로 바로 바꿉니다).
  useEffect(() => {
    if (!selectedId) return undefined
    const controller = new AbortController()
    readAdminCommunityPost(selectedId, controller.signal)
      .then(setDetail)
      .catch((error) => {
        if (controller.signal.aborted) return
        setDetail(null)
        setMessage({ type: 'error', text: visibilityError(error) })
      })
    return () => controller.abort()
  }, [selectedId])
  const shown = detail && detail.post.id === selectedId ? detail : null

  const update = (patch) =>
    setFilters((current) => ({ ...current, page: 0, ...patch }))

  const change = async (kind, id, hidden) => {
    if (busy) return
    setBusy(true)
    setMessage({ type: '', text: '' })
    try {
      const next =
        kind === 'post'
          ? await setPostHidden(id, hidden, note)
          : await setCommentHidden(id, hidden, note)
      setDetail(next)
      setNote('')
      setMessage({
        type: 'status',
        text: `${kind === 'post' ? '글' : '댓글'}을 ${hidden ? '가렸습니다' : '다시 보이게 했습니다'}. 작성자에게 알림을 보냈습니다.`,
      })
      setRevision((value) => value + 1)
    } catch (error) {
      setMessage({ type: 'error', text: visibilityError(error) })
    } finally {
      setBusy(false)
    }
  }

  const { items, page, totalPages, total } = list.data
  const postAction = shown && visibilityAction(shown.post.status)

  return (
    <AdminLayout title="커뮤니티 관리">
      <p>
        신고가 없어도 커뮤니티 글·댓글을 살펴보고 바로 가리거나 다시 보이게
        합니다. 가린 내용은 회원에게 보이지 않고, 작성자에게 알림이 갑니다.
      </p>
      <form
        className="admin-filters"
        onSubmit={(event) => {
          event.preventDefault()
          update({ q: keyword })
        }}
      >
        <select
          aria-label="게시판"
          value={filters.board}
          onChange={(e) => update({ board: e.target.value })}
        >
          {COMMUNITY_BOARDS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="공개 상태"
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
        >
          {COMMUNITY_STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          aria-label="검색어"
          placeholder="제목·내용·작성자 닉네임"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="admin-button" type="submit">
          검색
        </button>
        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={() => setRevision((value) => value + 1)}
        >
          새로고침
        </button>
      </form>

      {message.text && (
        <p role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}

      <AdminCard title={`글 ${total}개`}>
        {loading ? (
          <p role="status">글 목록을 불러오고 있습니다.</p>
        ) : list.error ? (
          <p role="alert">{list.error}</p>
        ) : items.length ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>게시판</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>상태</th>
                  <th>작성일</th>
                  <th>보기</th>
                </tr>
              </thead>
              <tbody>
                {items.map((post) => (
                  <tr
                    key={post.id}
                    className={post.id === selectedId ? 'is-selected' : ''}
                  >
                    <td>#{post.id}</td>
                    <td>{boardLabel(post.board)}</td>
                    <td>
                      <strong>{post.title}</strong>
                      <small className="community-admin-meta">
                        {postMeta(post)}
                      </small>
                    </td>
                    <td>{post.authorName}</td>
                    <td>
                      <StatusBadge status={post.status} />
                    </td>
                    <td>{dateLabel(post.createdAt)}</td>
                    <td>
                      <button
                        className="admin-button admin-button--secondary"
                        aria-label={`글 ${post.id} 보기`}
                        onClick={() => {
                          setSelectedId(post.id)
                          setNote('')
                          setMessage({ type: '', text: '' })
                        }}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <nav className="community-admin-pages" aria-label="페이지">
                <button
                  className="admin-button admin-button--secondary"
                  disabled={page === 0}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: page - 1 }))
                  }
                >
                  이전
                </button>
                <span>
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="admin-button admin-button--secondary"
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: page + 1 }))
                  }
                >
                  다음
                </button>
              </nav>
            )}
          </>
        ) : (
          <p>조건에 맞는 글이 없습니다.</p>
        )}
      </AdminCard>

      {selectedId && !shown && (
        <AdminCard title={`글 #${selectedId}`}>
          <p role="status">글을 불러오고 있습니다.</p>
        </AdminCard>
      )}

      {shown && (
        <AdminCard
          title={`글 #${shown.post.id} · ${boardLabel(shown.post.board)}`}
        >
          <div className="community-admin-post">
            <header>
              <StatusBadge status={shown.post.status} />
              <h3>{shown.post.title}</h3>
              <small>
                {shown.post.authorName} · {dateLabel(shown.post.createdAt)} ·{' '}
                {postMeta(shown.post)}
              </small>
            </header>
            <p className="community-admin-body">{shown.body}</p>
          </div>

          <label className="admin-report-note">
            처리 메모 (작성자 알림과 운영 기록에 남습니다)
            <input
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예) 외부 오픈채팅으로 유도하는 광고라 가렸습니다."
            />
          </label>
          {postAction ? (
            <div className="admin-report-actions">
              <button
                className={`admin-button ${postAction.hidden ? '' : 'admin-button--secondary'}`}
                disabled={busy}
                onClick={() => change('post', shown.post.id, postAction.hidden)}
              >
                글 {postAction.label}
              </button>
            </div>
          ) : (
            <small>지운 글은 가리거나 다시 보이게 할 수 없습니다.</small>
          )}

          <h4 className="community-admin-subtitle">
            댓글 {shown.comments.length}개
          </h4>
          {shown.comments.length ? (
            <ul className="community-admin-comments">
              {shown.comments.map((comment) => {
                const action = visibilityAction(comment.status)
                return (
                  <li
                    key={comment.id}
                    className={`is-${comment.status.toLowerCase()}`}
                  >
                    <div>
                      <StatusBadge status={comment.status} />
                      <strong>{comment.authorName}</strong>
                      <small>{dateLabel(comment.createdAt)}</small>
                    </div>
                    <p>{comment.body}</p>
                    {action && (
                      <button
                        className={`admin-button ${action.hidden ? '' : 'admin-button--secondary'}`}
                        disabled={busy}
                        aria-label={`댓글 ${comment.id} ${action.label}`}
                        onClick={() =>
                          change('comment', comment.id, action.hidden)
                        }
                      >
                        {action.label}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p>댓글이 없습니다.</p>
          )}
        </AdminCard>
      )}
    </AdminLayout>
  )
}
