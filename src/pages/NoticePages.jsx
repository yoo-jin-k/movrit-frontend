/**
 * 공지사항 목록·상세 화면입니다(/notices, /notices/:noticeId).
 * - 운영자가 게시한 공지를 로그인 없이 봅니다(GET /api/notices, GET /api/notices/{id}).
 * - 커뮤니티(/community/*)와 같은 헤더·왼쪽 메뉴·목록·본문 모양을 씁니다(DiscoveryLayout, discovery-* 클래스).
 * - 고정 공지가 먼저 나오고(서버 정렬), 제목으로 바로 걸러 볼 수 있습니다.
 * 변경 이력: 공용 안내 화면 틀(CommonLayout·카드 목록)이라 커뮤니티와 모양이 다름
 *           → 커뮤니티와 같은 헤더·왼쪽 메뉴·글 목록·본문 모양으로 통일.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DiscoveryLayout from '../features/discovery/DiscoveryLayout'
import { BOARDS } from '../features/discovery/communityModel'
import useAdminResource from '../features/admin/useAdminResource'
import {
  NOTICE_CATEGORY_LABELS,
  dateOnly,
} from '../features/admin/adminConsoleModel'

// 커뮤니티 화면 왼쪽 메뉴와 같은 항목입니다. 공지사항을 현재 위치로 표시합니다.
function NoticeSidebar() {
  return (
    <aside className="discovery-community__sidebar">
      <h2>커뮤니티</h2>
      {BOARDS.map(([key, label]) => (
        <Link key={key} to={`/community/${key}`}>
          {label}
        </Link>
      ))}
      <h2>고객센터</h2>
      <Link to="/support">1:1 문의</Link>
      <Link to="/notices" aria-current="page">
        공지사항
      </Link>
      <Link to="/community/guide/guide">서비스 가이드</Link>
    </aside>
  )
}

function NoticeFrame({ children }) {
  return (
    <DiscoveryLayout>
      {/* UI점검: 공지화면이 디자인이 조금다름 통일시켜야함 (커뮤니티 위쪽 환영·FAQ 배너는 공지에 넣지 않음. 배너까지 맞출지 확인 필요) */}
      <main className="discovery-width discovery-community">
        <div className="discovery-community__layout notice-board">
          <NoticeSidebar />
          <section className="discovery-community__posts">{children}</section>
        </div>
      </main>
    </DiscoveryLayout>
  )
}

const categoryLabel = (notice) =>
  NOTICE_CATEGORY_LABELS[notice.category] || '공지'

export function NoticesPage() {
  const state = useAdminResource('/notices', [])
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const items = (state.data || []).filter((notice) =>
    String(notice.title || '')
      .toLowerCase()
      .includes(query),
  )
  return (
    <NoticeFrame>
      <h1 className="notice-board__title">공지사항</h1>
      {/* 입력하는 대로 제목을 걸러 보여 주므로 따로 검색 버튼을 두지 않습니다. */}
      <form
        className="discovery-community__search"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          type="search"
          aria-label="공지 제목 검색"
          placeholder="공지 제목을 검색해 주세요."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </form>
      <div className="discovery-post-list notice-board__list">
        {state.loading ? (
          <p className="main-home__state" role="status">
            공지를 불러오고 있습니다.
          </p>
        ) : state.error ? (
          <p className="main-home__state" role="alert">
            공지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : !items.length ? (
          <p className="main-home__state">
            {search ? '검색한 공지가 없습니다.' : '등록된 공지가 없습니다.'}
          </p>
        ) : (
          items.map((notice) => (
            <Link
              to={`/notices/${notice.id}`}
              key={notice.id}
              className={notice.pinned ? 'is-pinned' : undefined}
            >
              <small>
                {notice.pinned ? '📌 고정 · ' : ''}
                {categoryLabel(notice)}
              </small>
              <h3>{notice.title}</h3>
              <span>MOVRIT 운영팀 · {dateOnly(notice.publishedAt)}</span>
            </Link>
          ))
        )}
      </div>
    </NoticeFrame>
  )
}

export function NoticeDetailPage() {
  const { noticeId } = useParams()
  const state = useAdminResource(`/notices/${noticeId}`)
  const notice = state.data
  return (
    <NoticeFrame>
      <h2 className="notice-board__title">공지사항</h2>
      {state.loading ? (
        <p className="main-home__state" role="status">
          공지를 불러오고 있습니다.
        </p>
      ) : state.error || !notice ? (
        <div className="main-home__state" role="alert">
          공지를 찾을 수 없습니다.
          <Link to="/notices">목록으로 돌아가기</Link>
        </div>
      ) : (
        <article className="discovery-post">
          <small>{categoryLabel(notice)}</small>
          <h1>{notice.title}</h1>
          <p className="discovery-muted">
            MOVRIT 운영팀 · {dateOnly(notice.publishedAt)}
          </p>
          <div className="discovery-post__body">{notice.body}</div>
          <Link className="discovery-outline-button" to="/notices">
            목록으로
          </Link>
        </article>
      )}
    </NoticeFrame>
  )
}
