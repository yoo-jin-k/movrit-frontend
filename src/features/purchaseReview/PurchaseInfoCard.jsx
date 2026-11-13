/**
 * 캠페인 상세·내 캠페인 화면의 구매 안내 카드입니다(구매처·판매가·환급액·실부담 금액).
 * 업체가 아직 안내를 등록하지 않았으면 '준비 중'으로 보여줍니다.
 */
import { useEffect, useState } from 'react'
import { readPurchaseInfo } from '../../api/purchaseReviewApi'
import { won } from './purchaseReviewModel'

export default function PurchaseInfoCard({ campaignId }) {
  const [state, setState] = useState({ loading: true, info: null, error: '' })
  useEffect(() => {
    const controller = new AbortController()
    readPurchaseInfo(campaignId, controller.signal)
      .then((info) => setState({ loading: false, info, error: '' }))
      .catch(() => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            info: null,
            error: '구매 안내를 불러오지 못했습니다.',
          })
      })
    return () => controller.abort()
  }, [campaignId])
  const { loading, info, error } = state
  return (
    <section className="purchase-info-card" aria-label="구매평 구매 안내">
      <h3>구매평 캠페인 안내</h3>
      {loading ? (
        <p role="status">구매 안내를 불러오고 있습니다.</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !info ? (
        <p>브랜드가 구매 안내를 준비 중입니다.</p>
      ) : (
        <>
          <dl className="purchase-info-card__prices">
            <div>
              <dt>판매가</dt>
              <dd>{won(info.productPrice)}</dd>
            </div>
            <div>
              <dt>환급액</dt>
              <dd className="is-payback">− {won(info.paybackAmount)}</dd>
            </div>
            <div className="is-final">
              <dt>실부담 금액</dt>
              <dd>{won(info.finalPrice)}</dd>
            </div>
          </dl>
          <p>
            구매처 <strong>{info.storeName}</strong>{' '}
            <a href={info.productUrl} target="_blank" rel="noopener noreferrer">
              상품 페이지 열기 ↗
            </a>
          </p>
          {info.purchaseGuide && (
            <p className="purchase-info-card__guide">{info.purchaseGuide}</p>
          )}
          <ol className="purchase-info-card__steps">
            <li>선정되면 구매처에서 직접 결제해 구매합니다.</li>
            <li>주문번호와 주문 내역 캡처로 구매 인증을 합니다.</li>
            <li>구매처에 구매평을 남기고 그 주소를 제출합니다.</li>
            <li>구매평이 승인되면 브랜드가 환급액을 보내 드립니다.</li>
          </ol>
          <small>
            결제와 환급은 구매처·브랜드와 직접 이루어지며 MOVRIT은 결제를
            대신하지 않습니다.
          </small>
        </>
      )}
    </section>
  )
}
