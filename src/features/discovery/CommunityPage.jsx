import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import DiscoveryLayout from './DiscoveryLayout'
import { COMMUNITY_POSTS } from './catalog'

const BOARDS = [
  ['guide', 'MOVRIT 소식'],
  ['free', 'MOVRIT 톡톡'],
  ['neighbor', '우리 친구할까요?'],
  ['event', '이벤트'],
]
export default function CommunityPage() {
  const { board = 'free', postId } = useParams()
  const [params, setParams] = useSearchParams()
  const [notice, setNotice] = useState('')
  const [keyword, setKeyword] = useState(params.get('q') || '')
  const [draft, setDraft] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('movrit-community-draft')) || {
          title: '',
          body: '',
          category: '일상',
        }
      )
    } catch {
      return { title: '', body: '', category: '일상' }
    }
  })
  const selected = params.get('category') || '전체'
  const title = BOARDS.find(([key]) => key === board)?.[1] || '커뮤니티'
  const post = COMMUNITY_POSTS.find((item) => item.id === postId && item.board === board)
  const entries = COMMUNITY_POSTS.filter(
    (item) =>
      item.board === board &&
      (selected === '전체' || item.category === selected) &&
      item.title.includes(params.get('q') || ''),
  )
  return (
    <DiscoveryLayout notice={notice} onCloseNotice={() => setNotice('')}>
      <main className="discovery-width discovery-community">
        <div className="discovery-community__welcome">
          <div>
            <h1>커뮤니티</h1>
            <p>MOVRIT과 함께하는 이야기 💗</p>
            <Link to="/login">로그인하고 함께해 보세요 →</Link>
          </div>
          <div>
            <h2>FAQ Top 5</h2>
            <p>다른 사람들은 어떤 내용이 궁금할까요?</p>
            <div className="discovery-community__faq">
              {['채널 연결', '캠페인 신청', '선정 기준', '콘텐츠 등록', '캠페인 일정'].map(
                (item) => (
                  <Link to="/community/guide/guide" key={item}>
                    {item}
                  </Link>
                ),
              )}
            </div>
          </div>
          <Link className="discovery-community__guide" to="/community/guide/guide">
            처음 오셨나요?<strong>MOVRIT 사용설명서</strong>
            <span aria-hidden="true">📖</span>
          </Link>
        </div>
        {!postId && (
          <div className="discovery-community__highlights">
            {COMMUNITY_POSTS.slice(0, 3).map((item) => (
              <Link key={item.id} to={`/community/${item.board}/${item.id}`}>
                <small>{item.category}</small>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span>MOVRIT · 안내</span>
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
              <form
                className="discovery-write"
                onSubmit={(event) => {
                  event.preventDefault()
                  try {
                    localStorage.setItem('movrit-community-draft', JSON.stringify(draft))
                    setNotice('이 기기에 임시저장했습니다. 게시판에는 등록되지 않았습니다.')
                  } catch {
                    setNotice('임시저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.')
                  }
                }}
              >
                <p className="discovery-info">
                  게시글 등록 기능을 준비 중입니다. 작성한 내용은 이 기기에 임시저장할 수 있습니다.
                </p>
                <label>
                  분류
                  <select
                    value={draft.category}
                    onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  >
                    {['일상', '체험단', '정보공유', '질문하기'].map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  제목
                  <input
                    required
                    minLength={3}
                    maxLength={100}
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    placeholder="제목을 입력해 주세요."
                  />
                </label>
                <label>
                  내용
                  <textarea
                    required
                    minLength={10}
                    value={draft.body}
                    onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                    placeholder="내용을 입력해 주세요."
                  />
                </label>
                <div>
                  <Link to={`/community/${board}`} className="discovery-outline-button">
                    목록으로
                  </Link>
                  <button type="submit" className="discovery-primary-button">
                    이 기기에 임시저장
                  </button>
                </div>
              </form>
            ) : postId ? (
              post ? (
                <article className="discovery-post">
                  <small>{post.category}</small>
                  <h1>{post.title}</h1>
                  <p className="discovery-muted">MOVRIT · 서비스 안내</p>
                  <div>{post.body}</div>
                  <section>
                    <h3>댓글</h3>
                    <p>댓글 기능을 준비 중입니다.</p>
                  </section>
                  <Link className="discovery-outline-button" to={`/community/${board}`}>
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
                    {['전체', '일상', '체험단', '정보공유', '질문하기'].map((name) => (
                      <button
                        type="button"
                        key={name}
                        aria-pressed={selected === name}
                        onClick={() => {
                          const next = new URLSearchParams(params)
                          next.set('category', name)
                          setParams(next)
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <Link to={`/community/${board}/write`} className="discovery-dark-button">
                    글 등록
                  </Link>
                </div>
                <form
                  className="discovery-community__search"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const next = new URLSearchParams(params)
                    next.set('q', keyword)
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
                  {entries.length ? (
                    entries.map((item) => (
                      <Link to={`/community/${board}/${item.id}`} key={item.id}>
                        <small>{item.category}</small>
                        <h3>{item.title}</h3>
                        <p>{item.body}</p>
                        <span>MOVRIT · 서비스 안내</span>
                      </Link>
                    ))
                  ) : (
                    <p className="main-home__state">조건에 맞는 게시글이 없습니다.</p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </DiscoveryLayout>
  )
}
