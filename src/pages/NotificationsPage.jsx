import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '../api/notificationApi'
import CommonLayout from '../components/layout/CommonLayout'

const previewNotifications = [
    { id: 'p1', title: '프리오더 목표가 78% 달성됐어', createdAt: '2분 전', read: false },
    { id: 'p2', title: 'LUMENA에서 새로운 협업 제안을 보냈어', createdAt: '18분 전', read: false },
    { id: 'p3', title: '주문이 결제 완료됐어', createdAt: '1시간 전', read: true },
    { id: 'p4', title: '콘텐츠 수정 요청이 도착했어', createdAt: '3시간 전', read: true },
    { id: 'p5', title: '8월 정산 예정 금액이 확정됐어', createdAt: '어제', read: true },
    { id: 'p6', title: '서비스 점검 공지', createdAt: '8/14', read: true },
]

function NotificationsPage() {
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([getNotifications(), getUnreadNotificationCount()])
            .then(([notifications, unread]) => {
                setItems(notifications)
                setUnreadCount(unread.unreadCount)
            })
            .catch((error) => {
                console.error(error)
                if (import.meta.env.DEV) setItems(previewNotifications)
                else alert('알림을 불러오지 못했어.')
            })
            .finally(() => setLoading(false))
    }, [])

    const openNotification = async (item) => {
        try {
            if (!item.read) {
                const updated = await markNotificationRead(item.id)
                setItems((current) => current.map((value) => value.id === item.id ? updated : value))
                setUnreadCount((value) => Math.max(0, value - 1))
            }
        } catch (error) {
            console.error(error)
        }

        if (item.targetType === 'PREORDER' && item.targetId) {
            navigate(`/preorders/${item.targetId}`)
        } else if (item.targetType === 'INQUIRY') {
            navigate('/inquiries')
        }
    }

    const readAll = async () => {
        try {
            await markAllNotificationsRead()
            setItems((current) => current.map((item) => ({
                ...item,
                read: true,
                readAt: item.readAt || new Date().toISOString(),
            })))
            setUnreadCount(0)
        } catch (error) {
            console.error(error)
            alert('알림을 모두 읽음 처리하지 못했어.')
        }
    }

    return (
        <CommonLayout title="알림센터">
            <div className="common-chips">{['전체', '주문', '협업', '정산', '공지'].map((chip) => <button key={chip}>{chip}</button>)}<button onClick={readAll} disabled={unreadCount === 0}>모두 읽음</button></div>
            <section className="notification-list">
                {loading && <div className="common-empty">알림을 불러오는 중...</div>}
                {!loading && items.length === 0 && <div className="common-empty">아직 알림이 없어.</div>}
                {!loading && items.map((item) => <button type="button" key={item.id} onClick={() => openNotification(item)}><i className={item.read ? '' : 'is-unread'} /><div><strong>{item.title}</strong>{item.message && <p>{item.message}</p>}<small>{typeof item.id === 'string' ? item.createdAt : item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small></div></button>)}
            </section>
        </CommonLayout>
    )
}

export default NotificationsPage
