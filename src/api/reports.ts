import { apiRequest } from './client';
import type { SalesDashboard, Settlement, OwnerOverviewBranch } from '../types/crm';

export async function getSalesDashboard(params?: { branchId?: string; from?: string; to?: string; serviceCategory?: string }): Promise<{ success: boolean; data?: SalesDashboard; message?: string }> {
  const q = new URLSearchParams();
  if (params?.branchId) q.set('branchId', params.branchId);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.serviceCategory) q.set('serviceCategory', params.serviceCategory);
  const query = q.toString();
  const r = await apiRequest<SalesDashboard>(`/reports/sales-dashboard${query ? `?${query}` : ''}`);
  if (r.success && 'totalRevenue' in r) return { success: true, data: r as unknown as SalesDashboard };
  return { success: false, message: (r as { message?: string }).message };
}

export async function getSettlements(): Promise<{ success: boolean; settlements?: Settlement[]; summary?: { from: string; to: string; amount: number }[]; message?: string }> {
  const r = await apiRequest<{ settlements: Settlement[]; summary: { from: string; to: string; amount: number }[] }>('/reports/settlements');
  if (r.success && 'settlements' in r) {
    const d = r as unknown as { settlements: Settlement[]; summary: { from: string; to: string; amount: number }[] };
    return { success: true, settlements: d.settlements, summary: d.summary };
  }
  return { success: false, message: (r as { message?: string }).message };
}

export interface SettlementSummaryItem {
  fromBranch: string;
  toBranch: string;
  fromBranchId: string;
  toBranchId: string;
  amount: number;
}

export async function getOwnerOverview(): Promise<{
  success: boolean;
  overview?: OwnerOverviewBranch[];
  branches?: { id: string; name: string }[];
  settlementSummary?: SettlementSummaryItem[];
  message?: string;
}> {
  const r = await apiRequest<{ overview: OwnerOverviewBranch[]; branches: { id: string; name: string }[]; settlementSummary?: SettlementSummaryItem[] }>('/reports/owner-overview');
  if (r.success && 'overview' in r) {
    const d = r as unknown as { overview: OwnerOverviewBranch[]; branches: { id: string; name: string }[]; settlementSummary?: SettlementSummaryItem[] };
    return { success: true, overview: d.overview, branches: d.branches, settlementSummary: d.settlementSummary };
  }
  return { success: false, message: (r as { message?: string }).message };
}
