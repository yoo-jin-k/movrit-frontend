/**
 * 공개 탐색·로그인·개인·업체·운영 화면의 경로와 중첩 레이아웃을 구성합니다.
 * 홈·탐색·로그인을 제외한 화면은 지연 로딩하고 공통 Suspense를 사용하며 토큰 진입 확인과 업체 승인 확인을 각각의 계층에 맡깁니다.
 */

import { lazy, Suspense } from 'react'
import MainHomeHeader from './components/buyer/MainHomeHeader'
import AdminAccess from './components/AdminAccess'
import CampaignListingPage from './features/discovery/CampaignListingPage'
import CampaignDetailPage from './features/discovery/CampaignDetailPage'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BuyerHomePage from './pages/BuyerHomePage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

// 첫 화면(홈·탐색·로그인)에 필요 없는 화면은 들어갈 때 내려받습니다(초기 다운로드 크기 감소).
// 이름으로 내보낸 화면은 lazyNamed로 감싸 같은 방식으로 불러옵니다.
const lazyNamed = (loader, name) =>
  lazy(() => loader().then((module) => ({ default: module[name] })))
const AdminCampaignParticipantsPage = lazy(
  () => import('./pages/AdminCampaignParticipantsPage'),
)
const AdminContentReviewsPage = lazy(
  () => import('./pages/AdminContentReviewsPage'),
)
const AdminModerationPage = lazy(() => import('./pages/AdminModerationPage'))
const AdminCommunityPage = lazy(() => import('./pages/AdminCommunityPage'))
const AdminParticipationPage = lazy(
  () => import('./pages/AdminParticipationPage'),
)
const BusinessShipping = lazy(
  () => import('./features/business/BusinessShipping'),
)
const BusinessPaybacks = lazy(
  () => import('./features/business/BusinessPaybacks'),
)
const AdminChannelVerificationsPage = lazy(
  () => import('./pages/AdminChannelVerificationsPage'),
)
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
const MyRegisteredContents = lazy(
  () => import('./features/membership/MyRegisteredContents'),
)
const AccountSettingsPage = lazy(
  () => import('./features/membership/AccountSettingsPage'),
)
const ChannelConnectCallbackPage = lazy(
  () => import('./features/membership/ChannelConnectCallbackPage'),
)
const MyCampaignsPage = lazy(
  () => import('./features/membership/MyCampaignsPage'),
)
const SpecialCampaignPage = lazy(
  () => import('./features/discovery/SpecialCampaignPage'),
)
const OfferwallPage = lazy(() => import('./features/discovery/OfferwallPage'))
const CommunityPage = lazy(() => import('./features/discovery/CommunityPage'))
const MyPage = lazy(() => import('./pages/MyPage'))
const SocialLinkCallbackPage = lazy(
  () => import('./pages/SocialLinkCallbackPage'),
)
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const AdminMessagesPage = lazy(() => import('./pages/AdminMessagesPage'))
const AdminCampaignsPage = lazy(() => import('./pages/AdminCampaignsPage'))
const BusinessMessages = lazy(
  () => import('./features/business/BusinessMessages'),
)
const InquiriesPage = lazy(() => import('./pages/InquiriesPage'))
const AdminInquiriesPage = lazy(() => import('./pages/AdminInquiriesPage'))
const SellerApplyPage = lazy(() => import('./pages/SellerApplyPage'))
const AdminSellerPage = lazy(() => import('./pages/AdminSellerPage'))
const BrandManagePage = lazy(() => import('./pages/BrandManagePage'))
const ProductManagePage = lazy(() => import('./pages/ProductManagePage'))
const PreorderManagePage = lazy(() => import('./pages/PreorderManagePage'))
const PreorderShopPage = lazy(() => import('./pages/PreorderShopPage'))
// 찜한 프리오더 화면(pages/FavoritePreordersPage)은 서버 API 준비 후 다시 연결합니다.
const FavoriteCampaignsPage = lazy(
  () => import('./pages/FavoriteCampaignsPage'),
)
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'))
const SellerOperationsPage = lazy(() => import('./pages/SellerOperationsPage'))
const CreatorPage = lazy(() => import('./pages/CreatorPage'))
const CreatorCollaborationPage = lazy(
  () => import('./pages/CreatorCollaborationPage'),
)
const CreatorApplyPage = lazy(() => import('./pages/CreatorApplyPage'))
const CreatorDashboardPage = lazy(() => import('./pages/CreatorDashboardPage'))
const SellerCollaborationPage = lazy(
  () => import('./pages/SellerCollaborationPage'),
)
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const loadBuyerV2Pages = () => import('./pages/BuyerV2Pages')
const BuyerAddressesPage = lazyNamed(loadBuyerV2Pages, 'BuyerAddressesPage')
const BuyerCheckoutPage = lazyNamed(loadBuyerV2Pages, 'BuyerCheckoutPage')
const BuyerNotificationSettingsPage = lazyNamed(
  loadBuyerV2Pages,
  'BuyerNotificationSettingsPage',
)
const BuyerOrderCompletePage = lazyNamed(
  loadBuyerV2Pages,
  'BuyerOrderCompletePage',
)
const BuyerOrderDetailPage = lazyNamed(loadBuyerV2Pages, 'BuyerOrderDetailPage')
const BuyerPaymentsPage = lazyNamed(loadBuyerV2Pages, 'BuyerPaymentsPage')
const BuyerPreorderStatePage = lazyNamed(
  loadBuyerV2Pages,
  'BuyerPreorderStatePage',
)
const BuyerProfileEditPage = lazyNamed(loadBuyerV2Pages, 'BuyerProfileEditPage')
const loadAdminPages = () => import('./pages/AdminPages')
const AdminCollaborationsPage = lazyNamed(
  loadAdminPages,
  'AdminCollaborationsPage',
)
const AdminContentPage = lazyNamed(loadAdminPages, 'AdminContentPage')
const AdminCreatorDetailPage = lazyNamed(
  loadAdminPages,
  'AdminCreatorDetailPage',
)
const AdminCreatorsPage = lazyNamed(loadAdminPages, 'AdminCreatorsPage')
const AdminMemberDetailPage = lazyNamed(loadAdminPages, 'AdminMemberDetailPage')
const AdminMembersPage = lazyNamed(loadAdminPages, 'AdminMembersPage')
const AdminPreorderDetailPage = lazyNamed(
  loadAdminPages,
  'AdminPreorderDetailPage',
)
const AdminPreordersPage = lazyNamed(loadAdminPages, 'AdminPreordersPage')
const AdminRefundDetailPage = lazyNamed(loadAdminPages, 'AdminRefundDetailPage')
const AdminRefundsPage = lazyNamed(loadAdminPages, 'AdminRefundsPage')
const AdminReportsPage = lazyNamed(loadAdminPages, 'AdminReportsPage')
const AdminSellerDetailPage = lazyNamed(loadAdminPages, 'AdminSellerDetailPage')
const AdminSettingsPage = lazyNamed(loadAdminPages, 'AdminSettingsPage')
const AdminSettlementsPage = lazyNamed(loadAdminPages, 'AdminSettlementsPage')
const loadCommonPages = () => import('./pages/CommonPages')
const NoticeDetailPage = lazyNamed(loadCommonPages, 'NoticeDetailPage')
const NoticesPage = lazyNamed(loadCommonPages, 'NoticesPage')
const NotFoundPage = lazyNamed(loadCommonPages, 'NotFoundPage')
const RoleSwitchPage = lazyNamed(loadCommonPages, 'RoleSwitchPage')
const SecurityPage = lazyNamed(loadCommonPages, 'SecurityPage')
const TermsPage = lazyNamed(loadCommonPages, 'TermsPage')
const WithdrawalPage = lazyNamed(loadCommonPages, 'WithdrawalPage')

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
            path="/mypage/contents"
            element={
              <ProtectedPage>
                <MyRegisteredContents />
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
          {/* SNS 채널 연결(인스타그램·유튜브·네이버 블로그) 로그인 후 돌아오는 주소입니다. */}
          <Route
            path="/channel-connect/callback/:provider"
            element={
              <ProtectedPage>
                <ChannelConnectCallbackPage />
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
          {/* 찜 목록: 기본은 캠페인 찜이며, 기존 프리오더 찜 화면은 하위 경로로 유지합니다. */}
          <Route
            path="/favorites"
            element={
              <ProtectedPage>
                <FavoriteCampaignsPage />
              </ProtectedPage>
            }
          />
          {/* 찜한 프리오더는 서버 API가 준비될 때까지 숨기고, 예전 주소로 들어오면 찜한 캠페인으로 보냅니다. */}
          <Route
            path="/favorites/preorders"
            element={<Navigate to="/favorites" replace />}
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
          {/* 참여자 메시지(브랜드 대화·운영자 문의) */}
          <Route
            path="/messages"
            element={
              <ProtectedPage>
                <MessagesPage />
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
            <Route path="paybacks" element={<BusinessPaybacks />} />
            <Route path="shipping" element={<BusinessShipping />} />
            <Route path="contents" element={<BusinessContents />} />
            <Route path="inbox" element={<BusinessInbox />} />
            <Route path="messages" element={<BusinessMessages />} />
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
            path="/admin/content-reviews"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminContentReviewsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/campaigns"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminCampaignsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminMessagesPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/community"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminCommunityPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminModerationPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/participation"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminParticipationPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
          <Route
            path="/admin/channel-verifications"
            element={
              <ProtectedPage>
                <AdminAccess>
                  <AdminChannelVerificationsPage />
                </AdminAccess>
              </ProtectedPage>
            }
          />
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
