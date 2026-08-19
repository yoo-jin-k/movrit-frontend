import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BuyerHomePage from './pages/BuyerHomePage'
import MyPage from './pages/MyPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import SocialLinkCallbackPage from './pages/SocialLinkCallbackPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotificationsPage from './pages/NotificationsPage'
import InquiriesPage from './pages/InquiriesPage'
import AdminInquiriesPage from './pages/AdminInquiriesPage'
import SellerApplyPage from './pages/SellerApplyPage'
import AdminSellerPage from './pages/AdminSellerPage'
import BrandManagePage from './pages/BrandManagePage'
import ProductManagePage from './pages/ProductManagePage'
import PreorderManagePage from './pages/PreorderManagePage'
import PreorderShopPage from './pages/PreorderShopPage'
import FavoritePreordersPage from './pages/FavoritePreordersPage'
import MyOrdersPage from './pages/MyOrdersPage'
import SellerOperationsPage from './pages/SellerOperationsPage'
import CreatorPage from './pages/CreatorPage'
import CreatorCollaborationPage from './pages/CreatorCollaborationPage'
import CreatorApplyPage from './pages/CreatorApplyPage'
import CreatorDashboardPage from './pages/CreatorDashboardPage'
import SellerCollaborationPage from './pages/SellerCollaborationPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import ProtectedRoute from './components/ProtectedRoute'

function RootRedirect() {
  const token = sessionStorage.getItem('accessToken')
  return token ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
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
        <Route path="/password/forgot" element={<ForgotPasswordPage />} />
        <Route path="/password/reset" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/social-link/callback" element={<SocialLinkCallbackPage />} />
        <Route path="/home" element={<ProtectedPage><BuyerHomePage /></ProtectedPage>} />
        <Route path="/preorders" element={<ProtectedPage><PreorderShopPage /></ProtectedPage>} />
        <Route path="/preorders/:preorderId" element={<ProtectedPage><PreorderShopPage /></ProtectedPage>} />
        <Route path="/favorites" element={<ProtectedPage><FavoritePreordersPage /></ProtectedPage>} />
        <Route path="/mypage" element={<ProtectedPage><MyPage /></ProtectedPage>} />
        <Route path="/orders" element={<ProtectedPage><MyOrdersPage /></ProtectedPage>} />
        <Route path="/notifications" element={<ProtectedPage><NotificationsPage /></ProtectedPage>} />
        <Route path="/inquiries" element={<ProtectedPage><InquiriesPage /></ProtectedPage>} />
        <Route path="/creator/apply" element={<ProtectedPage><CreatorApplyPage /></ProtectedPage>} />
        <Route path="/creator/dashboard" element={<ProtectedPage><CreatorDashboardPage /></ProtectedPage>} />
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
        <Route path="/admin/inquiries" element={<ProtectedPage><AdminInquiriesPage /></ProtectedPage>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
