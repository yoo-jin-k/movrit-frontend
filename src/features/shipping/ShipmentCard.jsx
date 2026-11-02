/**
 * 배송형 참여의 발송 정보 카드입니다(참여자 '내 캠페인', 업체 참여자 상세).
 * - 발송 전: 브랜드가 송장을 입력하면 알림과 함께 이곳에 표시된다고 안내합니다.
 * - 발송 후: 택배사·송장번호(복사 버튼)·발송일을 보여줍니다. 참여자는 상품을 받으면 '체험 완료 확인'을 누릅니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { readShipment } from '../../api/shippingApi'
import { shortTime } from './shippingModel'
import './shipping.css'

export default function ShipmentCard({ application, seller = false }) {
  const [shipment, setShipment] = useState(undefined)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    readShipment(application.id, controller.signal)
      .then(setShipment)
      .catch(() => {
        if (!controller.signal.aborted) setShipment(null)
      })
    return () => controller.abort()
  }, [application.id])
  if (shipment === undefined) return null
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <section className="shipment-card" aria-label="배송 상태">
      <h3>배송 상태</h3>
      {!shipment ? (
        <p>
          {seller
            ? '아직 송장을 입력하지 않았습니다.'
            : '브랜드가 상품을 보내면 택배사와 송장번호가 이곳에 표시되고 알림으로도 알려 드립니다.'}
        </p>
      ) : (
        <>
          <p>
            <span className="shipment-badge">
              {application.experienceConfirmedAt ? '수령 확인' : '발송'}
            </span>{' '}
            <strong>{shipment.courier}</strong> {shipment.trackingNumber}{' '}
            <button type="button" className="shipment-copy" onClick={copy}>
              {copied ? '복사됨' : '송장번호 복사'}
            </button>
          </p>
          <small>
            발송 {shortTime(shipment.shippedAt)}
            {shipment.updatedAt !== shipment.shippedAt &&
              ` · 수정 ${shortTime(shipment.updatedAt)}`}
          </small>
          {!seller && !application.experienceConfirmedAt && (
            <p>
              상품을 받으시면 아래 &apos;체험 완료 확인&apos;을 눌러 주세요.
            </p>
          )}
        </>
      )}
      {seller && (
        <Link
          className="business-link"
          to={`/seller/shipping?campaignId=${application.campaignId}`}
        >
          배송 관리에서 송장 입력 →
        </Link>
      )}
    </section>
  )
}
