import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import MyPage from './pages/MyPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import SocialLinkCallbackPage from './pages/SocialLinkCallbackPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import SellerApplyPage from './pages/SellerApplyPage'
import AdminSellerPage from './pages/AdminSellerPage'
import ProtectedRoute from './components/ProtectedRoute'

function RootRedirect() {
  const token = sessionStorage.getItem('accessToken')

  // 루트 주소로 직접 들어와도 로그인 토큰이 있으면 로그인 화면을 다시 보여주지 않는다.
  return token
      ? <Navigate to="/mypage" replace />
      : <Navigate to="/login" replace />
}

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/social-link/callback" element={<SocialLinkCallbackPage />} />

          <Route
              path="/mypage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
          />

          <Route
              path="/seller/apply"
              element={
                <ProtectedRoute>
                  <SellerApplyPage />
                </ProtectedRoute>
              }
          />

          <Route
              path="/admin/sellers"
              element={
                <ProtectedRoute>
                  <AdminSellerPage />
                </ProtectedRoute>
              }
          />
        </Routes>
      </BrowserRouter>
  )
}

export default App
