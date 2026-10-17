import { DetailDialog } from '../business/BusinessUi'
import { dateLabel } from '../business/businessModel'
// 현재 작성값만 보여주는 미리보기입니다. 신청 가능 판정·등록·개인정보 수집을 수행하지 않습니다.
export default function CampaignFormPreview({
  campaign,
  applicationForm,
  condition,
  onClose,
}) {
  return (
    <DetailDialog title="사용자 신청 폼 미리보기" onClose={onClose}>
      <h3>{campaign.title || '캠페인 제목 미입력'}</h3>
      <p>{campaign.description || '캠페인 소개를 입력해 주세요.'}</p>
      <dl className="business-details">
        <div>
          <dt>제공 내역</dt>
          <dd>{campaign.rewardDescription || '미입력'}</dd>
        </div>
        <div>
          <dt>모집 마감</dt>
          <dd>{dateLabel(campaign.endAt)}</dd>
        </div>
        <div>
          <dt>참여 조건</dt>
          <dd>
            {condition.mode === 'NONE'
              ? '추가 채널 지표 조건 없음'
              : `인스타그램 팔로워 ${condition.minimumValue === '' ? '미입력' : condition.minimumValue}명 이상`}
          </dd>
        </div>
      </dl>
      <h3>참여 방식</h3>
      <p>
        {applicationForm.allowedFulfillmentTypes
          .map((type) => (type === 'DELIVERY' ? '배송형' : '방문형'))
          .join(' · ') || '참여 방식을 선택해 주세요.'}
      </p>
      {applicationForm.allowedFulfillmentTypes.includes('DELIVERY') && (
        <p className="business-info">
          실제 배송형 신청서에서는 수령인·연락처·주소를 입력합니다.
          미리보기에서는 개인정보를 수집하지 않습니다.
        </p>
      )}
      <h3>추가 질문</h3>
      {applicationForm.questions.length ? (
        applicationForm.questions.map((q, index) => (
          <div className="business-preview-question" key={q.id}>
            <strong>
              {index + 1}. {q.label || '질문 미입력'}{' '}
              {q.required ? '(필수)' : '(선택)'}
            </strong>
            <p>
              {q.type === 'SINGLE_CHOICE'
                ? q.options.filter(Boolean).join(' / ') || '선택지 미입력'
                : `답변 입력 영역${q.maxLength ? ` · 최대 ${q.maxLength}자` : ''}`}
            </p>
          </div>
        ))
      ) : (
        <p>추가 질문이 없습니다.</p>
      )}
      <h3>동의 문서</h3>
      {applicationForm.agreements.map((a) => (
        <section className="business-preview-question" key={a.id}>
          <strong>
            {a.title || '제목 미입력'} · {a.required ? '필수' : '선택'}
          </strong>
          <small>버전 {a.version || '미입력'}</small>
          <p>{a.body || '본문 미입력'}</p>
        </section>
      ))}
      <p className="business-info">
        작성 중인 내용의 미리보기입니다. 승인 동의문과 필수 문서 정책을 확인해야
        하며, 이 화면만으로 신청 가능 상태가 확정되지 않습니다.
      </p>
    </DetailDialog>
  )
}
