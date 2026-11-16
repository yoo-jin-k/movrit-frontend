/**
 * 서버 찜 목록을 표시하고 삭제 성공 뒤 해당 항목을 화면에서 제거합니다.
 * 빈 목록과 조회 오류를 구분하며 삭제 실패 시 기존 항목을 보존합니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFavoritePreorders,
  removeFavoritePreorder,
} from '../api/favoriteApi'
import BuyerLayout, { BuyerButton } from '../components/buyer/BuyerLayout'

export default function FavoritePreordersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)

  // 재조회 횟수가 바뀔 때만 서버 목록을 다시 요청합니다.
  useEffect(() => {
    getFavoritePreorders()
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('응답 형식 오류')
        setItems(items)
        setError('')
      })
      .catch(() => {
        setItems([])
        setError('찜 목록을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [attempt])

  // 서버에서 해제가 성공한 항목만 목록에서 제거합니다. 실패하면 기존 목록을 유지합니다.
  const remove = async (id) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await removeFavoritePreorder(id)
    } catch {
      setError(
        '찜 해제 결과를 확인하지 못했습니다. 새로고침으로 확인해 주세요.',
      )
      setBusy(false)
      return
    }
    setBusy(false)
    setItems((current) => current.filter((item) => item.preorderId !== id))
  }

  return (
    <BuyerLayout title="찜한 프리오더">
      <button
        disabled={loading || busy}
        onClick={() => {
          setLoading(true)
          setAttempt((v) => v + 1)
        }}
      >
        새로고침
      </button>
      {loading ? (
        <p role="status">찜 목록을 불러오고 있습니다.</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !items.length ? (
        <p>찜한 프리오더가 없습니다.</p>
      ) : null}
      <div className="buyer-favorite-grid">
        {items.map((item) => (
          <article key={item.preorderId}>
            <div className="buyer-favorite-card__image" />
            <h2>{item.title}</h2>
            <p>{item.brandName || '힙한 프리오더'}</p>
            <div>
              <Link
                className="buyer-v2-button buyer-v2-button--secondary"
                to={`/preorders/${item.preorderId}`}
              >
                상세 보기
              </Link>
              <BuyerButton
                disabled={busy || loading}
                aria-label={`${item.title} 찜 해제`}
                onClick={() => remove(item.preorderId)}
              >
                ♥
              </BuyerButton>
            </div>
          </article>
        ))}
      </div>
    </BuyerLayout>
  )
}
