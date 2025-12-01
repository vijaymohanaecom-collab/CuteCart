export interface Product {
  id?: string | number;
  name: string;
  description?: string;
  price: number;
  purchase_price?: number;
  stock?: number;
  barcode?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}
