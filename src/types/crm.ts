export interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  membershipCardId?: string;
  primaryBranch?: string;
  customerPackage?: string;
  customerPackagePrice?: number;
  notes?: string;
  createdAt?: string;
}

export interface MembershipType {
  id: string;
  name: string;
  totalCredits: number;
  price?: number;
  serviceCategory?: string;
  validityDays?: number;
}

export interface Membership {
  id: string;
  customer?: { id: string; name: string; phone: string; email?: string; membershipCardId?: string } | null;
  typeName?: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits?: number;
  soldAtBranch?: string;
  soldAtBranchId?: string;
  purchaseDate: string;
  expiryDate?: string;
  status: string;
}

export interface MembershipUsage {
  id: string;
  usedAtBranch?: string;
  usedBy?: string;
  creditsUsed: number;
  usedAt: string;
  notes?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: string;
  branch?: string;
  branchId?: string;
  status: string;
  followUps?: { note: string; at: string; byUserId?: string }[];
  followUpsCount?: number;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  category?: string;
  branch?: string;
  durationMinutes?: number;
  price?: number;
}

export interface Appointment {
  id: string;
  customer?: { id: string; name: string; phone: string } | null;
  branch?: string;
  branchId?: string;
  staff?: string;
  service?: string;
  serviceId?: string;
  scheduledAt: string;
  status: string;
  notes?: string;
}

export interface SalesDashboard {
  from: string;
  to: string;
  totalRevenue: number;
  byBranch: { branch: string; revenue: number }[];
  byService: { serviceCategory: string; revenue: number }[];
  totalMemberships: number;
  branches: { id: string; name: string }[];
}

export interface Settlement {
  id: string;
  fromBranch: string;
  toBranch: string;
  amount: number;
  reason?: string;
  status: string;
  createdAt: string;
}

export interface OwnerOverviewBranch {
  branchId: string;
  branchName: string;
  membershipsSold: number;
  leads: number;
  leadsBooked: number;
  appointmentsThisMonth: number;
  appointmentsCompleted: number;
}
