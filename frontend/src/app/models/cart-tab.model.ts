import { InvoiceItem } from './invoice.model';

export interface CartTab {
  id: string;
  name: string;
  items: InvoiceItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  notes: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  discountPercentage: number;
  isPartialPayment: boolean;
  cashAmount: number;
  upiAmount: number;
  createdAt: Date;
  updatedAt: Date;
  isEditing?: boolean;
}

export interface CartTabState {
  tabs: CartTab[];
  activeTabId: string | null;
}
