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
