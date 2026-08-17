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
import BrandManagePage from './pages/BrandManagePage'
import ProductManagePage from './pages/ProductManagePage'
import PreorderManagePage from './pages/PreorderManagePage'
import ProtectedRoute from './components/ProtectedRoute'
import PreorderShopPage from './pages/PreorderShopPage'
import MyOrdersPage from './pages/MyOrdersPage'
import SellerOperationsPage from './pages/SellerOperationsPage'
import CreatorPage from './pages/CreatorPage'
import CreatorCollaborationPage from './pages/CreatorCollaborationPage'
import SellerCollaborationPage from './pages/SellerCollaborationPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import SellerDashboardPage from './pages/SellerDashboardPage'

function RootRedirect() {
  const token = sessionStorage.getItem('accessToken')
  return token
      ? <Navigate to="/mypage" replace />
      : <Navigate to="/login" replace />
}

function ProtectedPage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
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
          <Route path="/preorders" element={<ProtectedPage><PreorderShopPage /></ProtectedPage>} />
          <Route path="/preorders/:preorderId" element={<PreorderShopPage />} />

          <Route path="/mypage" element={<ProtectedPage><MyPage /></ProtectedPage>} />
          <Route path="/orders" element={<ProtectedPage><MyOrdersPage /></ProtectedPage>} />
          <Route path="/creator/profile" element={<ProtectedPage><CreatorPage /></ProtectedPage>} />
          <Route path="/creator/collaborations" element={<ProtectedPage><CreatorCollaborationPage /></ProtectedPage>} />
          <Route path="/seller/apply" element={<ProtectedPage><SellerApplyPage /></ProtectedPage>} />
          <Route path="/seller/dashboard" element={<ProtectedPage><SellerDashboardPage /></ProtectedPage>} />
          <Route path="/seller/brands" element={<ProtectedPage><BrandManagePage /></ProtectedPage>} />
          <Route path="/seller/products" element={<ProtectedPage><ProductManagePage /></ProtectedPage>} />
          <Route path="/seller/preorders" element={<ProtectedPage><PreorderManagePage /></ProtectedPage>} />
          <Route path="/seller/operations" element={<ProtectedPage><SellerOperationsPage /></ProtectedPage>} />
          <Route path="/seller/collaborations" element={<ProtectedPage><SellerCollaborationPage /></ProtectedPage>} />
          <Route path="/admin/sellers" element={<ProtectedPage><AdminSellerPage /></ProtectedPage>} />
          <Route path="/admin/dashboard" element={<ProtectedPage><AdminDashboardPage /></ProtectedPage>} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
