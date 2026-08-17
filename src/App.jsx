import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'
import MyPage from './pages/MyPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import SellerApplyPage from './pages/SellerApplyPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

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
        </Routes>
      </BrowserRouter>
  )
}

export default App
