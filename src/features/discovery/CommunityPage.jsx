/**
 * 커뮤니티 게시판 화면입니다(/community/:board, /community/:board/:postId).
 * - 글 목록·검색·분류·페이지는 서버에서 받습니다. 운영팀 안내 글(고정)은 목록 위에 함께 보여줍니다.
 * - 로그인한 회원은 MOVRIT 톡톡·우리 친구할까요? 게시판에 글을 쓰고, 댓글을 달 수 있습니다(소식·이벤트는 운영자만 작성).
 * - 내가 쓴 글·댓글은 고치거나 지울 수 있습니다. 쓰던 글은 이 기기에 임시저장되어 다시 열면 이어 쓸 수 있습니다.
 */
import ReportButton from '../participation/ReportButton'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DiscoveryLayout from './DiscoveryLayout'
import { COMMUNITY_POSTS } from './catalog'
import {
  BOARDS,
  CATEGORIES,
  MEMBER_BOARDS,
  isServerPostId,
  postDate,
  postFormError,
} from './communityModel'
import {
  addCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  readCommunityPost,
  readCommunityPosts,
  updateCommunityPost,
} from '../../api/communityApi'

// 운영팀 안내 글(고정)로 보여줄 기본 글입니다.
const PINNED_IDS = ['guide', 'welcome', 'photo', 'first']
const DRAFT_KEY = 'movrit-community-draft'
const loggedIn = () => Boolean(sessionStorage.getItem('accessToken'))
const errorText = (failure, fallback) =>
  failure?.response?.data?.detail || fallback

export default function CommunityPage() {
  const { board = 'free', postId } = useParams()
  const [params, setParams] = useSearchParams()
  const [notice, setNotice] = useState('')
  const [keyword, setKeyword] = useState(params.get('q') || '')
  const navigate = useNavigate()
  const editId = params.get('edit')
  const [draft, setDraft] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(DRAFT_KEY)) || {
          title: '',
          body: '',
          category: '일상',
        }
      )
    } catch {
      return { title: '', body: '', category: '일상' }
    }
  })
  const [list, setList] = useState({ loading: true, error: '', data: null })
  const [detail, setDetail] = useState({
    loading: false,
    error: '',
    data: null,
  })
  const [comment, setComment] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const loadedEdit = useRef(null)
  const selected = params.get('category') || '전체'
  const page = Math.max(0, Number(params.get('page')) || 0)
  const title = BOARDS.find(([key]) => key === board)?.[1] || '커뮤니티'
  const canWriteHere = MEMBER_BOARDS.includes(board)
  const pinned = COMMUNITY_POSTS.filter(
    (item) =>
      item.board === board &&
      PINNED_IDS.includes(item.id) &&
      (selected === '전체' || item.category === selected) &&
      item.title.includes(params.get('q') || ''),
  )
  const staticPost = COMMUNITY_POSTS.find(
    (item) => item.id === postId && item.board === board,
  )

  // 게시판 목록을 서버에서 받습니다(분류·검색어·페이지).
  useEffect(() => {
    if (postId) return undefined
    const controller = new AbortController()
    readCommunityPosts(
      { board, category: selected, q: params.get('q'), page },
      controller.signal,
    )
      .then((data) => setList({ loading: false, error: '', data }))
      .catch((failure) => {
        if (!controller.signal.aborted)
          setList({
            loading: false,
            error: errorText(failure, '게시글을 불러오지 못했습니다.'),
            data: null,
          })
      })
    return () => controller.abort()
  }, [board, selected, page, params, postId, reload])

  // 글 상세(서버 글)를 받습니다. 고치기 화면이면 기존 내용을 입력란에 채웁니다.
  useEffect(() => {
    const id = postId === 'write' ? editId : postId
    if (!isServerPostId(id)) return undefined
    const controller = new AbortController()
    readCommunityPost(id, controller.signal)
      .then((data) => {
        setDetail({ loading: false, error: '', data })
        // 고치기 화면은 처음 한 번만 기존 내용을 채웁니다(이미 고치던 내용을 덮지 않습니다).
        if (postId === 'write' && loadedEdit.current !== id) {
          loadedEdit.current = id
          setDraft({
            title: data.title,
            body: data.body,
            category: data.category,
          })
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setDetail({
            loading: false,
            error: errorText(failure, '게시글을 찾을 수 없습니다.'),
            data: null,
          })
      })
    return () => controller.abort()
  }, [postId, editId, reload])

  const saveDraft = (next) => {
    setDraft(next)
    if (editId) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
    } catch {
      // 임시저장을 못 해도 글쓰기는 계속할 수 있습니다.
    }
  }

  // 글 등록·수정: 입력을 확인하고 서버에 보낸 뒤 상세로 이동합니다. 등록하면 임시저장을 지웁니다.
  const submitPost = async (event) => {
    event.preventDefault()
    const problem = postFormError(draft)
    if (problem) {
      setFormError(problem)
      return
    }
    setBusy(true)
    setFormError('')
    try {
      const payload = {
        board,
        category: draft.category,
        title: draft.title.trim(),
        body: draft.body.trim(),
      }
      const saved = editId
        ? await updateCommunityPost(editId, payload)
        : await createCommunityPost(payload)
      if (!editId) {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {
          // 무시합니다.
        }
        setDraft({ title: '', body: '', category: '일상' })
      }
      navigate(`/community/${board}/${saved.id}`)
    } catch (failure) {
      setFormError(errorText(failure, '글을 저장하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const removePost = async () => {
    if (!detail.data || busy) return
    setBusy(true)
    try {
      await deleteCommunityPost(detail.data.id)
      setNotice('글을 지웠습니다.')
      navigate(`/community/${board}`)
    } catch (failure) {
      setNotice(errorText(failure, '글을 지우지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const submitComment = async (event) => {
    event.preventDefault()
    if (!comment.trim() || busy) return
    setBusy(true)
    try {
      await addCommunityComment(detail.data.id, comment.trim())
      setComment('')
      setReload((value) => value + 1)
    } catch (failure) {
      setNotice(errorText(failure, '댓글을 등록하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const removeComment = async (id) => {
    setBusy(true)
    try {
      await deleteCommunityComment(id)
      setReload((value) => value + 1)
    } catch (failure) {
      setNotice(errorText(failure, '댓글을 지우지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const setPage = (next) => {
    const query = new URLSearchParams(params)
    query.set('page', String(next))
    setParams(query)
  }
  return (
    <DiscoveryLayout notice={notice} onCloseNotice={() => setNotice('')}>
      <main className="discovery-width discovery-community">
        <div className="discovery-community__welcome">
          <div>
            <h1>커뮤니티</h1>
            <p>MOVRIT과 함께하는 이야기 💗</p>
            {!loggedIn() && <Link to="/login">로그인하고 함께해 보세요 →</Link>}
          </div>
          <div>
            <h2>FAQ Top 5</h2>
            <p>다른 사람들은 어떤 내용이 궁금할까요?</p>
            <div className="discovery-community__faq">
              {[
                '채널 연결',
                '캠페인 신청',
                '선정 기준',
                '콘텐츠 등록',
                '캠페인 일정',
              ].map((item) => (
                <Link to="/community/guide/guide" key={item}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <Link
            className="discovery-community__guide"
            to="/community/guide/guide"
          >
            처음 오셨나요?<strong>MOVRIT 사용설명서</strong>
            <span aria-hidden="true">📖</span>
          </Link>
        </div>
        {!postId && (
          <div className="discovery-community__highlights">
            {COMMUNITY_POSTS.filter((item) => PINNED_IDS.includes(item.id))
              .slice(0, 3)
              .map((item) => (
                <Link key={item.id} to={`/community/${item.board}/${item.id}`}>
                  <small>{item.category}</small>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <span>MOVRIT 운영팀 · 안내</span>
                </Link>
              ))}
          </div>
        )}
        <div className="discovery-community__layout">
          <aside className="discovery-community__sidebar">
            <h2>커뮤니티</h2>
            {BOARDS.map(([key, label]) => (
              <Link
                key={key}
                to={`/community/${key}`}
                aria-current={board === key ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
            <h2>고객센터</h2>
            <Link to="/support">1:1 문의</Link>
            <Link to="/notices">공지사항</Link>
            <Link to="/community/guide/guide">서비스 가이드</Link>
          </aside>
          <section className="discovery-community__posts">
            <h2>{title}</h2>
            {postId === 'write' ? (
              !loggedIn() ? (
                <div className="main-home__state">
                  글을 쓰려면 로그인해 주세요.
                  <Link to="/login">로그인하기</Link>
                </div>
              ) : !canWriteHere && !editId ? (
                <div className="main-home__state">
                  이 게시판은 운영팀만 글을 쓸 수 있습니다.
                  <Link to="/community/free">MOVRIT 톡톡으로 가기</Link>
                </div>
              ) : (
                <form className="discovery-write" onSubmit={submitPost}>
                  {!editId && (
                    <p className="discovery-info">
                      쓰는 중인 글은 이 기기에 자동으로 임시저장됩니다.
                    </p>
                  )}
                  <label>
                    분류
                    <select
                      value={draft.category}
                      onChange={(event) =>
                        saveDraft({ ...draft, category: event.target.value })
                      }
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    제목
                    <input
                      required
                      maxLength={100}
                      value={draft.title}
                      onChange={(event) =>
                        saveDraft({ ...draft, title: event.target.value })
                      }
                      placeholder="제목을 입력해 주세요."
                    />
                  </label>
                  <label>
                    내용
                    <textarea
                      required
                      maxLength={5000}
                      value={draft.body}
                      onChange={(event) =>
                        saveDraft({ ...draft, body: event.target.value })
                      }
                      placeholder="서로를 존중하는 말로 경험과 정보를 나눠 주세요."
                    />
                  </label>
                  {formError && <p role="alert">{formError}</p>}
                  <div>
                    <Link
                      to={
                        editId
                          ? `/community/${board}/${editId}`
                          : `/community/${board}`
                      }
                      className="discovery-outline-button"
                    >
                      {editId ? '취소' : '목록으로'}
                    </Link>
                    <button
                      type="submit"
                      className="discovery-primary-button"
                      disabled={busy}
                    >
                      {busy ? '저장 중…' : editId ? '수정 완료' : '글 등록'}
                    </button>
                  </div>
                </form>
              )
            ) : postId ? (
              isServerPostId(postId) ? (
                detail.data && String(detail.data.id) === postId ? (
                  <article className="discovery-post">
                    <small>{detail.data.category}</small>
                    <h1>{detail.data.title}</h1>
                    <p className="discovery-muted">
                      {detail.data.authorName} ·{' '}
                      {postDate(detail.data.createdAt)} · 조회{' '}
                      {detail.data.viewCount}
                    </p>
                    <div className="discovery-post__body">
                      {detail.data.body}
                    </div>
                    {/* 다른 회원의 글은 신고할 수 있습니다(운영자가 확인 후 가리기·이용 정지 등 처리). */}
                    {loggedIn() && !detail.data.mine && (
                      <ReportButton
                        targetType="COMMUNITY_POST"
                        targetId={detail.data.id}
                      />
                    )}
                    {(detail.data.mine || detail.data.deletable) && (
                      <div className="discovery-post__actions">
                        {detail.data.mine && (
                          <Link
                            className="discovery-outline-button"
                            to={`/community/${board}/write?edit=${detail.data.id}`}
                          >
                            고치기
                          </Link>
                        )}
                        <button
                          type="button"
                          className="discovery-outline-button"
                          onClick={removePost}
                          disabled={busy}
                        >
                          지우기
                        </button>
                      </div>
                    )}
                    <section className="discovery-comments">
                      <h3>댓글 {detail.data.comments.length}</h3>
                      <ul>
                        {detail.data.comments.map((item) => (
                          <li key={item.id}>
                            <strong>{item.authorName}</strong>
                            <span>{postDate(item.createdAt)}</span>
                            <p>{item.body}</p>
                            {item.deletable && (
                              <button
                                type="button"
                                onClick={() => removeComment(item.id)}
                                disabled={busy}
                              >
                                지우기
                              </button>
                            )}
                            {loggedIn() && !item.deletable && (
                              <ReportButton
                                targetType="COMMUNITY_COMMENT"
                                targetId={item.id}
                                compact
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                      {loggedIn() ? (
                        <form onSubmit={submitComment}>
                          <label
                            className="chat-sr"
                            htmlFor="community-comment"
                          >
                            댓글 입력
                          </label>
                          <textarea
                            id="community-comment"
                            maxLength={1000}
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            placeholder="댓글을 남겨 주세요."
                          />
                          <button
                            type="submit"
                            className="discovery-dark-button"
                            disabled={busy || !comment.trim()}
                          >
                            댓글 등록
                          </button>
                        </form>
                      ) : (
                        <p>
                          <Link to="/login">로그인</Link>하면 댓글을 남길 수
                          있습니다.
                        </p>
                      )}
                    </section>
                    <Link
                      className="discovery-outline-button"
                      to={`/community/${board}`}
                    >
                      목록으로
                    </Link>
                  </article>
                ) : (
                  <div className="main-home__state">
                    {detail.error || '게시글을 불러오고 있습니다.'}
                    <Link to={`/community/${board}`}>목록으로 돌아가기</Link>
                  </div>
                )
              ) : staticPost ? (
                <article className="discovery-post">
                  <small>{staticPost.category}</small>
                  <h1>{staticPost.title}</h1>
                  <p className="discovery-muted">MOVRIT 운영팀 · 안내</p>
                  <div className="discovery-post__body">{staticPost.body}</div>
                  <Link
                    className="discovery-outline-button"
                    to={`/community/${board}`}
                  >
                    목록으로
                  </Link>
                </article>
              ) : (
                <div className="main-home__state">
                  게시글을 찾을 수 없습니다.
                  <Link to={`/community/${board}`}>목록으로 돌아가기</Link>
                </div>
              )
            ) : (
              <>
                <div className="discovery-community__filters">
                  <div>
                    {['전체', ...CATEGORIES].map((name) => (
                      <button
                        type="button"
                        key={name}
                        aria-pressed={selected === name}
                        onClick={() => {
                          const next = new URLSearchParams(params)
                          next.set('category', name)
                          next.delete('page')
                          setParams(next)
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  {canWriteHere && (
                    <Link
                      to={loggedIn() ? `/community/${board}/write` : '/login'}
                      className="discovery-dark-button"
                    >
                      글 등록
                    </Link>
                  )}
                </div>
                <form
                  className="discovery-community__search"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const next = new URLSearchParams(params)
                    next.set('q', keyword)
                    next.delete('page')
                    setParams(next)
                  }}
                >
                  <input
                    type="search"
                    aria-label="게시글 검색"
                    placeholder="게시글을 검색해주세요."
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                  <button type="submit">검색</button>
                </form>
                <div className="discovery-post-list">
                  {page === 0 &&
                    pinned.map((item) => (
                      <Link
                        to={`/community/${board}/${item.id}`}
                        key={item.id}
                        className="is-pinned"
                      >
                        <small>📌 {item.category}</small>
                        <h3>{item.title}</h3>
                        <p>{item.body}</p>
                        <span>MOVRIT 운영팀 · 안내</span>
                      </Link>
                    ))}
                  {list.loading ? (
                    <p className="main-home__state">
                      게시글을 불러오고 있습니다.
                    </p>
                  ) : list.error ? (
                    <p className="main-home__state" role="alert">
                      {list.error}
                    </p>
                  ) : list.data?.items.length ? (
                    list.data.items.map((item) => (
                      <Link to={`/community/${board}/${item.id}`} key={item.id}>
                        <small>{item.category}</small>
                        <h3>
                          {item.title}
                          {item.commentCount > 0 && (
                            <em className="discovery-post-list__count">
                              {' '}
                              [{item.commentCount}]
                            </em>
                          )}
                        </h3>
                        <p>{item.preview}</p>
                        <span>
                          {item.authorName} · {postDate(item.createdAt)} · 조회{' '}
                          {item.viewCount}
                        </span>
                      </Link>
                    ))
                  ) : (
                    !pinned.length && (
                      <p className="main-home__state">
                        {canWriteHere
                          ? '아직 글이 없습니다. 첫 글을 남겨 보세요.'
                          : '조건에 맞는 게시글이 없습니다.'}
                      </p>
                    )
                  )}
                </div>
                {list.data?.totalPages > 1 && (
                  <nav
                    className="discovery-pagination"
                    aria-label="게시글 페이지"
                  >
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                    >
                      ‹ 이전
                    </button>
                    <span>
                      {page + 1} / {list.data.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page + 1 >= list.data.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      다음 ›
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </DiscoveryLayout>
  )
}
