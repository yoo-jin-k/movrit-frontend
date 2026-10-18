/**
 * 브랜드·상품·캠페인 업로드에서 동일한 file 필드의 multipart 본문을 생성합니다.
 * 파일 검증·HTTP 헤더·요청 경로는 각 호출 API가 책임집니다.
 */
// 파일 필드명을 통일하고 브라우저의 multipart 처리를 유지합니다.
export function fileUploadBody(file) {
  const body = new FormData()
  body.append('file', file)
  return body
}
