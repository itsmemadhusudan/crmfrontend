// Placeholder for loyalty API when backend is ready
import { http } from './http';

export async function getLoyaltyPoints(_customerId: string) {
  return http<{ points: number }>('/loyalty/points'); // adjust when endpoint exists
}
