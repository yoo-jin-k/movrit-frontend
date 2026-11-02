// v1 쿠키 세션은 기존 JWT 클라이언트와 분리합니다. 토큰을 저장소나 URL에 기록하지 않습니다.
export class ExperienceApiError extends Error {
  constructor(
    message,
    {
      status = 0,
      code = 'NETWORK_ERROR',
      requestId = null,
      fieldErrors = [],
      retryable = false,
    } = {},
  ) {
    super(message)
    this.name = 'ExperienceApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
    this.fieldErrors = fieldErrors
    this.retryable = retryable
  }
}

export function createExperienceClient(fetcher = (...args) => fetch(...args)) {
  let csrfToken = null
  let csrfRequest = null

  // 실패 응답을 예시 데이터나 성공으로 바꾸지 않고 화면에서 처리할 오류로 전달합니다.
  async function request(path, { method = 'GET', body, signal, idempotencyKey } = {}) {
    if (!path.startsWith('/') || path.startsWith('//'))
      throw new Error('내부 API 경로가 필요합니다.')
    const headers = { Accept: 'application/json' }
    const writing = !['GET', 'HEAD'].includes(method)
    if (writing) {
      if (!csrfToken) await ensureCsrf()
      headers['X-CSRF-Token'] = csrfToken
      headers['Content-Type'] = 'application/json'
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
    }
    let response
    try {
      response = await fetcher(`/api/v1${path}`, {
        method,
        headers,
        credentials: 'same-origin',
        signal,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch (error) {
      if (error.name === 'AbortError') throw error
      throw new ExperienceApiError(
        writing
          ? '연결이 끊겼습니다. 처리 결과를 확인한 후 다시 시도해 주세요.'
          : '연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
    if (response.status === 204) return { data: null, meta: null }
    let payload
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    if (!response.ok) {
      if (response.status === 401 || payload?.error?.code === 'CSRF_INVALID') csrfToken = null
      throw new ExperienceApiError(payload?.error?.message || '요청을 처리하지 못했습니다.', {
        status: response.status,
        code: payload?.error?.code || 'HTTP_ERROR',
        requestId: payload?.meta?.requestId || null,
        fieldErrors: payload?.error?.fieldErrors || [],
        retryable: payload?.error?.retryable === true,
      })
    }
    if (!payload || !Object.hasOwn(payload, 'data')) {
      throw new ExperienceApiError('응답 형식을 확인하지 못했습니다.', {
        status: response.status,
        code: 'INVALID_RESPONSE',
      })
    }
    if (payload.data?.csrfToken) csrfToken = payload.data.csrfToken
    return payload
  }

  // 여러 쓰기가 동시에 시작되어도 익명 CSRF 세션은 한 번만 발급받습니다.
  async function ensureCsrf() {
    if (csrfToken) return csrfToken
    if (!csrfRequest)
      csrfRequest = request('/auth/csrf')
        .then(({ data }) => {
          if (!data?.csrfToken)
            throw new ExperienceApiError('요청 보안 정보를 확인하지 못했습니다.', {
              code: 'INVALID_RESPONSE',
            })
          return data.csrfToken
        })
        .finally(() => {
          csrfRequest = null
        })
    return csrfRequest
  }

  // 쓰기 실패 후 자동 재전송하지 않습니다. 동일 작업 재시도 시 호출자가 같은 멱등 키를 유지합니다.
  return {
    request,
    ensureCsrf,
    clearSession: () => {
      csrfToken = null
    },
  }
}

export const experienceClient = createExperienceClient()
