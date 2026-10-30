/**
 * 기존 업체 대시보드의 서버 요약 수치를 표시합니다.
 * 값이 도착하기 전에는 로딩을 유지하며 조회 실패를 예시 통계로 대체하지 않습니다.
 */
import { useEffect, useState } from 'react'
import { getSellerDashboard } from '../api/sellerApi'

const money = (value) => Number(value || 0).toLocaleString()

export default function SellerDashboardPage() {
  const [data, setData] = useState(null)
  useEffect(() => {
    getSellerDashboard()
      .then(setData)
      .catch(() => alert('판매자 현황을 불러오지 못했습니다.'))
  }, [])
  if (!data) return <p>불러오는 중...</p>
  const { summary } = data
  return (
    <main>
      <h1>판매자 대시보드</h1>
      <section>
        <p>
          전체 프로젝트 <b>{summary.projects}</b> · 진행 중{' '}
          <b>{summary.activeProjects}</b> · 주문 <b>{summary.orders}</b>
        </p>
        <p>
          결제 총액 <b>{money(summary.paidGmv)}원</b> · 환불{' '}
          <b>{money(summary.refundAmount)}원</b>
        </p>
        <p>
          예상 정산액 <b>{money(summary.estimatedSettlement)}원</b>{' '}
          <small>(기본 수수료 반영, 실제 확정액과 다를 수 있습니다.)</small>
        </p>
      </section>
      <h2>프로젝트별 현황</h2>
      {data.projects.length === 0 ? (
        <p>등록한 프로젝트가 없습니다.</p>
      ) : (
        data.projects.map((project) => (
          <section key={project.id}>
            <b>{project.title}</b> · {project.status}
            <p>
              달성률 {project.achievementRate.toFixed(1)}% (
              {project.orderedQuantity}/{project.targetQuantity})
            </p>
            <p>
              결제 {money(project.paidGmv)}원 · 환불{' '}
              {money(project.refundAmount)}원
            </p>
          </section>
        ))
      )}
    </main>
  )
}
