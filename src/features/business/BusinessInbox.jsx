/**
 * 알림과 문의 목록을 탭으로 구분하고 읽음 처리·문의 등록을 수행합니다.
 * 명령이 성공하면 해당 목록을 다시 조회하며 입력 폼을 데이터로 바꾸는 책임을 이 화면에 둡니다.
 */
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { notificationPath } from './notificationModel'
import useBusinessList from './useBusinessList'
import { closeInquiry, createInquiry } from '../../api/inquiryApi'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notificationApi'
import { DetailDialog, ListState, PageHeader, StatusBadge } from './BusinessUi'
import { dateLabel } from './businessModel'
export default function BusinessInbox() {
  const notifications = useBusinessList('/notifications'),
    inquiries = useBusinessList('/inquiries/mine')
  const [params] = useSearchParams()
  const inFlight = useRef(false)
  const [tab, setTab] = useState(
      params.get('tab') === 'inquiries' ? 'inquiries' : 'notifications',
    ),
    [compose, setCompose] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [locked, setLocked] = useState(false)
  // 읽음 처리 성공 후 알림 목록을 재조회하며 오류 시 읽음 완료를 로컬에서 확정하지 않습니다.
  const read = async (id) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      if (id == null) await markAllNotificationsRead()
      else await markNotificationRead(id)
      notifications.reload()
    } catch {
      setError('읽음 상태를 변경하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  // 브라우저 FormData에서 제목과 내용을 추출하여 문의를 저장합니다. 성공 후 폼을 비우고 문의 목록을 다시 읽습니다.
  const send = async (event) => {
    event.preventDefault()
    if (inFlight.current || locked) return
    const form = new FormData(event.currentTarget)
    const data = {
      preorderId: null,
      category: form.get('category').trim(),
      title: form.get('title').trim(),
      content: form.get('content').trim(),
    }
    if (!data.category || !data.title || !data.content) {
      setError('문의 분류, 제목과 내용을 입력해 주세요.')
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await createInquiry(data)
      setCompose(false)
      setTab('inquiries')
      inquiries.reload()
    } catch {
      setLocked(true)
      setError(
        '등록 결과를 확인하지 못했습니다. 문의 목록을 확인한 후 다시 작성해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const close = async (id) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await closeInquiry(id)
      inquiries.reload()
    } catch {
      setError(
        '문의 종료 결과를 확인하지 못했습니다. 새로고침으로 최신 상태를 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const state = tab === 'notifications' ? notifications : inquiries
  return (
    <>
      <PageHeader
        title="알림·문의"
        description="업무 알림과 문의 답변을 확인하세요."
      >
        <button
          className="business-primary"
          onClick={() => {
            setCompose(true)
            setError('')
            setLocked(false)
          }}
        >
          문의 작성
        </button>
      </PageHeader>
      <div className="business-filters">
        <button
          aria-pressed={tab === 'notifications'}
          onClick={() => setTab('notifications')}
        >
          알림
        </button>
        <button
          aria-pressed={tab === 'inquiries'}
          onClick={() => setTab('inquiries')}
        >
          문의 내역
        </button>
        <button onClick={state.reload} disabled={busy}>
          새로고침
        </button>
        {tab === 'notifications' && (
          <button
            disabled={
              busy ||
              notifications.loading ||
              !notifications.data.some((item) => !item.read)
            }
            onClick={() => read(null)}
          >
            모두 읽음
          </button>
        )}
      </div>
      {error && !compose && <p role="alert">{error}</p>}
      <section className="business-panel">
        <ListState state={state}>
          {state.data.map((item) => (
            <article className="business-inbox-row" key={item.id}>
              <div>
                <small>{dateLabel(item.createdAt)}</small>
                <h3>{item.title}</h3>
                <p>{tab === 'notifications' ? item.message : item.content}</p>
                {tab === 'inquiries' && (
                  <>
                    <StatusBadge status={item.status} />
                    {item.status !== 'CLOSED' && (
                      <button disabled={busy} onClick={() => close(item.id)}>
                        문의 종료
                      </button>
                    )}
                    {item.answer && (
                      <blockquote>
                        <strong>문의 답변</strong>
                        <p>{item.answer}</p>
                      </blockquote>
                    )}
                  </>
                )}
              </div>
              {tab === 'notifications' && notificationPath(item, true) && (
                <Link
                  className="business-link"
                  to={notificationPath(item, true)}
                >
                  관련 내역 보기
                </Link>
              )}
              {tab === 'notifications' && (
                <button
                  disabled={busy || item.read}
                  onClick={() => read(item.id)}
                >
                  {item.read ? '읽음' : '읽음 표시'}
                </button>
              )}
            </article>
          ))}
        </ListState>
      </section>
      {compose && (
        <DetailDialog
          title="업체 문의 작성"
          busy={busy}
          onClose={() => {
            setCompose(false)
            if (locked) inquiries.reload()
          }}
        >
          <form onSubmit={send}>
            <label>
              문의 분류
              <input
                name="category"
                required
                placeholder="문의하실 업무를 입력해 주세요."
                disabled={busy || locked}
              />
            </label>
            <label>
              제목
              <input
                name="title"
                required
                maxLength={200}
                disabled={busy || locked}
              />
            </label>
            <label>
              내용
              <textarea
                name="content"
                maxLength={5000}
                required
                rows={7}
                disabled={busy || locked}
              />
            </label>
            {error && (
              <p role="alert" className="business-error">
                {error}
              </p>
            )}
            <button className="business-primary" disabled={busy || locked}>
              {busy ? '등록 중...' : '문의 등록'}
            </button>
          </form>
        </DetailDialog>
      )}
    </>
  )
}
