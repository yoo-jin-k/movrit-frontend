export default function CampaignFields({
  value,
  onChange,
  preorders,
  editing = false,
  disabled = false,
}) {
  const change = (name, next) => onChange({ ...value, [name]: next })
  return (
    <>
      <fieldset className="seller-campaign-fields" disabled={disabled}>
        <legend>기본 정보</legend>
        <label>
          프리오더
          <select
            required
            disabled={editing}
            value={value.preorderId}
            onChange={(e) => change('preorderId', e.target.value)}
          >
            <option value="">선택해 주세요</option>
            {preorders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          모집 제목
          <input
            required
            value={value.title}
            onChange={(e) => change('title', e.target.value)}
          />
        </label>
        <label>
          설명
          <textarea
            rows={3}
            value={value.description || ''}
            onChange={(e) => change('description', e.target.value)}
          />
        </label>
        <label>
          카테고리
          <input
            value={value.category || ''}
            onChange={(e) => change('category', e.target.value)}
          />
        </label>
        <label>
          제공 내역
          <input
            value={value.rewardDescription || ''}
            onChange={(e) => change('rewardDescription', e.target.value)}
          />
        </label>
      </fieldset>
      <fieldset className="seller-campaign-fields" disabled={disabled}>
        <legend>모집 일정과 인원</legend>
        <p>
          모든 일정은 한국 시간(KST) 기준입니다. 선정과 참여 수락은 별도
          단계입니다.
        </p>
        <label>
          모집 인원
          <input
            required
            type="number"
            min="1"
            step="1"
            value={value.recruitmentCount}
            onChange={(e) => change('recruitmentCount', e.target.value)}
          />
        </label>
        <label>
          모집 시작 (한국시간)
          <input
            required
            type="datetime-local"
            value={value.startAt}
            onChange={(e) => change('startAt', e.target.value)}
          />
        </label>
        <label>
          모집 종료 (한국시간)
          <input
            required
            type="datetime-local"
            value={value.endAt}
            onChange={(e) => change('endAt', e.target.value)}
          />
        </label>
      </fieldset>
    </>
  )
}
