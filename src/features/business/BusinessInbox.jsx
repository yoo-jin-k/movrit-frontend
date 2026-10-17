import { useState } from 'react'
import useBusinessList from './useBusinessList'
import { createInquiry } from '../../api/inquiryApi'
import { markNotificationRead } from '../../api/notificationApi'
import { DetailDialog, ListState, PageHeader, StatusBadge } from './BusinessUi'
import { dateLabel } from './businessModel'
export default function BusinessInbox() {
  const notifications = useBusinessList('/notifications'),
    inquiries = useBusinessList('/inquiries/mine')
  const [tab, setTab] = useState('notifications'),
    [compose, setCompose] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [locked, setLocked] = useState(false)
  const read = async (id) => {
    setBusy(true)
    setError('')
    try {
      await markNotificationRead(id)
      notifications.reload()
    } catch {
      setError('읽음 상태를 변경하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }
  const send = async (event) => {
    event.preventDefault()
    if (busy || locked) return
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
        <button onClick={state.reload}>새로고침</button>
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
                    {item.answer && (
                      <blockquote>
                        <strong>문의 답변</strong>
                        <p>{item.answer}</p>
                      </blockquote>
                    )}
                  </>
                )}
              </div>
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
              <input name="title" required disabled={busy || locked} />
            </label>
            <label>
              내용
              <textarea
                name="content"
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
