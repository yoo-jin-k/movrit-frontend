import { emptyRequirement } from './requirementModel'
export default function RequirementFields({
  value,
  onChange,
  disabled = false,
}) {
  const supported =
    value.channelType === 'INSTAGRAM' &&
    value.metricType === 'FOLLOWER_COUNT' &&
    !value.measurementPeriod
  return (
    <fieldset className="seller-campaign-requirement" disabled={disabled}>
      <legend>추가 참여 조건</legend>
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
              기존 조건은 보존됩니다. 변경하려면 조건 적용을 다시 선택해 주세요.
            </p>
          )}
          <label>
            지원 채널
            <select
              value={value.channelType}
              disabled={!supported}
              onChange={(e) =>
                onChange({ ...value, channelType: e.target.value })
              }
            >
              {!supported && (
                <option value={value.channelType}>{value.channelType}</option>
              )}
              <option value="INSTAGRAM">인스타그램</option>
            </select>
          </label>
          <label>
            지표
            <select
              value={value.metricType}
              disabled={!supported}
              onChange={(e) =>
                onChange({ ...value, metricType: e.target.value })
              }
            >
              {!supported && (
                <option value={value.metricType}>{value.metricType}</option>
              )}
              <option value="FOLLOWER_COUNT">팔로워 수</option>
            </select>
          </label>
          <label>
            최소 수치
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
        </>
      )}
      <p>
        이 캠페인에만 적용됩니다. 조건 없음으로 설정해도 로그인·이메일
        인증·모집기간·신청서 확인은 필요합니다.
      </p>
      <p>네이버 방문자 지표와 등급 조건은 정책 확정 후 지원합니다.</p>
    </fieldset>
  )
}
