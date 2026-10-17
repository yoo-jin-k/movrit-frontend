import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import BuyerLayout from '../../components/buyer/BuyerLayout'

const STATUS = {
  SUBMITTED: '신청 접수',
  SELECTED: '선정',
  REJECTED: '미선정',
  ACTIVE: '참여 중',
  CONTENT_SUBMITTED: '콘텐츠 제출',
  REVISION_REQUESTED: '수정 요청',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

// 별도 인플루언서 자격을 검사하지 않고 로그인 사용자의 서버 신청 이력을 표시합니다.
export default function MyCampaignsPage() {
  const [state, setState] = useState({ loading: true, items: [], error: '' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/campaigns/applications/mine', {
        signal: controller.signal,
        timeout: 15000,
      })
      .then(({ data }) => {
        if (!Array.isArray(data))
          throw new Error('신청 내역 형식을 확인할 수 없습니다.')
        if (!controller.signal.aborted)
          setState({ loading: false, items: data, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            items: [],
            error:
              error.response?.data?.detail ||
              '신청 내역을 불러오지 못했습니다.',
          })
      })
    return () => controller.abort()
  }, [attempt])
  return (
    <BuyerLayout title="내 캠페인 신청">
      <p>캠페인별 참여 조건과 신청 진행 상태를 확인해 주세요.</p>
      {state.loading ? (
        <p role="status">신청 내역을 불러오고 있습니다.</p>
      ) : state.error ? (
        <div>
          <p role="alert">{state.error}</p>
          <button
            type="button"
            onClick={() => {
              setState((old) => ({ ...old, loading: true }))
              setAttempt((v) => v + 1)
            }}
          >
            다시 시도
          </button>
        </div>
      ) : state.items.length === 0 ? (
        <p>아직 신청한 캠페인이 없습니다.</p>
      ) : (
        <ul>
          {state.items.map((item) => (
            <li key={item.id}>
              <Link to={`/campaign/${item.campaignId}`}>
                캠페인 #{item.campaignId}
              </Link>
              <p>
                신청 #{item.id} · {STATUS[item.status] || '상태 확인 필요'}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Link to="/home">캠페인 둘러보기</Link>
    </BuyerLayout>
  )
}
