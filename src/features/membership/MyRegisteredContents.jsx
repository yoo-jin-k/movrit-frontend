/** 내 실제 제출 목록을 보여주고 기존 캠페인 제출 작업으로 연결합니다. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BuyerLayout, { BuyerCard } from '../../components/buyer/BuyerLayout'
import { readMyCampaignContents } from '../../api/myCampaignContentApi'
import {
  MY_CONTENT_STATUS,
  CONTENT_CHANNELS,
  contentLinks,
  myContentLink,
} from './myContentModel'
export default function MyRegisteredContents() {
  const [state, setState] = useState({ items: null, error: '' }),
    [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    readMyCampaignContents(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setState({ items, error: '' })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ items: null, error: '등록 콘텐츠를 불러오지 못했습니다.' })
      })
    return () => controller.abort()
  }, [attempt])
  return (
    <BuyerLayout title="등록 콘텐츠">
      <Link to="/mypage">← 마이페이지</Link>
      {state.error ? (
        <p role="alert">
          {state.error}{' '}
          <button onClick={() => setAttempt((a) => a + 1)}>다시 확인</button>
        </p>
      ) : state.items === null ? (
        <p role="status">등록 콘텐츠를 확인하고 있습니다.</p>
      ) : !state.items.length ? (
        <p>아직 제출한 콘텐츠가 없습니다.</p>
      ) : (
        <div className="buyer-stack">
          {state.items.map((item) => (
            <BuyerCard
              key={item.id}
              title={item.campaignTitle || '캠페인 제출 콘텐츠'}
            >
              <p>{MY_CONTENT_STATUS[item.status] || '상태 확인 필요'}</p>
              {contentLinks(item).map(
                (link, index) =>
                  myContentLink(link.contentUrl) && (
                    <p key={index}>
                      <a
                        href={myContentLink(link.contentUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {CONTENT_CHANNELS[link.channelType] || '등록'} 콘텐츠
                        보기 ↗
                      </a>
                    </p>
                  ),
              )}
              <Link
                to={`/mypage/campaigns?applicationId=${item.applicationId}`}
              >
                캠페인 제출·검토 확인 ›
              </Link>
            </BuyerCard>
          ))}
        </div>
      )}
    </BuyerLayout>
  )
}
