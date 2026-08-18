import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFavoritePreorders, removeFavoritePreorder } from '../api/favoriteApi'

function FavoritePreordersPage() {
    const navigate = useNavigate()
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        try {
            setFavorites(await getFavoritePreorders())
        } catch (error) {
            alert(error.response?.data?.message || '찜한 프리오더를 불러오지 못했어.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const remove = async (preorderId) => {
        try {
            await removeFavoritePreorder(preorderId)
            setFavorites((current) => current.filter((item) => item.preorderId !== preorderId))
        } catch (error) {
            alert(error.response?.data?.message || '찜을 해제하지 못했어.')
        }
    }

    if (loading) return <p>찜 목록을 불러오는 중...</p>

    return <main>
        <h1>찜한 프리오더</h1>
        <button onClick={() => navigate('/preorders')}>프리오더 더 둘러보기</button>

        {favorites.length === 0 ? <p>아직 찜한 프리오더가 없어.</p> : favorites.map((item) => {
            const rate = item.targetQuantity > 0 ? (item.orderedQuantity / item.targetQuantity) * 100 : 0
            return <section key={item.favoriteId}>
                <h2>{item.title}</h2>
                <p>{Number(item.preorderPrice).toLocaleString()} {item.currency}</p>
                <p>상태 {item.status} · 달성률 {rate.toFixed(1)}%</p>
                <p>주문 {item.orderedQuantity} / 목표 {item.targetQuantity}</p>
                <button onClick={() => navigate(`/preorders/${item.preorderId}`)}>상세 보기</button>
                <button onClick={() => remove(item.preorderId)}>찜 해제</button>
                <hr />
            </section>
        })}
    </main>
}

export default FavoritePreordersPage
