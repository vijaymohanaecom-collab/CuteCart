export interface Settings {
  id?: number;
  store_name: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  store_website?: string;
  tax_rate: number;
  currency: string;
  invoice_prefix: string;
  invoice_footer?: string;
  enable_barcode?: number;
  low_stock_threshold?: number;
  updated_at?: string;
}
