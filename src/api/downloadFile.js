/**
 * 서버가 만든 파일(엑셀 등)을 받아 브라우저 저장 창을 엽니다.
 * 파일 이름은 서버의 Content-Disposition(filename*=UTF-8'')을 쓰고, 없으면 fallbackName을 씁니다.
 */
import api from './axios'

export function fileNameFrom(header, fallbackName) {
  const encoded = (header || '').match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (!encoded) return fallbackName
  try {
    return decodeURIComponent(encoded)
  } catch {
    return fallbackName
  }
}

export async function downloadFile(path, { params, fallbackName }) {
  const response = await api.get(path, {
    params,
    responseType: 'blob',
    timeout: 60000,
  })
  const name = fileNameFrom(
    response.headers?.['content-disposition'],
    fallbackName,
  )
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return name
}
