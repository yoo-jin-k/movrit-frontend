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
import {
  BuyerAddressesPage, BuyerCheckoutPage, BuyerNotificationSettingsPage, BuyerOrderCompletePage,
  BuyerOrderDetailPage, BuyerPaymentsPage, BuyerPreorderStatePage, BuyerProfileEditPage,
} from './pages/BuyerV2Pages'
import {
  AdminCollaborationsPage, AdminContentPage, AdminCreatorDetailPage, AdminCreatorsPage,
  AdminMemberDetailPage, AdminMembersPage, AdminPreorderDetailPage, AdminPreordersPage,
  AdminRefundDetailPage, AdminRefundsPage, AdminReportsPage, AdminSellerDetailPage,
  AdminSettingsPage, AdminSettlementsPage,
} from './pages/AdminPages'
import {
  NoticeDetailPage,
  NoticesPage,
  NotFoundPage,
  RoleSwitchPage,
  SecurityPage,
  TermsPage,
  WithdrawalPage,
} from './pages/CommonPages'

function RootRedirect() {
  return <Navigate to="/home" replace />
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
        <Route path="/home" element={<BuyerHomePage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
        <Route path="/support" element={<ProtectedPage><InquiriesPage /></ProtectedPage>} />
        <Route path="/roles" element={<ProtectedPage><RoleSwitchPage /></ProtectedPage>} />
        <Route path="/settings/security" element={<ProtectedPage><SecurityPage /></ProtectedPage>} />
        <Route path="/settings/terms" element={<ProtectedPage><TermsPage /></ProtectedPage>} />
        <Route path="/settings/withdraw" element={<ProtectedPage><WithdrawalPage /></ProtectedPage>} />
        <Route path="/preorders" element={<ProtectedPage><PreorderShopPage /></ProtectedPage>} />
        <Route path="/preorders/:preorderId" element={<ProtectedPage><PreorderShopPage /></ProtectedPage>} />
        <Route path="/favorites" element={<ProtectedPage><FavoritePreordersPage /></ProtectedPage>} />
        <Route path="/mypage" element={<ProtectedPage><MyPage /></ProtectedPage>} />
        <Route path="/orders" element={<ProtectedPage><MyOrdersPage /></ProtectedPage>} />
        <Route path="/orders/complete" element={<ProtectedPage><BuyerOrderCompletePage /></ProtectedPage>} />
        <Route path="/orders/:orderId" element={<ProtectedPage><BuyerOrderDetailPage /></ProtectedPage>} />
        <Route path="/checkout/:preorderId" element={<ProtectedPage><BuyerCheckoutPage /></ProtectedPage>} />
        <Route path="/mypage/profile" element={<ProtectedPage><BuyerProfileEditPage /></ProtectedPage>} />
        <Route path="/mypage/addresses" element={<ProtectedPage><BuyerAddressesPage /></ProtectedPage>} />
        <Route path="/mypage/payments" element={<ProtectedPage><BuyerPaymentsPage /></ProtectedPage>} />
        <Route path="/mypage/notifications" element={<ProtectedPage><BuyerNotificationSettingsPage /></ProtectedPage>} />
        <Route path="/preorders/status/:state" element={<ProtectedPage><BuyerPreorderStatePage /></ProtectedPage>} />
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
        <Route path="/admin/sellers/:id" element={<ProtectedPage><AdminSellerDetailPage /></ProtectedPage>} />
        <Route path="/admin/dashboard" element={<ProtectedPage><AdminDashboardPage /></ProtectedPage>} />
        <Route path="/admin/members" element={<ProtectedPage><AdminMembersPage /></ProtectedPage>} />
        <Route path="/admin/members/:id" element={<ProtectedPage><AdminMemberDetailPage /></ProtectedPage>} />
        <Route path="/admin/creators" element={<ProtectedPage><AdminCreatorsPage /></ProtectedPage>} />
        <Route path="/admin/creators/:id" element={<ProtectedPage><AdminCreatorDetailPage /></ProtectedPage>} />
        <Route path="/admin/preorders" element={<ProtectedPage><AdminPreordersPage /></ProtectedPage>} />
        <Route path="/admin/preorders/:id" element={<ProtectedPage><AdminPreorderDetailPage /></ProtectedPage>} />
        <Route path="/admin/refunds" element={<ProtectedPage><AdminRefundsPage /></ProtectedPage>} />
        <Route path="/admin/refunds/:id" element={<ProtectedPage><AdminRefundDetailPage /></ProtectedPage>} />
        <Route path="/admin/collaborations" element={<ProtectedPage><AdminCollaborationsPage /></ProtectedPage>} />
        <Route path="/admin/settlements" element={<ProtectedPage><AdminSettlementsPage /></ProtectedPage>} />
        <Route path="/admin/content" element={<ProtectedPage><AdminContentPage /></ProtectedPage>} />
        <Route path="/admin/inquiries" element={<ProtectedPage><AdminInquiriesPage /></ProtectedPage>} />
        <Route path="/admin/reports" element={<ProtectedPage><AdminReportsPage /></ProtectedPage>} />
        <Route path="/admin/settings" element={<ProtectedPage><AdminSettingsPage /></ProtectedPage>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
