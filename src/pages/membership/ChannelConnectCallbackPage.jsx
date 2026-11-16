/**
 * SNS 로그인 후 돌아오는 화면입니다(/channel-connect/callback/:provider).
 * 주소의 code·state를 서버에 넘겨 연결을 마치고, 결과를 설정 화면의 'SNS 채널 연결' 영역에 안내합니다.
 * 같은 code를 두 번 보내지 않도록 한 번만 실행합니다(개발 모드의 이중 실행 포함).
 */
import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { completeChannelConnection } from '../../api/channelConnectApi'
import {
  CHANNEL_PROVIDERS,
  channelErrorMessage,
  isChannelProvider,
} from '../../features/membership/channelConnectModel'

export default function ChannelConnectCallbackPage() {
  const { provider } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const started = useRef(false)
  // 모르는 서비스 이름이면 서버에 요청하지 않고 안내만 보여줍니다.
  const invalid = !isChannelProvider(provider)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const code = params.get('code')
    const state = params.get('state')
    const label = CHANNEL_PROVIDERS[provider]?.label || 'SNS'
    const finish = (notice) =>
      navigate('/settings#channel-connect', {
        replace: true,
        state: { channelNotice: notice },
      })
    if (invalid) return
    // 사용자가 SNS 동의 화면에서 취소하면 code 대신 error가 돌아옵니다.
    if (params.get('error') || !code || !state) {
      finish({ ok: false, text: `${label} 연결이 취소되었습니다.` })
      return
    }
    completeChannelConnection(provider, code, state)
      .then(() => finish({ ok: true, text: `${label} 계정이 연결되었습니다.` }))
      .catch((failure) =>
        finish({
          ok: false,
          text: channelErrorMessage(
            failure,
            `${label} 연결을 마치지 못했습니다. 다시 시도해 주세요.`,
          ),
        }),
      )
  }, [invalid, navigate, params, provider])

  return (
    <main className="account-settings">
      {invalid ? (
        <p role="alert">
          지원하지 않는 채널입니다.{' '}
          <Link to="/settings#channel-connect">설정으로 돌아가기</Link>
        </p>
      ) : (
        <p role="status">
          채널 연결을 마무리하고 있습니다. 잠시만 기다려 주세요.
        </p>
      )}
    </main>
  )
}
