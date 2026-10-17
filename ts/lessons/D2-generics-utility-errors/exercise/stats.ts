export interface Order {
  id: string;
  customerId: string;
  total: number;
  status: 'open' | 'paid' | 'cancelled';
}

export interface CustomerRevenue {
  customerId: string;
  revenue: number;
}

export function topCustomers(orders: readonly Order[], k: number): CustomerRevenue[] {
  throw new Error('TODO');
}
