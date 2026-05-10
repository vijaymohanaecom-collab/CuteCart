export interface Customer {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyalty_points: number;
  total_spent: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyTransaction {
  id?: number;
  customer_id: number;
  invoice_id?: number;
  type: 'earned' | 'redeemed';
  points: number;
  description?: string;
  created_at?: string;
}

export interface LoyaltyPointsSummary {
  customer_id: number;
  available_points: number;
  total_earned: number;
  total_redeemed: number;
  recent_transactions: LoyaltyTransaction[];
}
