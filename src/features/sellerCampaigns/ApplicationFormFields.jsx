export default function ApplicationFormFields({
  value,
  onChange,
  disabled = false,
}) {
  const updateQuestion = (index, patch) =>
    onChange({
      ...value,
      questions: value.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    })
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
      <div className="seller-form-full">
        <h4>참여 방식</h4>
        {['DELIVERY', 'VISIT'].map((type) => (
          <label className="seller-checkbox" key={type}>
            <input
              type="checkbox"
              checked={value.allowedFulfillmentTypes.includes(type)}
              onChange={(e) =>
                onChange({
                  ...value,
                  allowedFulfillmentTypes: e.target.checked
                    ? [...value.allowedFulfillmentTypes, type]
                    : value.allowedFulfillmentTypes.filter((v) => v !== type),
                })
              }
            />
            {type === 'DELIVERY' ? '배송형' : '방문형'}
          </label>
        ))}
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
