import { apiRequest } from './client';
import type { VendorListItem } from '../types/auth';

interface VendorsResponse {
  success: boolean;
  vendors?: VendorListItem[];
  message?: string;
}

interface ApproveRejectResponse {
  success: boolean;
  message?: string;
  vendor?: VendorListItem;
}

export async function getVendors(status?: 'pending' | 'approved' | 'rejected'): Promise<VendorsResponse> {
  const query = status ? `?status=${status}` : '';
  const result = await apiRequest<{ vendors: VendorListItem[] }>(`/vendors${query}`);
  if (result.success && 'vendors' in result) {
    return { success: true, vendors: (result as { vendors: VendorListItem[] }).vendors };
  }
  return { success: false, message: (result as { message?: string }).message };
}

export async function approveVendor(id: string): Promise<ApproveRejectResponse> {
  const result = await apiRequest<{ vendor: VendorListItem }>(`/vendors/${id}/approve`, {
    method: 'PATCH',
  });
  if (result.success && 'vendor' in result) {
    return { success: true, vendor: (result as { vendor: VendorListItem }).vendor };
  }
  return { success: false, message: (result as { message?: string }).message };
}

export async function rejectVendor(id: string): Promise<ApproveRejectResponse> {
  const result = await apiRequest<{ vendor: VendorListItem }>(`/vendors/${id}/reject`, {
    method: 'PATCH',
  });
  if (result.success && 'vendor' in result) {
    return { success: true, vendor: (result as { vendor: VendorListItem }).vendor };
  }
  return { success: false, message: (result as { message?: string }).message };
}
