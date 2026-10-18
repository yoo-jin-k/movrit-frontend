/**
 * 공통 SCSS를 불러오고 React 루트에 앱을 연결합니다.
 * StrictMode를 사용하므로 개발 환경에서 효과의 정리와 재실행을 고려해야 합니다.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.scss'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
