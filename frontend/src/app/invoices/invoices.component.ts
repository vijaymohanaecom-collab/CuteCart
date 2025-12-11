import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { PdfInvoiceService } from '../services/pdf-invoice.service';
import { SettingsService } from '../services/settings.service';
import { Invoice } from '../models/invoice.model';
import { Settings } from '../models/settings.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css'
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  selectedInvoice: Invoice | null = null;
  showModal = false;
  showEditModal = false;
  editInvoice: Invoice | null = null;

  // Date filter properties
  dateFilter: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom' | 'all' = 'today';
  customStartDate: string = '';
  customEndDate: string = '';

  // Statistics
  stats = {
    totalSales: 0,
    totalProfit: 0,
    totalInvoices: 0,
    averageOrderValue: 0,
    cashAmount: 0,
    upiAmount: 0,
    cardAmount: 0,
    otherAmount: 0
  };

  storeSettings: Settings | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private pdfService: PdfInvoiceService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.setDefaultCustomDates();
    this.loadSettings();
  }

  loadSettings(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.storeSettings = settings;
    });
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get isSalesPerson(): boolean {
    return this.authService.isSalesPerson();
  }

  setDefaultCustomDates(): void {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    
    this.customEndDate = this.formatDateForInput(today);
    this.customStartDate = this.formatDateForInput(lastMonth);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadInvoices(): void {
    this.apiService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.applyDateFilter();
        this.cdr.detectChanges();
      },
      error: () => {
        // Handle error silently
      }
    });
  }

  applyDateFilter(): void {
    const now = new Date();
    let filtered = [...this.invoices];

    // Sales person only sees today's invoices
    if (this.isSalesPerson) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.created_at!);
        return invoiceDate >= today && invoiceDate <= endOfDay;
      });
      
      this.filteredInvoices = filtered;
      this.calculateStatistics();
      return;
    }

    if (this.dateFilter === 'all') {
      this.filteredInvoices = filtered;
    } else if (this.dateFilter === 'custom') {
      if (this.customStartDate && this.customEndDate) {
        const startDate = new Date(this.customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.customEndDate);
        endDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter(invoice => {
          const invoiceDate = new Date(invoice.created_at!);
          return invoiceDate >= startDate && invoiceDate <= endDate;
        });
      }
      this.filteredInvoices = filtered;
    } else {
      const { startDate, endDate } = this.getDateRange(this.dateFilter);
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.created_at!);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
      this.filteredInvoices = filtered;
    }

    this.calculateStatistics();
  }

  getDateRange(filter: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'yesterday':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'this_week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as first day
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'last_week':
        const lastWeekStart = new Date(now);
        const lastWeekDayOfWeek = now.getDay();
        const lastWeekDiff = lastWeekDayOfWeek === 0 ? 6 : lastWeekDayOfWeek - 1;
        lastWeekStart.setDate(now.getDate() - lastWeekDiff - 7);
        lastWeekStart.setHours(0, 0, 0, 0);
        
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        
        return { startDate: lastWeekStart, endDate: lastWeekEnd };
      
      case 'this_month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'last_month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        lastMonthStart.setHours(0, 0, 0, 0);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        return { startDate: lastMonthStart, endDate: lastMonthEnd };
    }

    return { startDate, endDate };
  }

  calculateStatistics(): void {
    this.stats.totalInvoices = this.filteredInvoices.length;
    
    // Calculate total sales
    this.stats.totalSales = this.filteredInvoices.reduce((sum, invoice) => {
      return sum + (invoice.total || 0);
    }, 0);

    // Calculate total profit (only if user is manager and purchase_price is available)
    this.stats.totalProfit = 0;
    if (this.isManager) {
      this.filteredInvoices.forEach(invoice => {
        invoice.items.forEach(item => {
          const purchasePrice = item.purchase_price || 0;
          const profit = (item.unit_price - purchasePrice) * item.quantity;
          this.stats.totalProfit += profit;
        });
      });
    }

    // Calculate average order value
    this.stats.averageOrderValue = this.stats.totalInvoices > 0 
      ? this.stats.totalSales / this.stats.totalInvoices 
      : 0;

    // Calculate payment method breakdown
    this.stats.cashAmount = 0;
    this.stats.upiAmount = 0;
    this.stats.cardAmount = 0;
    this.stats.otherAmount = 0;

    this.filteredInvoices.forEach(invoice => {
      const paymentMethod = (invoice.payment_method || 'cash').toLowerCase();

      if (paymentMethod === 'split') {
        // For split payments, add to respective buckets based on actual amounts
        this.stats.cashAmount += invoice.cash_amount || 0;
        this.stats.upiAmount += invoice.upi_amount || 0;
      } else if (paymentMethod === 'cash') {
        this.stats.cashAmount += invoice.cash_amount || invoice.total || 0;
      } else if (paymentMethod === 'upi') {
        this.stats.upiAmount += invoice.upi_amount || invoice.total || 0;
      } else if (paymentMethod === 'card') {
        this.stats.cardAmount += invoice.total || 0;
      } else {
        this.stats.otherAmount += invoice.total || 0;
      }
    });
  }

  onDateFilterChange(): void {
    this.applyDateFilter();
  }

  onCustomDateChange(): void {
    if (this.dateFilter === 'custom') {
      this.applyDateFilter();
    }
  }

  viewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedInvoice = null;
  }

  openEditModal(invoice: Invoice): void {
    this.editInvoice = { ...invoice, items: [...invoice.items] };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editInvoice = null;
  }

  onEditCashAmountChange(): void {
    if (!this.editInvoice) return;
    // Auto-populate remaining balance in UPI
    const remaining = this.editInvoice.total - (this.editInvoice.cash_amount || 0);
    this.editInvoice.upi_amount = Math.max(0, remaining);
  }

  onEditUpiAmountChange(): void {
    if (!this.editInvoice) return;
    // Auto-populate remaining balance in cash
    const remaining = this.editInvoice.total - (this.editInvoice.upi_amount || 0);
    this.editInvoice.cash_amount = Math.max(0, remaining);
  }

  isEditPaymentValid(): boolean {
    if (!this.editInvoice) return false;
    if (this.editInvoice.payment_method !== 'split') return true;
    const total = (this.editInvoice.cash_amount || 0) + (this.editInvoice.upi_amount || 0);
    return Math.abs(this.editInvoice.total - total) < 0.01;
  }

  saveInvoiceEdit(): void {
    if (!this.editInvoice || !this.editInvoice.id) return;

    if (this.editInvoice.payment_method === 'split' && !this.isEditPaymentValid()) {
      alert('Split payment amounts must equal the invoice total.');
      return;
    }

    const updateData: any = {
      customer_name: this.editInvoice.customer_name,
      customer_phone: this.editInvoice.customer_phone,
      payment_method: this.editInvoice.payment_method
    };

    // Include payment split amounts if payment method is split
    if (this.editInvoice.payment_method === 'split') {
      updateData.cash_amount = this.editInvoice.cash_amount || 0;
      updateData.upi_amount = this.editInvoice.upi_amount || 0;
    } else {
      // Set amounts based on single payment method
      updateData.cash_amount = this.editInvoice.payment_method === 'cash' ? this.editInvoice.total : 0;
      updateData.upi_amount = this.editInvoice.payment_method === 'upi' ? this.editInvoice.total : 0;
    }

    this.apiService.updateInvoice(this.editInvoice.id, updateData).subscribe({
      next: () => {
        this.loadInvoices();
        this.closeEditModal();
      },
      error: () => {
        alert('Error updating invoice. Please try again.');
      }
    });
  }

  printInvoice(): void {
    window.print();
  }

  deleteInvoice(invoice: Invoice): void {
    if (!invoice.id) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete Invoice ${invoice.invoice_number}?\n\n` +
      `Customer: ${invoice.customer_name || 'Walk-in'}\n` +
      `Total: ₹${invoice.total?.toFixed(2)}\n\n` +
      `This will restore the stock levels for all products in this invoice.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    this.apiService.deleteInvoice(invoice.id).subscribe({
      next: () => {
        this.loadInvoices();
        alert('Invoice deleted successfully. Product stock levels have been restored.');
      },
      error: (error) => {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice. Please try again.');
      }
    });
  }

  async shareOnWhatsApp(invoice: Invoice): Promise<void> {
    if (!invoice.customer_phone) {
      alert('Customer phone number is not available for this invoice.');
      return;
    }

    try {
      await this.pdfService.shareViaWhatsApp(invoice, this.storeSettings);
    } catch (error) {
      console.error('Error sharing invoice:', error);
      alert('Failed to share invoice. Please try again.');
    }
  }

  hasPhoneNumber(invoice: Invoice): boolean {
    return !!(invoice.customer_phone && invoice.customer_phone.trim().length > 0);
  }
}
