import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

interface SalesReport {
  summary: {
    total_invoices: number;
    total_sales: number;
    total_subtotal: number;
    total_tax: number;
    total_discount: number;
    total_items_sold: number;
    total_profit: number;
  };
  paymentBreakdown: Array<{
    payment_method: string;
    count: number;
    total: number;
    cash_total: number;
    upi_total: number;
    card_total: number;
  }>;
  topProducts: Array<{
    product_name: string;
    quantity_sold: number;
    total_revenue: number;
    profit: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    items_count: number;
    quantity_sold: number;
    total_revenue: number;
    profit: number;
  }>;
  dailySales: Array<{
    date: string;
    invoice_count: number;
    total_sales: number;
  }>;
  hourlySales: Array<{
    hour: number;
    invoice_count: number;
    total_sales: number;
  }>;
  invoices: Array<any>;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  reportType: 'today' | 'weekly' | 'monthly' | 'custom' = 'today';
  startDate: string = '';
  endDate: string = '';
  loading: boolean = false;
  error: string = '';
  
  reportData: SalesReport | null = null;
  activeTab: 'overview' | 'products' | 'categories' | 'payments' | 'invoices' = 'overview';
  private subscription?: Subscription;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    // Reset state when component initializes
    this.loading = false;
    this.error = '';
    this.reportData = null;
  }

  ngAfterViewInit() {
    // Load report after view is initialized to ensure component is fully ready
    setTimeout(() => {
      this.generateReport();
    }, 0);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onReportTypeChange() {
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0];
    
    if (this.reportType === 'weekly') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      this.startDate = weekAgo.toISOString().split('T')[0];
    } else if (this.reportType === 'monthly') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      this.startDate = monthAgo.toISOString().split('T')[0];
    } else if (this.reportType === 'today') {
      this.startDate = today.toISOString().split('T')[0];
    }
    
    if (this.reportType !== 'custom') {
      this.generateReport();
    }
  }

  generateReport() {
    // Unsubscribe from previous request if it exists
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    this.loading = true;
    this.error = '';
    this.reportData = null;
    
    let url = `${environment.apiUrl}/reports/sales?reportType=${this.reportType}`;
    
    if (this.reportType === 'custom' && this.startDate && this.endDate) {
      url = `${environment.apiUrl}/reports/sales?startDate=${this.startDate}&endDate=${this.endDate}`;
    }
    
    console.log('Fetching report from:', url);
    
    this.subscription = this.http.get<SalesReport>(url).pipe(
      timeout(30000),
      catchError(err => {
        console.error('Report error:', err);
        this.error = 'Failed to generate report: ' + (err.error?.error || err.message || 'Request timeout or network error');
        this.loading = false;
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        console.log('Report data received:', data);
        if (data) {
          this.reportData = data;
          this.error = '';
        } else {
          this.error = 'No data received from server';
          this.reportData = null;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Subscription error:', err);
        this.error = 'Failed to generate report: ' + (err.error?.error || err.message || 'Unknown error');
        this.loading = false;
        this.reportData = null;
        this.cdr.detectChanges();
      },
      complete: () => {
        // Ensure loading is false even if complete is called
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toFixed(2);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateOnly(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }

  getReportTitle(): string {
    switch (this.reportType) {
      case 'today':
        return "Today's Sales Report";
      case 'weekly':
        return 'Weekly Sales Report (Last 7 Days)';
      case 'monthly':
        return 'Monthly Sales Report (Last 30 Days)';
      case 'custom':
        return `Sales Report (${this.formatDateOnly(this.startDate)} - ${this.formatDateOnly(this.endDate)})`;
      default:
        return 'Sales Report';
    }
  }

  exportToCSV() {
    if (!this.reportData) return;

    let csv = '';
    
    csv += 'SALES REPORT\n';
    csv += `Report Type: ${this.getReportTitle()}\n`;
    csv += `Generated: ${new Date().toLocaleString('en-IN')}\n\n`;
    
    csv += 'SUMMARY\n';
    csv += `Total Invoices,${this.reportData.summary.total_invoices}\n`;
    csv += `Total Sales,${this.reportData.summary.total_sales}\n`;
    csv += `Total Items Sold,${this.reportData.summary.total_items_sold}\n`;
    csv += `Total Profit,${this.reportData.summary.total_profit}\n`;
    csv += `Total Tax,${this.reportData.summary.total_tax}\n`;
    csv += `Total Discount,${this.reportData.summary.total_discount}\n\n`;
    
    csv += 'TOP SELLING PRODUCTS\n';
    csv += 'Product Name,Quantity Sold,Revenue,Profit\n';
    this.reportData.topProducts.forEach(p => {
      csv += `${p.product_name},${p.quantity_sold},${p.total_revenue},${p.profit}\n`;
    });
    csv += '\n';
    
    csv += 'CATEGORY BREAKDOWN\n';
    csv += 'Category,Items Count,Quantity Sold,Revenue,Profit\n';
    this.reportData.categoryBreakdown.forEach(c => {
      csv += `${c.category || 'Uncategorized'},${c.items_count},${c.quantity_sold},${c.total_revenue},${c.profit}\n`;
    });
    csv += '\n';
    
    csv += 'PAYMENT METHOD BREAKDOWN\n';
    csv += 'Payment Method,Count,Total,Cash,UPI,Card\n';
    this.reportData.paymentBreakdown.forEach(p => {
      csv += `${p.payment_method},${p.count},${p.total},${p.cash_total},${p.upi_total},${p.card_total}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${this.reportType}-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  printReport() {
    window.print();
  }

  getProfitMargin(): number {
    if (!this.reportData || this.reportData.summary.total_sales === 0) return 0;
    return (this.reportData.summary.total_profit / this.reportData.summary.total_sales) * 100;
  }

  getAverageOrderValue(): number {
    if (!this.reportData || this.reportData.summary.total_invoices === 0) return 0;
    return this.reportData.summary.total_sales / this.reportData.summary.total_invoices;
  }

  getMaxDailySales(): number {
    if (!this.reportData || this.reportData.dailySales.length === 0) return 1;
    return Math.max(...this.reportData.dailySales.map(d => d.total_sales));
  }

  getMaxHourlySales(): number {
    if (!this.reportData || this.reportData.hourlySales.length === 0) return 1;
    return Math.max(...this.reportData.hourlySales.map(h => h.total_sales));
  }
}
