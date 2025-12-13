import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { SettingsService } from '../services/settings.service';
import { Product } from '../models/product.model';
import { Invoice, InvoiceItem } from '../models/invoice.model';
import { Settings } from '../models/settings.model';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css'
})
export class BillingComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  cart: InvoiceItem[] = [];
  searchTerm = '';
  
  customerName = '';
  customerPhone = '';
  paymentMethod = 'cash';
  notes = '';
  
  // Payment split amounts
  cashAmount = 0;
  upiAmount = 0;
  isPartialPayment = false;
  
  // Customer auto-complete
  customers: {customer_name: string, customer_phone: string}[] = [];
  filteredCustomers: {customer_name: string, customer_phone: string}[] = [];
  
  settings: Settings | null = null;
  subtotal = 0;
  taxRate = 0;
  taxAmount = 0;
  discount = 0;
  discountType: 'percentage' | 'fixed' = 'fixed';
  discountPercentage = 0;
  discountPresets: number[] = [5, 10, 15, 20];
  total = 0;

  showInvoicePreview = false;
  invoiceNumber = '';
  currentDate = new Date();
  isSaving = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadSettings();
    this.loadCustomers();
    
    // Subscribe to settings changes
    this.settingsService.settings$.subscribe(settings => {
      if (settings) {
        this.settings = settings;
        this.taxRate = settings.tax_rate !== undefined ? settings.tax_rate : 0;
        this.calculateTotals();
      }
    });
  }

  loadProducts(): void {
    this.apiService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  loadSettings(): void {
    // Get initial settings from service
    const currentSettings = this.settingsService.getSettings();
    this.settings = currentSettings;
    this.taxRate = currentSettings.tax_rate !== undefined ? currentSettings.tax_rate : 0;
    
    // Load discount presets from settings
    if (currentSettings.discount_presets) {
      try {
        this.discountPresets = JSON.parse(currentSettings.discount_presets);
      } catch (e) {
        console.warn('Error parsing discount presets, using defaults');
      }
    }
    
    this.calculateTotals();
  }

  loadCustomers(): void {
    this.apiService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
      },
      error: (err) => console.error('Error loading customers:', err)
    });
  }

  onCustomerNameChange(): void {
    if (!this.customerName) {
      this.filteredCustomers = [];
      return;
    }
    
    const searchTerm = this.customerName.toLowerCase();
    this.filteredCustomers = this.customers.filter(c => 
      c.customer_name.toLowerCase().includes(searchTerm)
    ).slice(0, 5); // Limit to 5 suggestions
  }

  onCustomerPhoneChange(): void {
    if (!this.customerPhone) {
      this.filteredCustomers = [];
      return;
    }
    
    const searchTerm = this.customerPhone;
    this.filteredCustomers = this.customers.filter(c => 
      c.customer_phone && c.customer_phone.includes(searchTerm)
    ).slice(0, 5); // Limit to 5 suggestions
  }

  selectCustomer(customer: {customer_name: string, customer_phone: string}): void {
    this.customerName = customer.customer_name;
    this.customerPhone = customer.customer_phone || '';
    this.filteredCustomers = [];
  }

  searchProducts(): void {
    if (!this.searchTerm) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.id?.toString().includes(this.searchTerm)
      );
    }
  }

  addToCart(product: Product): void {
    const existing = this.cart.find(item => item.product_id === product.id);
    if (existing) {
      existing.quantity++;
      existing.total_price = existing.quantity * existing.unit_price;
    } else {
      this.cart.push({
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        purchase_price: product.purchase_price || 0
      });
    }
    this.calculateTotals();
    
    // Clear search box after adding item to cart
    this.searchTerm = '';
    this.filteredProducts = this.products;
  }

  updateQuantity(item: InvoiceItem, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(item);
    } else {
      item.quantity = quantity;
      item.total_price = item.quantity * item.unit_price;
      this.calculateTotals();
    }
  }

  removeFromCart(item: InvoiceItem): void {
    this.cart = this.cart.filter(i => i !== item);
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.subtotal = this.cart.reduce((sum, item) => sum + item.total_price, 0);
    this.taxAmount = (this.subtotal * this.taxRate) / 100;
    
    // Calculate discount based on type
    if (this.discountType === 'percentage') {
      this.discount = (this.subtotal * this.discountPercentage) / 100;
    }
    // For 'fixed' type, discount is already set directly
    
    this.total = this.subtotal + this.taxAmount - this.discount;
  }

  clearCart(): void {
    this.cart = [];
    this.customerName = '';
    this.customerPhone = '';
    this.notes = '';
    this.discount = 0;
    this.discountPercentage = 0;
    this.discountType = 'fixed';
    this.paymentMethod = 'cash';
    this.isPartialPayment = false;
    this.cashAmount = 0;
    this.upiAmount = 0;
    this.calculateTotals();
  }

  openInvoicePreview(): void {
    if (this.cart.length === 0) {
      return;
    }
    
    // Generate invoice number using settings prefix
    const prefix = this.settings?.invoice_prefix || 'INV';
    this.invoiceNumber = prefix + '-' + Date.now();
    this.currentDate = new Date();
    this.showInvoicePreview = true;
  }

  closeInvoicePreview(): void {
    this.showInvoicePreview = false;
  }

  saveSale(): void {
    if (this.isSaving || this.cart.length === 0) return;
    
    this.isSaving = true;
    
    const invoice: Invoice = {
      invoice_number: this.invoiceNumber,
      customer_name: this.customerName || 'Walk-in Customer',
      customer_phone: this.customerPhone,
      items: this.cart,
      subtotal: this.subtotal,
      tax_rate: this.taxRate,
      tax_amount: this.taxAmount,
      discount: this.discount,
      total: this.total,
      payment_method: this.isPartialPayment ? 'split' : this.paymentMethod,
      cash_amount: this.isPartialPayment ? this.cashAmount : (this.paymentMethod === 'cash' ? this.total : 0),
      upi_amount: this.isPartialPayment ? this.upiAmount : (this.paymentMethod === 'upi' ? this.total : 0),
      notes: this.notes,
      created_at: this.currentDate.toISOString()
    };

    this.apiService.createInvoice(invoice).pipe(
      timeout(30000)
    ).subscribe({
      next: () => {
        setTimeout(() => {
          this.isSaving = false;
          this.showInvoicePreview = false;
          this.clearCart();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        }, 0);
        
        if (err.name === 'TimeoutError') {
          alert('Request timed out. Please check if the backend server is running.');
        } else if (err.status === 0) {
          alert('Cannot connect to server. Please ensure the backend is running on http://localhost:3000');
        } else {
          alert(`Error saving invoice: ${err.error?.error || err.message || 'Unknown error'}`);
        }
      }
    });
  }

  checkout(): void {
    this.openInvoicePreview();
  }

  onDiscountTypeChange(): void {
    // Reset discount values when switching type
    this.discount = 0;
    this.discountPercentage = 0;
    this.calculateTotals();
  }

  togglePartialPayment(): void {
    this.isPartialPayment = !this.isPartialPayment;
    if (this.isPartialPayment) {
      // Initialize with total amount in cash
      this.cashAmount = this.total;
      this.upiAmount = 0;
    } else {
      // Reset to single payment method
      this.cashAmount = 0;
      this.upiAmount = 0;
    }
  }

  onCashAmountChange(): void {
    // Auto-populate remaining balance in UPI
    const remaining = this.total - (this.cashAmount || 0);
    this.upiAmount = Math.max(0, remaining);
  }

  onUpiAmountChange(): void {
    // Auto-populate remaining balance in cash
    const remaining = this.total - (this.upiAmount || 0);
    this.cashAmount = Math.max(0, remaining);
  }

  getPaymentTotal(): number {
    return (this.cashAmount || 0) + (this.upiAmount || 0);
  }

  getPaymentDifference(): number {
    return this.total - this.getPaymentTotal();
  }

  isPaymentValid(): boolean {
    if (!this.isPartialPayment) return true;
    return Math.abs(this.getPaymentDifference()) < 0.01;
  }

  applyDiscountPreset(percentage: number): void {
    this.discountType = 'percentage';
    this.discountPercentage = percentage;
    this.calculateTotals();
  }

  onDiscountValueChange(): void {
    this.calculateTotals();
  }

  onDiscountPercentageChange(): void {
    this.calculateTotals();
  }
}
