import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MyPage from './pages/MyPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CreatorApplyPage from './pages/CreatorApplyPage'
import CreatorDashboardPage from './pages/CreatorDashboardPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creator/apply"
          element={
            <ProtectedRoute>
              <CreatorApplyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creator/dashboard"
          element={
            <ProtectedRoute>
              <CreatorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
