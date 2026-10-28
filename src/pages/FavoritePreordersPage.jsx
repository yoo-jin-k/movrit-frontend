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
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0)
  useEffect(() => {
    getFavoritePreorders()
      .then((x) => {
        if (!Array.isArray(x)) throw new Error('응답 형식 오류')
        setItems(x)
        setError('')
      })
      .catch(() => {
        setItems([])
        setError('찜 목록을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [attempt])
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
    setItems((current) => current.filter((x) => x.preorderId !== id))
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
        {items.map((x) => (
          <article key={x.preorderId}>
            <div className="buyer-favorite-card__image" />
            <h2>{x.title}</h2>
            <p>{x.brandName || '힙한 프리오더'}</p>
            <div>
              <Link
                className="buyer-v2-button buyer-v2-button--secondary"
                to={`/preorders/${x.preorderId}`}
              >
                상세 보기
              </Link>
              <BuyerButton
                disabled={busy || loading}
                aria-label={`${x.title} 찜 해제`}
                onClick={() => remove(x.preorderId)}
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
