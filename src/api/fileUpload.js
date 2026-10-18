// 파일 필드명을 통일하고 브라우저의 multipart 처리를 유지합니다.
export function fileUploadBody(file) {
  const body = new FormData()
  body.append('file', file)
  return body
}
