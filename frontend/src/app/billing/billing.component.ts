import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
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
  
  settings: Settings | null = null;
  subtotal = 0;
  taxRate = 0;
  taxAmount = 0;
  discount = 0;
  total = 0;

  showInvoicePreview = false;
  invoiceNumber = '';
  currentDate = new Date();
  isSaving = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadSettings();
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
    this.apiService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.taxRate = settings.tax_rate !== undefined ? settings.tax_rate : 0;
        this.calculateTotals();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading settings:', err)
    });
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
    this.total = this.subtotal + this.taxAmount - this.discount;
  }

  clearCart(): void {
    this.cart = [];
    this.customerName = '';
    this.customerPhone = '';
    this.notes = '';
    this.discount = 0;
    this.calculateTotals();
  }

  openInvoicePreview(): void {
    if (this.cart.length === 0) {
      return;
    }
    
    // Generate invoice number
    this.invoiceNumber = 'INV-' + Date.now();
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
      payment_method: this.paymentMethod,
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
}
