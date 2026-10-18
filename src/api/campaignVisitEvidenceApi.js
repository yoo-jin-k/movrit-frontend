/**
 * 인증된 신청 당시 주소와 업체용 주소 변경 이력을 조회하는 클라이언트를 생성합니다.
 * available=false는 과거 기록 없음으로 유지하며 현재 주소를 대신 끼워 넣지 않습니다.
 * 접근 권한 판정은 서버가 수행하고 HTTP 실패는 기록 없음과 구분하여 전달합니다.
 */
export function createCampaignVisitEvidenceApi({
  authenticated,
  enabled = false,
}) {
  function pathId(id) {
    if (!enabled) throw new Error('주소 기록 조회를 준비 중입니다.')
    if (!/^[1-9]\d*$/.test(String(id)))
      throw new Error('조회할 내역을 확인해 주세요.')
    return encodeURIComponent(id)
  }
  return {
    // 미기록 응답은 available=false만 반환하여 부가 필드를 현재 주소로 오해하지 않게 합니다.
    async snapshot(applicationId, signal) {
      const { data } = await authenticated.get(
        `/campaign-applications/${pathId(applicationId)}/visit-snapshot`,
        { signal, timeout: 15000 },
      )
      if (!data || typeof data.available !== 'boolean')
        throw new Error('신청 당시 주소 응답을 확인할 수 없습니다.')
      if (!data.available) return { available: false }
      if (
        !Number.isSafeInteger(data.presentationVersion) ||
        data.presentationVersion < 0
      )
        throw new Error('주소 기록 버전을 확인할 수 없습니다.')
      return data
    },
    // 배열과 이력 식별자·버전 형식을 확인한 뒤 서버가 제공한 변경 순서를 그대로 전달합니다.
    async history(campaignId, signal) {
      const { data } = await authenticated.get(
        `/campaigns/${pathId(campaignId)}/visit-history`,
        { signal, timeout: 15000 },
      )
      if (
        !Array.isArray(data) ||
        data.some(
          (item) =>
            !item ||
            !Number.isSafeInteger(item.id) ||
            !Number.isSafeInteger(item.presentationVersion),
        )
      )
        throw new Error('주소 변경 이력을 확인할 수 없습니다.')
      return data
    },
  }
}
