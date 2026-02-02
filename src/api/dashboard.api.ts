import { http } from './http';
import type { OwnerOverviewBranch } from '../types/common';

export async function getOwnerOverview(): Promise<{
  success: boolean;
  overview?: OwnerOverviewBranch[];
  branches?: { id: string; name: string }[];
  message?: string;
}> {
  const r = await http<{ overview: OwnerOverviewBranch[]; branches: { id: string; name: string }[] }>('/reports/owner-overview');
  if (r.success && 'overview' in r)
    return { success: true, overview: r.overview as OwnerOverviewBranch[], branches: r.branches as { id: string; name: string }[] };
  return { success: false, message: r.message };
}
