import { DetailDialog, StatusBadge } from './BusinessUi'
import { campaignRequirementSummary } from '../discovery/eligibilityModel'
// 비교는 현재 업체의 조회된 신청만 사용합니다. 선택 체크는 선정 명령이나 점수 산정이 아닙니다.
export default function ParticipantComparison({
  items,
  campaignTitle,
  onClose,
}) {
  return (
    <DetailDialog title="선택한 신청자 비교" onClose={onClose}>
      <p className="business-info">
        신청 내용만 비교합니다. 실제 선정은 각 신청의 상세 화면에서 확인 후
        진행해 주세요.
      </p>
      <div className="business-compare-grid">
        {items.map((item) => (
          <article className="business-compare-card" key={item.id}>
            <span className="business-avatar" aria-hidden="true">
              {item.creatorNickname?.slice(0, 1) || 'M'}
            </span>
            <h3>{item.creatorNickname}</h3>
            <small>{campaignTitle(item.campaignId)}</small>
            <p>
              <StatusBadge status={item.status} />
            </p>
            <h4>신청 당시 조건</h4>
            <p>
              {campaignRequirementSummary(item.eligibilityRequirementSnapshot)}
            </p>
            <h4>신청 메시지</h4>
            <p>{item.message || '작성된 내용이 없습니다.'}</p>
            <h4>추가 답변</h4>
            {item.answers?.length ? (
              item.answers.map((a) => (
                <p key={a.questionId}>
                  <strong>질문 {a.questionId}</strong>
                  <br />
                  {a.value || '답변 없음'}
                </p>
              ))
            ) : (
              <p>추가 답변이 없습니다.</p>
            )}
          </article>
        ))}
      </div>
      <p className="business-footnote">
        지표 원문·출처·측정일과 다른 업체의 비공개 이력은 이 응답에 포함되지
        않습니다.
      </p>
    </DetailDialog>
  )
}
