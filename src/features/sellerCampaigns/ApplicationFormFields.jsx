import {
  fulfillmentLabel,
  fulfillmentOptions,
} from '../purchaseReview/purchaseReviewModel'
import { chooseFulfillment, hasMixedFulfillment } from './applicationFormModel'
/**
 * 참여 방식·추가 질문·동의 문서의 편집값을 부모 폼으로 전달합니다.
 * 행별 변경은 새 배열로 반영하며 저장 요청과 버전 검증은 상위 편집기에 맡깁니다.
 * 참여 방식은 라디오 버튼으로 하나만 고릅니다(배송형·방문형 택1, 구매평은 직접 구매).
 * visitWarning: 수정 중 방문형을 해제해 기존 방문 정보가 지워질 때 부모가 넘겨주는 안내입니다.
 */
export default function ApplicationFormFields({
  value,
  onChange,
  disabled = false,
  campaignType = 'PRODUCT',
  visitWarning = '',
}) {
  // 변경한 질문 행만 새 객체로 바꾸고 다른 질문과 동의 문서는 유지합니다.
  const updateQuestion = (index, patch) =>
    onChange({
      ...value,
      questions: value.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    })
  // 동의 문서 한 행을 갱신합니다. 문서의 법적 효력이나 승인 상태를 이 입력 변경으로 판정하지 않습니다.
  const updateAgreement = (index, patch) =>
    onChange({
      ...value,
      agreements: value.agreements.map((a, i) =>
        i === index ? { ...a, ...patch } : a,
      ),
    })
  return (
    <fieldset className="seller-application-settings" disabled={disabled}>
      <legend>신청서 필수 설정</legend>
      <p>
        캠페인과 신청서를 함께 저장합니다. 신청서를 구성하기 전에는 참여 신청을
        받을 수 없습니다.
      </p>
      <div
        className="seller-form-full"
        role="radiogroup"
        aria-labelledby="seller-fulfillment-heading"
      >
        <h4 id="seller-fulfillment-heading">참여 방식 (하나 선택)</h4>
        {/* 구매평 캠페인은 '직접 구매'만, 다른 캠페인은 배송형·방문형 중 하나를 고릅니다. */}
        {fulfillmentOptions(campaignType).map((type) => (
          <label className="seller-checkbox" key={type}>
            <input
              type="radio"
              name="seller-fulfillment-type"
              value={type}
              checked={
                value.allowedFulfillmentTypes.length === 1 &&
                value.allowedFulfillmentTypes[0] === type
              }
              onChange={() => onChange(chooseFulfillment(value, type))}
            />
            {fulfillmentLabel(type)}
          </label>
        ))}
        {hasMixedFulfillment(value.allowedFulfillmentTypes) && (
          <p className="seller-fulfillment-warning" role="status">
            예전에 배송형과 방문형을 함께 고른 신청서입니다. 이제는 하나만 고를
            수 있으니 다시 골라 주세요.
          </p>
        )}
        {visitWarning && (
          <p className="seller-fulfillment-warning" role="status">
            {visitWarning}
          </p>
        )}
      </div>
      <div className="seller-form-full">
        <h4>신청 질문</h4>
        <p>
          미션에 필요한 질문만 직접 입력해 주세요. 인증 비밀이나 배송지를
          질문으로 중복 수집하지 마세요.
        </p>
        {value.questions.map((q, index) => (
          <section className="seller-form-item" key={q.id}>
            <label>
              질문 {index + 1}
              <input
                required
                value={q.label}
                onChange={(e) =>
                  updateQuestion(index, { label: e.target.value })
                }
              />
            </label>
            <label>
              답변 유형
              <select
                value={q.type}
                onChange={(e) =>
                  updateQuestion(index, { type: e.target.value, options: [] })
                }
              >
                <option value="TEXT">짧은 답변</option>
                <option value="TEXTAREA">긴 답변</option>
                <option value="SINGLE_CHOICE">하나 선택</option>
              </select>
            </label>
            {q.type === 'SINGLE_CHOICE' ? (
              <label>
                선택지 (한 줄에 하나)
                <textarea
                  required
                  value={q.options.join('\n')}
                  onChange={(e) =>
                    updateQuestion(index, {
                      options: e.target.value.split('\n'),
                    })
                  }
                />
              </label>
            ) : (
              <label>
                최대 글자 수 (선택)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={q.maxLength ?? ''}
                  onChange={(e) =>
                    updateQuestion(index, { maxLength: e.target.value })
                  }
                />
              </label>
            )}
            <label className="seller-checkbox">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) =>
                  updateQuestion(index, { required: e.target.checked })
                }
              />
              필수 질문
            </label>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  questions: value.questions.filter((_, i) => i !== index),
                })
              }
            >
              질문 {index + 1} 삭제
            </button>
          </section>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              questions: [
                ...value.questions,
                {
                  id: crypto.randomUUID(),
                  label: '',
                  type: 'TEXT',
                  required: false,
                  options: [],
                  maxLength: null,
                },
              ],
            })
          }
        >
          질문 추가
        </button>
      </div>
      <div className="seller-form-full">
        <h4>동의 문서</h4>
        <p>
          운영에서 확인한 문서의 식별자·제목·버전·본문을 입력해 주세요. 문구를
          자동 생성하거나 승인 여부를 대신 판단하지 않습니다.
        </p>
        {value.agreements.map((a, index) => (
          <section className="seller-form-item" key={index}>
            <label>
              문서 식별자
              <input
                required
                value={a.id}
                onChange={(e) => updateAgreement(index, { id: e.target.value })}
              />
            </label>
            <label>
              문서 제목
              <input
                required
                value={a.title}
                onChange={(e) =>
                  updateAgreement(index, { title: e.target.value })
                }
              />
            </label>
            <label>
              문서 버전
              <input
                required
                value={a.version}
                onChange={(e) =>
                  updateAgreement(index, { version: e.target.value })
                }
              />
            </label>
            <label>
              문서 본문
              <textarea
                required
                rows={5}
                maxLength={20000}
                value={a.body}
                onChange={(e) =>
                  updateAgreement(index, { body: e.target.value })
                }
              />
            </label>
            <label className="seller-checkbox">
              <input
                type="checkbox"
                checked={a.required}
                onChange={(e) =>
                  updateAgreement(index, { required: e.target.checked })
                }
              />
              필수 동의
            </label>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  agreements: value.agreements.filter((_, i) => i !== index),
                })
              }
            >
              문서 {index + 1} 제외
            </button>
          </section>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              agreements: [
                ...value.agreements,
                { id: '', title: '', version: '', body: '', required: false },
              ],
            })
          }
        >
          동의 문서 추가
        </button>
        {value.agreements.length === 0 && (
          <p>
            설정된 동의 문서가 없습니다. 필요한 문서가 있는지 운영 정책을 확인해
            주세요.
          </p>
        )}
      </div>
    </fieldset>
  )
}
