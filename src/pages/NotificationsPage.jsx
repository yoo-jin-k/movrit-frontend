import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '../api/notificationApi'

function NotificationsPage() {
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const load = async () => {
        const [notifications, unread] = await Promise.all([
            getNotifications(),
            getUnreadNotificationCount(),
        ])
        setItems(notifications)
        setUnreadCount(unread.unreadCount)
    }

    useEffect(() => {
        load()
            .catch((error) => {
                console.error(error)
                alert('알림을 불러오지 못했어.')
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

    if (loading) return <p>알림을 불러오는 중...</p>

    return (
        <div>
            <h1>알림</h1>
            <p>읽지 않은 알림 {unreadCount}개</p>
            <button onClick={readAll} disabled={unreadCount === 0}>모두 읽음</button>
            <button onClick={() => navigate('/mypage')}>마이페이지</button>

            {items.length === 0 && <p>아직 알림이 없어.</p>}

            {items.map((item) => (
                <article key={item.id} style={{ border: '1px solid #ddd', padding: 12, marginTop: 12 }}>
                    <strong>{item.read ? '' : '● '}{item.title}</strong>
                    <p>{item.message}</p>
                    <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small>
                    {(item.targetType && item.targetId) && (
                        <div>
                            <button onClick={() => openNotification(item)}>확인하기</button>
                        </div>
                    )}
                    {!item.read && !(item.targetType && item.targetId) && (
                        <button onClick={() => openNotification(item)}>읽음 처리</button>
                    )}
                </article>
            ))}
        </div>
    )
}

export default NotificationsPage
