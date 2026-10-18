/**
 * 캠페인 이미지 자산의 업로드·소유자 미리보기·관리 조회와 공개 조회를 분리합니다.
 * 비활성 클라이언트는 요청 전에 중단하며, 활성 클라이언트도 자산 식별자와 응답 형식을 검사합니다.
 * 업로드 실패를 성공으로 바꾸지 않고 호출한 편집기가 재조회 여부를 결정하도록 오류를 전달합니다.
 */
import { fileUploadBody } from './fileUpload.js'
import {
  requireAssetId,
  validateManagedPresentation,
} from '../features/sellerCampaigns/campaignMediaContract.js'
import { validateCampaignImageFile } from '../features/sellerCampaigns/campaignMediaValidation.js'

// 서버·DB 반영 확인 전에는 활성화하지 않습니다. 클라이언트 생성만으로 요청하지 않습니다.
// authenticated는 기존 인증 Axios, publicClient는 인증 갱신 없는 공개 Axios입니다.
export function createCampaignMediaApi({
  authenticated,
  publicClient,
  enabled = false,
}) {
  function ready() {
    if (!enabled) throw new Error('이미지 저장 기능을 준비 중입니다.')
  }
  function campaignPath(id) {
    if (!/^\d+$/.test(String(id)) || Number(id) < 1)
      throw new Error('캠페인을 확인해 주세요.')
    return `/campaigns/${encodeURIComponent(id)}/presentation`
  }
  return {
    // 파일의 빠른 형식 검사를 통과한 경우에만 전송하고 미연결 자산 응답을 확인합니다.
    // 업로드 성공은 캠페인에 이미지 연결까지 저장됐다는 뜻이 아닙니다.
    async upload(file, signal) {
      ready()
      validateCampaignImageFile(file)
      const body = fileUploadBody(file)
      const response = await authenticated.post(
        '/campaign-image-assets',
        body,
        { signal, timeout: 30000, headers: { 'Content-Type': undefined } },
      )
      const data = response.data
      requireAssetId(data?.assetId)
      if (
        response.status !== 201 ||
        data.state !== 'READY_UNATTACHED' ||
        data.publicUrl !== null
      )
        throw new Error(
          '이미지 업로드 결과를 확인할 수 없습니다. 자동 재시도하지 마세요.',
        )
      return data
    },
    // 소유자 인증 요청으로 받은 이미지 blob만 반환합니다. 표시용 객체 URL 생성과 해제는 화면이 담당합니다.
    async preview(assetId, signal) {
      ready()
      const id = requireAssetId(assetId)
      // 응답 previewPath를 임의로 따라가지 않고 동일 출처의 확정 경로만 사용합니다.
      const response = await authenticated.get(
        `/campaign-image-assets/${id}/preview`,
        { signal, responseType: 'blob', timeout: 15000 },
      )
      if (
        !(response.data instanceof Blob) ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(response.data.type)
      )
        throw new Error('이미지 미리보기를 불러오지 못했습니다.')
      return response.data
    },
    async manage(campaignId, signal) {
      ready()
      return validateManagedPresentation(
        (
          await authenticated.get(`${campaignPath(campaignId)}/manage`, {
            signal,
            timeout: 15000,
          })
        ).data,
      )
    },
    async publicPresentation(campaignId, signal) {
      ready()
      const { data } = await publicClient.get(
        `${campaignPath(campaignId)}/public`,
        { signal, timeout: 15000 },
      )
      if (!data || !Array.isArray(data.detailImages))
        throw new Error('캠페인 이미지를 확인할 수 없습니다.')
      return data
    },
  }
}
