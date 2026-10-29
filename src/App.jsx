/**
 * 공개 탐색·로그인·개인·업체·운영 화면의 경로와 중첩 레이아웃을 구성합니다.
 * 업체 화면은 지연 로딩하고 공통 Suspense를 사용하며 토큰 진입 확인과 업체 승인 확인을 각각의 계층에 맡깁니다.
 */
import AccountSettingsPage from './features/membership/AccountSettingsPage'

import { lazy, Suspense } from 'react'
import MainHomeHeader from './components/buyer/MainHomeHeader'
import AdminAccess from './components/AdminAccess'
import MyCampaignsPage from './features/membership/MyCampaignsPage'
const AdminCampaignParticipantsPage = lazy(
  () => import('./pages/AdminCampaignParticipantsPage'),
)
import CampaignListingPage from './features/discovery/CampaignListingPage'
import CampaignDetailPage from './features/discovery/CampaignDetailPage'
import SpecialCampaignPage from './features/discovery/SpecialCampaignPage'
import OfferwallPage from './features/discovery/OfferwallPage'
import CommunityPage from './features/discovery/CommunityPage'
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
const BusinessShell = lazy(() => import('./features/business/BusinessShell'))
const BusinessHome = lazy(() => import('./features/business/BusinessHome'))
const BusinessCampaigns = lazy(() =>
  import('./features/business/BusinessCampaigns').then((module) => ({
    default: module.BusinessCampaigns,
  })),
)
const BusinessCampaignEditor = lazy(() =>
  import('./features/business/BusinessCampaigns').then((module) => ({
    default: module.BusinessCampaignEditor,
  })),
)
const BusinessParticipants = lazy(
  () => import('./features/business/BusinessParticipants'),
)
const BusinessContents = lazy(
  () => import('./features/business/BusinessContents'),
)
const BusinessInbox = lazy(() => import('./features/business/BusinessInbox'))
const BusinessSettings = lazy(
  () => import('./features/business/BusinessSettings'),
)
import ProtectedRoute from './components/ProtectedRoute'
import {
  BuyerAddressesPage,
  BuyerCheckoutPage,
  BuyerNotificationSettingsPage,
  BuyerOrderCompletePage,
  BuyerOrderDetailPage,
  BuyerPaymentsPage,
  BuyerPreorderStatePage,
  BuyerProfileEditPage,
} from './pages/BuyerV2Pages'
import {
  AdminCollaborationsPage,
  AdminContentPage,
  AdminCreatorDetailPage,
  AdminCreatorsPage,
  AdminMemberDetailPage,
  AdminMembersPage,
  AdminPreorderDetailPage,
  AdminPreordersPage,
  AdminRefundDetailPage,
  AdminRefundsPage,
  AdminReportsPage,
  AdminSellerDetailPage,
  AdminSettingsPage,
  AdminSettlementsPage,
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

/** 독립 본문 화면에도 공통 헤더를 제공하며 기존 인증 경계는 유지합니다. */
function UserPage({ children }) {
  return (
    <>
      <MainHomeHeader />
      {children}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p role="status">화면을 불러오고 있습니다.</p>}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/mypage/campaigns"
            element={
              <ProtectedPage>
                <MyCampaignsPage />
              </ProtectedPage>
            }
          />
          <Route path="/password/forgot" element={<ForgotPasswordPage />} />
          <Route path="/password/reset" element={<ResetPasswordPage />} />
          <Route
            path="/oauth/callback"
            element={
              <UserPage>
                <OAuthCallbackPage />
              </UserPage>
            }
          />
          <Route
            path="/social-link/callback"
            element={
              <UserPage>
                <SocialLinkCallbackPage />
              </UserPage>
            }
          />
          <Route path="/home" element={<BuyerHomePage />} />
          <Route path="/category/:section" element={<CampaignListingPage />} />
          <Route path="/search" element={<CampaignListingPage search />} />
          <Route
            path="/campaign/:campaignId"
            element={<CampaignDetailPage />}
          />
          <Route path="/special/:kind" element={<SpecialCampaignPage />} />
          <Route path="/offerwall" element={<OfferwallPage />} />
          <Route path="/offerwall/:shop" element={<OfferwallPage />} />
          <Route path="/community/:board" element={<CommunityPage />} />
          <Route path="/community/:board/:postId" element={<CommunityPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
          <Route
            path="/support"
            element={
              <ProtectedPage>
                <InquiriesPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedPage>
                <RoleSwitchPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedPage>
                <AccountSettingsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/settings/security"
            element={
              <ProtectedPage>
                <SecurityPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/settings/terms"
            element={
              <ProtectedPage>
                <TermsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/settings/withdraw"
            element={
              <ProtectedPage>
                <WithdrawalPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/preorders"
            element={
              <ProtectedPage>
                <PreorderShopPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/preorders/:preorderId"
            element={
              <ProtectedPage>
                <PreorderShopPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedPage>
                <FavoritePreordersPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/mypage"
            element={
              <ProtectedPage>
                <MyPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedPage>
                <MyOrdersPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/orders/complete"
            element={
              <ProtectedPage>
                <BuyerOrderCompletePage />
              </ProtectedPage>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedPage>
                <BuyerOrderDetailPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/checkout/:preorderId"
            element={
              <ProtectedPage>
                <BuyerCheckoutPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/mypage/profile"
            element={
              <ProtectedPage>
                <BuyerProfileEditPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/mypage/addresses"
            element={
              <ProtectedPage>
                <BuyerAddressesPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/mypage/payments"
            element={
              <ProtectedPage>
                <BuyerPaymentsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/mypage/notifications"
            element={
              <ProtectedPage>
                <BuyerNotificationSettingsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/preorders/status/:state"
            element={
              <ProtectedPage>
                <BuyerPreorderStatePage />
              </ProtectedPage>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedPage>
                <NotificationsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/inquiries"
            element={
              <ProtectedPage>
                <InquiriesPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/creator/apply"
            element={
              <ProtectedPage>
                <CreatorApplyPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/creator/dashboard"
            element={
              <ProtectedPage>
                <UserPage>
                  <CreatorDashboardPage />
                </UserPage>
              </ProtectedPage>
            }
          />
          <Route
            path="/creator/profile"
            element={
              <ProtectedPage>
                <CreatorPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/creator/collaborations"
            element={
              <ProtectedPage>
                <UserPage>
                  <CreatorCollaborationPage />
                </UserPage>
              </ProtectedPage>
            }
          />
          <Route
            path="/seller/apply"
            element={
              <ProtectedPage>
                <UserPage>
                  <SellerApplyPage />
                </UserPage>
              </ProtectedPage>
            }
          />
          <Route
            path="/seller"
            element={
              <ProtectedPage>
                <BusinessShell />
              </ProtectedPage>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BusinessHome />} />
            <Route path="campaigns" element={<BusinessCampaigns />} />
            <Route path="campaigns/new" element={<BusinessCampaignEditor />} />
            <Route
              path="campaigns/:campaignId"
              element={<BusinessCampaignEditor />}
            />
            <Route path="participants" element={<BusinessParticipants />} />
            <Route path="contents" element={<BusinessContents />} />
            <Route path="inbox" element={<BusinessInbox />} />
            <Route path="settings" element={<BusinessSettings />} />
            <Route path="brands" element={<BrandManagePage />} />
            <Route path="products" element={<ProductManagePage />} />
            <Route path="preorders" element={<PreorderManagePage />} />
            <Route path="operations" element={<SellerOperationsPage />} />
            <Route
              path="collaborations"
              element={<SellerCollaborationPage />}
            />
          </Route>
          <Route
            path="/admin/campaign-participants"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminCampaignParticipantsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/sellers"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminSellerPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/sellers/:id"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminSellerDetailPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminDashboardPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminMembersPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/members/:id"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminMemberDetailPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/creators"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminCreatorsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/creators/:id"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminCreatorDetailPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/preorders"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminPreordersPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/preorders/:id"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminPreorderDetailPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminRefundsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/refunds/:id"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminRefundDetailPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/collaborations"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminCollaborationsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/settlements"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminSettlementsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminContentPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/inquiries"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminInquiriesPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminReportsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminSettingsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
