import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { SettingsService } from '../services/settings.service';
import { CartTabService } from '../services/cart-tab.service';
import { Product } from '../models/product.model';
import { Invoice, InvoiceItem } from '../models/invoice.model';
import { Settings } from '../models/settings.model';
import { CartTab, CartTabState } from '../models/cart-tab.model';
import { timeout } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css'
})
export class BillingComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm = '';
  
  // Cart tabs state
  cartTabs: CartTab[] = [];
  activeTab: CartTab | null = null;
  private cartSubscription?: Subscription;
  
  // Current cart data (derived from active tab)
  get cart(): InvoiceItem[] {
    return this.activeTab?.items || [];
  }
  
  get customerName(): string {
    return this.activeTab?.customerName || '';
  }
  set customerName(value: string) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ customerName: value });
    }
  }
  
  get customerPhone(): string {
    return this.activeTab?.customerPhone || '';
  }
  set customerPhone(value: string) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ customerPhone: value });
    }
  }
  
  get paymentMethod(): string {
    return this.activeTab?.paymentMethod || 'cash';
  }
  set paymentMethod(value: string) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ paymentMethod: value });
    }
  }
  
  get notes(): string {
    return this.activeTab?.notes || '';
  }
  set notes(value: string) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ notes: value });
    }
  }
  
  get cashAmount(): number {
    return this.activeTab?.cashAmount || 0;
  }
  set cashAmount(value: number) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ cashAmount: value });
    }
  }
  
  get upiAmount(): number {
    return this.activeTab?.upiAmount || 0;
  }
  set upiAmount(value: number) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ upiAmount: value });
    }
  }
  
  get isPartialPayment(): boolean {
    return this.activeTab?.isPartialPayment || false;
  }
  set isPartialPayment(value: boolean) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ isPartialPayment: value });
    }
  }
  
  get discount(): number {
    return this.activeTab?.discount || 0;
  }
  set discount(value: number) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ discount: value });
      this.calculateTotals();
    }
  }
  
  get discountType(): 'percentage' | 'fixed' {
    return this.activeTab?.discountType || 'fixed';
  }
  set discountType(value: 'percentage' | 'fixed') {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ discountType: value });
    }
  }
  
  get discountPercentage(): number {
    return this.activeTab?.discountPercentage || 0;
  }
  set discountPercentage(value: number) {
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ discountPercentage: value });
      this.calculateTotals();
    }
  }
  
  // Customer auto-complete
  customers: {customer_name: string, customer_phone: string}[] = [];
  filteredCustomers: {customer_name: string, customer_phone: string}[] = [];
  activeInput: 'name' | 'phone' | null = null;
  
  settings: Settings | null = null;
  subtotal = 0;
  taxRate = 0;
  taxAmount = 0;
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
    private settingsService: SettingsService,
    private cartTabService: CartTabService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadSettings();
    this.loadCustomers();
    
    // Subscribe to cart tabs state
    this.cartSubscription = this.cartTabService.getState().subscribe(state => {
      this.cartTabs = state.tabs;
      this.activeTab = this.cartTabService.getActiveTab();
      
      // Initialize first tab if none exist
      if (this.cartTabs.length === 0) {
        this.cartTabService.createNewTab();
      }
      
      this.calculateTotals();
      this.cdr.detectChanges();
    });
    
    // Subscribe to settings changes
    this.settingsService.settings$.subscribe(settings => {
      if (settings) {
        this.settings = settings;
        this.taxRate = settings.tax_rate !== undefined ? settings.tax_rate : 0;
        this.calculateTotals();
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
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
    this.apiService.getCustomersList().subscribe({
      next: (customers) => {
        this.customers = customers;
      },
      error: (err) => console.error('Error loading customers:', err)
    });
  }

  onCustomerNameChange(): void {
    this.activeInput = 'name';
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
    this.activeInput = 'phone';
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

  onCustomerKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.filteredCustomers = [];
      this.activeInput = null;
    }
  }

  onInputBlur(): void {
    // Small delay to allow click events to fire before hiding
    setTimeout(() => {
      this.activeInput = null;
    }, 200);
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
    this.cartTabService.addItemToActiveTab(product);
    this.calculateTotals();
    
    // Clear search box after adding item to cart
    this.searchTerm = '';
    this.filteredProducts = this.products;
  }

  updateQuantity(item: InvoiceItem, quantity: number): void {
    if (item.product_id !== undefined) {
      this.cartTabService.updateItemQuantityInActiveTab(item.product_id, quantity);
      this.calculateTotals();
    }
  }

  removeFromCart(item: InvoiceItem): void {
    if (item.product_id !== undefined) {
      this.cartTabService.removeItemFromActiveTab(item.product_id);
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    if (!this.activeTab) {
      this.subtotal = 0;
      this.taxAmount = 0;
      this.total = 0;
      return;
    }
    
    this.subtotal = this.cart.reduce((sum, item) => sum + item.total_price, 0);
    this.taxAmount = (this.subtotal * this.taxRate) / 100;
    
    // Calculate discount based on type
    const currentDiscount = this.discountType === 'percentage' 
      ? (this.subtotal * this.discountPercentage) / 100
      : this.discount;
    
    this.total = this.subtotal + this.taxAmount - currentDiscount;
  }

  clearCart(): void {
    this.cartTabService.clearActiveTab();
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
    
    const actualDiscount = this.discountType === 'percentage' 
      ? (this.subtotal * this.discountPercentage) / 100
      : this.discount;
    
    const invoice: Invoice = {
      invoice_number: this.invoiceNumber,
      customer_name: this.customerName || 'Walk-in Customer',
      customer_phone: this.customerPhone,
      items: this.cart,
      subtotal: this.subtotal,
      tax_rate: this.taxRate,
      tax_amount: this.taxAmount,
      discount: actualDiscount,
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
          this.loadProducts(); // Reload products to get updated stock
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
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ 
        discount: 0, 
        discountPercentage: 0 
      });
    }
    this.calculateTotals();
  }

  togglePartialPayment(): void {
    const newValue = !this.isPartialPayment;
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({
        isPartialPayment: newValue,
        cashAmount: newValue ? this.total : 0,
        upiAmount: 0
      });
    }
  }

  onCashAmountChange(): void {
    // Auto-populate remaining balance in UPI
    const remaining = this.total - (this.cashAmount || 0);
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ upiAmount: Math.max(0, remaining) });
    }
  }

  onUpiAmountChange(): void {
    // Auto-populate remaining balance in cash
    const remaining = this.total - (this.upiAmount || 0);
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ cashAmount: Math.max(0, remaining) });
    }
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
    if (this.activeTab) {
      this.cartTabService.updateActiveTab({ 
        discountType: 'percentage',
        discountPercentage: percentage 
      });
    }
    this.calculateTotals();
  }
  
  // Tab management methods
  createNewTab(): void {
    this.cartTabService.createNewTab();
  }
  
  switchTab(tabId: string): void {
    this.cartTabService.switchToTab(tabId);
  }
  
  deleteTab(tabId: string): void {
    if (this.cartTabs.length > 1) {
      this.cartTabService.deleteTab(tabId);
    } else {
      alert('Cannot delete the last tab. At least one tab must remain.');
    }
  }
  
  startEditingTabName(tab: CartTab): void {
    this.cartTabService.updateTabEditingState(tab.id, true);
    this.cdr.detectChanges();
  }
  
  finishEditingTabName(tab: CartTab, newName: string): void {
    if (newName.trim()) {
      this.cartTabService.updateTabName(tab.id, newName.trim());
    }
    this.cartTabService.updateTabEditingState(tab.id, false);
  }
  
  getTabItemCount(tab: CartTab): number {
    return tab.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  onDiscountValueChange(): void {
    this.calculateTotals();
  }

  onDiscountPercentageChange(): void {
    this.calculateTotals();
  }
}
