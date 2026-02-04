import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { GuestOnly } from '../auth/GuestOnly';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { VendorApprovalGuard } from '../auth/components/VendorApprovalGuard';
import { AuthLayout } from '../auth/components/AuthLayout';
import { ROUTES } from '../config/constants';

// Auth pages (login, registration) – in auth folder
import { LoginPage, RegisterPage, ForgotPasswordPage } from '../auth/pages';

// Admin pages – from pages/admin folder
import {
  AdminDashboardPage,
  OwnerOverviewPage,
  VendorsPage as AdminVendorsPage,
  BranchesPage as AdminBranchesPage,
  SalesPage as AdminSalesPage,
  MembershipsPage as AdminMembershipsPage,
  MembershipDetailPage as AdminMembershipDetailPage,
  CustomersPage as AdminCustomersPage,
  SearchPage as AdminSearchPage,
  LeadsPage as AdminLeadsPage,
  LeadDetailPage as AdminLeadDetailPage,
  AppointmentsPage as AdminAppointmentsPage,
  SettlementsPage as AdminSettlementsPage,
  SettingsPage as AdminSettingsPage,
  AdminProfilePage,
  LoyaltyPage as AdminLoyaltyPage,
} from '../pages/admin';

// Vendor pages – from pages/vendor folder
import {
  VendorDashboardPage,
  BranchesPage as VendorBranchesPage,
  SalesPage as VendorSalesPage,
  MembershipsPage as VendorMembershipsPage,
  MembershipDetailPage as VendorMembershipDetailPage,
  CustomersPage as VendorCustomersPage,
  SearchPage as VendorSearchPage,
  LeadsPage as VendorLeadsPage,
  LeadDetailPage as VendorLeadDetailPage,
  AppointmentsPage as VendorAppointmentsPage,
  SettlementsPage as VendorSettlementsPage,
  VendorProfilePage,
  LoyaltyPage as VendorLoyaltyPage,
} from '../pages/vendor';

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes: only for guests; header with theme toggle on all auth pages */}
      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      {/* Admin routes: fully protected, admin role only */}
      <Route
        path={ROUTES.admin.root}
        element={
          <RequireAuth allowedRoles={['admin']}>
            <DashboardLayout title="Owner Dashboard" />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="overview" element={<OwnerOverviewPage />} />
        <Route path="vendors" element={<AdminVendorsPage />} />
        <Route path="branches" element={<AdminBranchesPage />} />
        <Route path="sales" element={<AdminSalesPage />} />
        <Route path="memberships" element={<AdminMembershipsPage />} />
        <Route path="memberships/:id" element={<AdminMembershipDetailPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="search" element={<AdminSearchPage />} />
        <Route path="leads" element={<AdminLeadsPage />} />
        <Route path="leads/:id" element={<AdminLeadDetailPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="settlements" element={<AdminSettlementsPage />} />
        <Route path="loyalty" element={<AdminLoyaltyPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* Vendor routes: fully protected, vendor role only + approval guard */}
      <Route
        path={ROUTES.vendor.root}
        element={
          <RequireAuth allowedRoles={['vendor']}>
            <DashboardLayout title="Branch Dashboard" />
          </RequireAuth>
        }
      >
        <Route element={<VendorApprovalGuard />}>
          <Route index element={<VendorDashboardPage />} />
          <Route path="branches" element={<VendorBranchesPage />} />
          <Route path="sales" element={<VendorSalesPage />} />
          <Route path="memberships" element={<VendorMembershipsPage />} />
          <Route path="memberships/:id" element={<VendorMembershipDetailPage />} />
          <Route path="customers" element={<VendorCustomersPage />} />
          <Route path="search" element={<VendorSearchPage />} />
          <Route path="leads" element={<VendorLeadsPage />} />
          <Route path="leads/:id" element={<VendorLeadDetailPage />} />
          <Route path="appointments" element={<VendorAppointmentsPage />} />
          <Route path="settlements" element={<VendorSettlementsPage />} />
          <Route path="loyalty" element={<VendorLoyaltyPage />} />
          <Route path="profile" element={<VendorProfilePage />} />
        </Route>
      </Route>

      {/* Catch-all: redirect to login (fully protected – no route without auth) */}
      <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  );
}
