export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id?: string | number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_price?: number;
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: number;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount?: number;
  loyalty_points_used?: number;
  loyalty_points_earned?: number;
  total: number;
  payment_method?: string;
  cash_amount?: number;
  upi_amount?: number;
  card_amount?: number;
  notes?: string;
  created_at?: string;
}
