/**
 * 업체 캠페인 작성 화면의 '구매평 구매 안내' 입력 칸입니다(캠페인 종류가 구매평일 때만 보입니다).
 * 값은 상위 폼(form.purchaseReview)에 담기고, 캠페인을 저장한 뒤 별도 요청으로 저장됩니다.
 */
import { won } from './purchaseReviewModel'

export default function PurchaseInfoFields({ value, onChange, disabled }) {
  const change = (name, next) => onChange({ ...value, [name]: next })
  const price = Number(value.productPrice)
  const payback = Number(value.paybackAmount)
  const ready =
    value.productPrice !== '' &&
    value.paybackAmount !== '' &&
    Number.isFinite(price) &&
    Number.isFinite(payback)
  return (
    <fieldset className="purchase-info-fields" disabled={disabled}>
      <legend>구매평 구매 안내</legend>
      <p>
        참여자는 아래 구매처에서 직접 결제해 상품을 사고 구매평을 남깁니다.
        구매평이 승인되면 브랜드가 환급액을 직접 보내 주세요. MOVRIT은 결제와
        송금을 대신하지 않습니다.
      </p>
      <label>
        구매처
        <input
          required
          maxLength={50}
          placeholder="예) 네이버 스마트스토어"
          value={value.storeName}
          onChange={(e) => change('storeName', e.target.value)}
        />
      </label>
      <label>
        상품 페이지 주소
        <input
          required
          type="url"
          maxLength={500}
          placeholder="https://smartstore.naver.com/..."
          value={value.productUrl}
          onChange={(e) => change('productUrl', e.target.value)}
        />
      </label>
      <label>
        판매가(원)
        <input
          required
          inputMode="numeric"
          value={value.productPrice}
          onChange={(e) =>
            change('productPrice', e.target.value.replace(/[^\d]/g, ''))
          }
        />
      </label>
      <label>
        환급액(원)
        <input
          required
          inputMode="numeric"
          value={value.paybackAmount}
          onChange={(e) =>
            change('paybackAmount', e.target.value.replace(/[^\d]/g, ''))
          }
        />
      </label>
      {ready && (
        <p className="purchase-info-fields__summary" role="status">
          참여자 실부담 {won(Math.max(price - payback, 0))} (판매가 {won(price)}{' '}
          − 환급 {won(payback)})
        </p>
      )}
      <label className="purchase-info-fields__wide">
        구매·구매평 작성 안내 (선택)
        <textarea
          rows={3}
          maxLength={2000}
          placeholder="예) 옵션은 '기본형'으로 구매하고, 사진 3장 이상 포토 구매평을 남겨 주세요."
          value={value.purchaseGuide}
          onChange={(e) => change('purchaseGuide', e.target.value)}
        />
      </label>
    </fieldset>
  )
}
