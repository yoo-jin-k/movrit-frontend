/**
 * 실제 알림만 조회하며 실패와 빈 목록을 구분합니다. 읽음 처리 후 서버 값을 다시 확인합니다.
 * 변경 이력(고치기 전 → 고친 후): 공용 칩 줄에 필터와 '모두 읽음'이 섞이고 링크 버튼 글자가 위로 붙음
 * → 필터·동작 줄을 나누고 버튼을 가로·세로 가운데 정렬, 목록을 제목과 같은 왼쪽 선에 맞춤.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationApi'
import CommonLayout from '../components/layout/CommonLayout'
import {
  filterNotifications,
  notificationPath,
} from '../features/business/notificationModel'
import { workspaceTime } from '../features/membership/campaignWorkspaceModel'
export default function NotificationsPage() {
  const [state, setState] = useState({
    loading: true,
    items: [],
    count: null,
    error: '',
  })
  const [attempt, setAttempt] = useState(0),
    [filter, setFilter] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const inFlight = useRef(false)
  const reload = () => {
    setState((old) => ({ ...old, loading: true }))
    setAttempt((v) => v + 1)
  }
  useEffect(() => {
    let active = true
    Promise.all([getNotifications(), getUnreadNotificationCount()])
      .then(([items, unread]) => {
        if (!Array.isArray(items) || !Number.isSafeInteger(unread.count))
          throw new Error('알림 형식을 확인할 수 없습니다.')
        if (active)
          setState({ loading: false, items, count: unread.count, error: '' })
      })
      .catch(() => {
        if (active)
          setState({
            loading: false,
            items: [],
            count: null,
            error: '알림을 불러오지 못했습니다. 다시 확인해 주세요.',
          })
      })
    return () => {
      active = false
    }
  }, [attempt])
  const read = async (id) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      if (id != null) await markNotificationRead(id)
      else await markAllNotificationsRead()
      reload()
    } catch {
      setError(
        '읽음 처리 결과를 확인하지 못했습니다. 새로고침으로 최신 상태를 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const shown = filterNotifications(state.items, filter)
  return (
    <CommonLayout title="알림센터">
      <div className="notification-toolbar">
        <p>
          읽지 않은 알림 <strong>{state.count ?? '—'}</strong>개
        </p>
        <div className="notification-actions">
          <button
            type="button"
            className="notification-button"
            onClick={() => read(null)}
            disabled={busy || state.loading || !state.count}
          >
            모두 읽음
          </button>
          <button
            type="button"
            className="notification-button"
            onClick={reload}
            disabled={busy || state.loading}
          >
            새로고침
          </button>
        </div>
      </div>
      <div className="notification-filters" role="group" aria-label="알림 종류">
        {[
          ['', '전체'],
          ['unread', '읽지 않음'],
          ['campaign', '캠페인'],
          ['PREORDER', '프리오더'],
          ['INQUIRY', '문의'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="notification-button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {state.loading ? (
        <p role="status">알림을 불러오고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : !shown.length ? (
        <p className="common-empty">표시할 알림이 없습니다.</p>
      ) : (
        <ul className="notification-list">
          {shown.map((item) => (
            <li
              key={item.id}
              className={`notification-item${item.read ? '' : ' is-unread'}`}
            >
              <span className="notification-item__dot" aria-hidden="true" />
              <div className="notification-item__body">
                <h2>{item.title}</h2>
                <p>{item.message}</p>
                <small>
                  {workspaceTime(item.createdAt)} ·{' '}
                  {item.read ? '읽음' : '읽지 않음'}
                </small>
              </div>
              <div className="notification-item__actions">
                {!item.read && (
                  <button
                    type="button"
                    className="notification-button"
                    disabled={busy}
                    onClick={() => read(item.id)}
                  >
                    읽음 표시
                  </button>
                )}
                {notificationPath(item) && (
                  <Link
                    className="notification-button notification-button--primary"
                    to={notificationPath(item)}
                  >
                    관련 내역 보기
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CommonLayout>
  )
}
