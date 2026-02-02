import { apiRequest } from './client';
import type { Customer } from '../types/crm';

export async function getCustomers(): Promise<{ success: boolean; customers?: Customer[]; message?: string }> {
  const r = await apiRequest<{ customers: Customer[] }>('/customers');
  if (r.success && 'customers' in r) return { success: true, customers: (r as { customers: Customer[] }).customers };
  return { success: false, message: (r as { message?: string }).message };
}

export async function getCustomer(id: string) {
  return apiRequest<{ customer: Customer }>(`/customers/${id}`);
}

export async function createCustomer(data: { name: string; phone: string; email?: string; membershipCardId?: string; primaryBranchId?: string; notes?: string }) {
  return apiRequest<{ customer: Customer }>('/customers', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  return apiRequest<{ customer: Customer }>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
