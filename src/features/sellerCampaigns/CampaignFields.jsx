/**
 * 기본 캠페인 정보와 모집 일정을 부모가 관리하는 입력값으로 표시합니다.
 * 생성/수정 여부와 disabled 상태를 전달받아 입력 가능 범위를 제한합니다.
 *
 * 운영 브랜드: 캠페인이 속할 브랜드입니다. 브랜드가 여러 개일 때만 선택이 필수입니다.
 * 함께 판매할 프리오더: 선택 항목입니다. 비워 두면 프리오더 없이 체험단만 운영합니다.
 * 수정 화면에서는 두 값을 바꿀 수 없습니다(신청·선정 기록의 소속이 바뀌지 않도록).
 */
export default function CampaignFields({
  value,
  onChange,
  brands = [],
  preorders,
  editing = false,
  disabled = false,
}) {
  const change = (name, next) => onChange({ ...value, [name]: next })
  // 브랜드를 바꾸면 다른 브랜드의 프리오더 선택은 비웁니다.
  const changeBrand = (next) =>
    onChange({ ...value, brandId: next, preorderId: '' })
  // 고른 브랜드의 프리오더만 보여줍니다. 브랜드를 아직 고르지 않았으면 전체를 보여줍니다.
  const brandPreorders = value.brandId
    ? preorders.filter((item) => String(item.brandId) === String(value.brandId))
    : preorders
  return (
    <>
      <fieldset className="seller-campaign-fields" disabled={disabled}>
        <legend>기본 정보</legend>
        {!editing && (
          <label>
            운영 브랜드
            <select
              required={brands.length > 1}
              value={value.brandId ?? ''}
              onChange={(e) => changeBrand(e.target.value)}
            >
              {brands.length !== 1 && <option value="">선택해 주세요</option>}
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          함께 판매할 프리오더 (선택)
          <select
            disabled={editing}
            value={value.preorderId ?? ''}
            onChange={(e) => change('preorderId', e.target.value)}
          >
            <option value="">
              {editing && !value.preorderId
                ? '연결된 프리오더 없음'
                : '연결하지 않음 (체험단만 운영)'}
            </option>
            {brandPreorders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          선정 방식
          <select
            required
            value={value.selectionMode || ''}
            onChange={(event) => change('selectionMode', event.target.value)}
          >
            <option value="" disabled>
              선정 방식 확인 필요
            </option>
            <option value="BRAND_DIRECT">브랜드 직접 선정</option>
            <option value="OPERATOR">운영자 선정</option>
          </select>
        </label>
        <p>
          브랜드 직접 선정은 업체가, 운영자 선정은 관리자가 참여자를 선정합니다.
          신청 이력이 생기면 선정 방식을 변경할 수 없습니다.
        </p>
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
