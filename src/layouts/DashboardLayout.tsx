import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../auth/auth.store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ProfileMenu } from './components/ProfileMenu';
import { ROUTES } from '../config/constants';

interface NavItem {
  to: string;
  label: string;
  icon?: string;
}

const adminNav: NavItem[] = [
  { to: ROUTES.admin.root, label: 'Dashboard', icon: '📊' },
  { to: ROUTES.admin.overview, label: 'Owner overview', icon: '👁' },
  { to: ROUTES.admin.vendors, label: 'Vendors', icon: '🏪' },
  { to: ROUTES.admin.branches, label: 'Branches', icon: '📍' },
  { to: ROUTES.admin.sales, label: 'Sales dashboard', icon: '💰' },
  { to: ROUTES.admin.memberships, label: 'Memberships', icon: '🎫' },
  { to: ROUTES.admin.customers, label: 'Customers', icon: '👥' },
  { to: ROUTES.admin.search, label: 'Search', icon: '🔍' },
  { to: ROUTES.admin.leads, label: 'Leads inbox', icon: '📥' },
  { to: ROUTES.admin.appointments, label: 'Appointments', icon: '📅' },
  { to: ROUTES.admin.settlements, label: 'Settlements', icon: '📋' },
  { to: ROUTES.admin.settings, label: 'Settings', icon: '⚙️' },
];

const vendorNav: NavItem[] = [
  { to: ROUTES.vendor.root, label: 'Dashboard', icon: '📊' },
  { to: ROUTES.vendor.branches, label: 'My branch', icon: '📍' },
  { to: ROUTES.vendor.sales, label: 'Sales', icon: '💰' },
  { to: ROUTES.vendor.memberships, label: 'Memberships', icon: '🎫' },
  { to: ROUTES.vendor.customers, label: 'Customers', icon: '👥' },
  { to: ROUTES.vendor.search, label: 'Search', icon: '🔍' },
  { to: ROUTES.vendor.leads, label: 'Leads inbox', icon: '📥' },
  { to: ROUTES.vendor.appointments, label: 'Appointments', icon: '📅' },
  { to: ROUTES.vendor.settlements, label: 'Settlements', icon: '📋' },
  { to: ROUTES.vendor.profile, label: 'Profile', icon: '👤' },
];

interface DashboardLayoutProps {
  title: string;
  navItems?: NavItem[];
}

export function DashboardLayout({ title, navItems: navItemsProp }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const navItems = navItemsProp ?? (user?.role === 'admin' ? adminNav : vendorNav);
  const displayTitle = title || (user?.role === 'admin' ? 'Admin Dashboard' : 'Vendor Dashboard');

  return (
    <div className="dashboard">
      <Topbar title={displayTitle} onMenuClick={() => setSidebarOpen((o) => !o)}>
        <ProfileMenu />
      </Topbar>
      <Sidebar title={displayTitle} navItems={navItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
