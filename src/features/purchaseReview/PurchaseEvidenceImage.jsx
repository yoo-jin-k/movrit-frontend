/** 주문 내역 캡처를 로그인 요청으로 받아 보여줍니다(공개 주소 없음). 바뀐 캡처를 다시 받도록 version을 씁니다. */
import { useEffect, useState } from 'react'
import { readPurchaseEvidence } from '../../api/purchaseReviewApi'

export default function PurchaseEvidenceImage({ applicationId, version }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''
    readPurchaseEvidence(applicationId, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        setFailed(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [applicationId, version])
  if (failed) return <p role="alert">주문 내역 캡처를 불러오지 못했습니다.</p>
  if (!url) return <p role="status">주문 내역 캡처를 불러오는 중…</p>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img className="purchase-evidence" src={url} alt="주문 내역 캡처" />
    </a>
  )
}
