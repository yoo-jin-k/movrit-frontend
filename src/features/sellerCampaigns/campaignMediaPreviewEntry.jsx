/**
 * 독립 미디어 검수 HTML의 root에 입력 미리보기 컴포넌트를 연결합니다.
 * 실제 앱 라우트나 저장 API를 시작하지 않습니다.
 */
import { createRoot } from 'react-dom/client'
import CampaignMediaPreview from './CampaignMediaPreview'
createRoot(document.getElementById('root')).render(<CampaignMediaPreview />)
