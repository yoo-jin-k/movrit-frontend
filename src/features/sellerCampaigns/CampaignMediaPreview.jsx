/**
 * 실제 저장 없이 미디어 입력·방문/배송 전환을 점검하는 독립 검수 화면입니다.
 * 상태는 화면 메모리에서만 바꾸며 변경 후 주소 확인 체크를 해제합니다.
 */
import { useState } from 'react'
import CampaignMediaFields from './CampaignMediaFields'
import { emptyCampaignMediaDraft } from './campaignMediaDraft'
export default function CampaignMediaPreview() {
  const [value, setValue] = useState(emptyCampaignMediaDraft)
  const [visit, setVisit] = useState(true)
  return (
    <main
      style={{
        maxWidth: 760,
        margin: '24px auto',
        padding: 16,
        fontFamily: 'sans-serif',
      }}
    >
      <h1>캠페인 이미지·주소 입력 검수</h1>
      <p>
        저장 기능이 연결되지 않은 검수 화면입니다. 입력값과 파일은 서버로
        전송되지 않습니다.
      </p>
      <label>
        <input
          type="checkbox"
          checked={visit}
          onChange={(event) => {
            setVisit(event.target.checked)
            setValue((current) => ({ ...current, locationConfirmed: false }))
          }}
        />
        방문형
      </label>
      <CampaignMediaFields
        value={value}
        onChange={setValue}
        fulfillmentTypes={visit ? ['VISIT'] : ['DELIVERY']}
      />
    </main>
  )
}
