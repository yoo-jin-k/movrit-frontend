/**
 * 업체·운영자가 참여 조건 없음 또는 지원되는 지표 조건을 선택하도록 합니다.
 * 지원 조건: 인스타그램 팔로워 수, 네이버 블로그 일평균 방문자(최근 4일 평균).
 * 지원하지 않는 기존 조건은 임의 변환하지 않고 입력 제한과 안내를 통해 구분합니다.
 */
import {
  REQUIREMENT_KINDS,
  emptyRequirement,
  requirementKind,
} from './requirementModel'
export default function RequirementFields({
  value,
  onChange,
  disabled = false,
  legend = '추가 참여 조건',
}) {
  const kindKey = requirementKind(value)
  const kind = REQUIREMENT_KINDS[kindKey]
  const supported = Boolean(kind)
  const chooseKind = (key) => {
    const next = REQUIREMENT_KINDS[key]
    onChange({
      ...value,
      channelType: next.channelType,
      metricType: next.metricType,
      measurementPeriod: next.measurementPeriod,
    })
  }
  return (
    <fieldset className="seller-campaign-requirement" disabled={disabled}>
      <legend>{legend}</legend>
      <label>
        조건 적용
        <select
          value={value.mode}
          onChange={(e) =>
            onChange({
              ...emptyRequirement(),
              mode: e.target.value,
              version: value.version,
              id: value.id,
            })
          }
        >
          <option value="NONE">추가 참여 조건 없음</option>
          <option value="CONDITION">조건 설정</option>
        </select>
      </label>
      {value.mode === 'CONDITION' && (
        <>
          {!supported && (
            <p role="alert">
              이 캠페인에 현재 화면에서 지원하지 않는 조건이 설정되어 있습니다.
              기존 조건은 보존됩니다. 변경하려면 조건 종류를 다시 선택해 주세요.
            </p>
          )}
          <label>
            조건 종류
            <select
              value={kindKey ?? 'UNSUPPORTED'}
              onChange={(e) => chooseKind(e.target.value)}
            >
              {!supported && (
                <option value="UNSUPPORTED" disabled>
                  {value.channelType} · {value.metricType}
                </option>
              )}
              {Object.entries(REQUIREMENT_KINDS).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            최소 수치{kind ? ` (${kind.unit})` : ''}
            <input
              type="number"
              min="0"
              step="1"
              required
              disabled={!supported}
              value={value.minimumValue}
              onChange={(e) =>
                onChange({ ...value, minimumValue: e.target.value })
              }
            />
          </label>
          {kind && <p>{kind.help}</p>}
        </>
      )}
      <p>
        이 캠페인에만 적용됩니다. 조건 없음으로 설정해도 로그인·이메일
        인증·모집기간·신청서 확인은 필요합니다.
      </p>
    </fieldset>
  )
}
