import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

interface Customer {
  customer_name: string;
  customer_phone: string;
  total_purchases: number;
  total_spent: number;
  avg_purchase_value: number;
  first_purchase_date: string;
  last_purchase_date: string;
  status: string;
}

interface CustomerStatistics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  avgPurchaseValue: number;
  topCustomer: any;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  statistics: CustomerStatistics = {
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    avgPurchaseValue: 0,
    topCustomer: null
  };

  // Filters
  searchTerm: string = '';
  statusFilter: string = 'all';
  startDate: string = '';
  endDate: string = '';

  // Loading state
  loading: boolean = false;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadStatistics();
  }

  loadCustomers(): void {
    this.loading = true;
    console.log('Loading customers...');
    this.apiService.getCustomers(this.startDate, this.endDate).subscribe({
      next: (data) => {
        console.log('Customers loaded:', data);
        this.customers = data || [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        console.error('Error details:', err.message, err.status);
        this.customers = [];
        this.filteredCustomers = [];
        this.loading = false;
      }
    });
  }

  loadStatistics(): void {
    console.log('Loading statistics...');
    this.apiService.getCustomerStatistics(this.startDate, this.endDate).subscribe({
      next: (data) => {
        console.log('Statistics loaded:', data);
        this.statistics = data;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        alert('Failed to load statistics. Please check if the backend server is running.');
      }
    });
  }

  applyFilters(): void {
    this.filteredCustomers = this.customers.filter(customer => {
      const matchesSearch = !this.searchTerm || 
        customer.customer_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (customer.customer_phone && customer.customer_phone.includes(this.searchTerm));
      
      const matchesStatus = this.statusFilter === 'all' || 
        customer.status.toLowerCase() === this.statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onDateFilterApply(): void {
    if (this.startDate && this.endDate) {
      this.loadCustomers();
      this.loadStatistics();
    }
  }

  clearDateFilter(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadCustomers();
    this.loadStatistics();
  }

  downloadCSV(): void {
    this.apiService.exportCustomersCSV(this.startDate, this.endDate).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = this.startDate && this.endDate 
          ? `customers_${this.startDate}_to_${this.endDate}.csv`
          : `customers_${new Date().toISOString().split('T')[0]}.csv`;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error downloading CSV:', err)
    });
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toFixed(2);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getDaysSinceLastPurchase(lastPurchaseDate: string): number {
    const lastDate = new Date(lastPurchaseDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
