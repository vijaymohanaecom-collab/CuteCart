import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

export interface OtherIncome {
  id?: number;
  date: string;
  source: string;
  amount: number;
  cash_amount: number;
  bank_amount: number;
  payment_mode: 'cash' | 'bank' | 'split';
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const INCOME_SOURCES = ['Amazon', 'Stall', 'Other'];

@Component({
  selector: 'app-other-income',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './other-income.component.html',
  styleUrl: './other-income.component.css'
})
export class OtherIncomeComponent implements OnInit {
  incomeEntries: OtherIncome[] = [];
  filteredIncome: OtherIncome[] = [];
  sources = INCOME_SOURCES;
  
  showAddModal = false;
  showEditModal = false;
  newIncome: OtherIncome = {
    date: '',
    source: '',
    amount: 0,
    cash_amount: 0,
    bank_amount: 0,
    payment_mode: 'cash',
    notes: '',
    created_by: ''
  };
  editIncome: OtherIncome | null = null;

  dateFilter: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom' | 'all' = 'this_month';
  customStartDate: string = '';
  customEndDate: string = '';

  stats = {
    totalIncome: 0,
    totalCash: 0,
    totalBank: 0,
    incomeCount: 0,
    bySource: [] as { source: string; total: number; count: number }[],
    byMode: [] as { mode: string; total: number; count: number }[]
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.newIncome = this.getEmptyIncome();
    this.loadIncome();
    this.setDefaultCustomDates();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get currentUser(): string {
    return this.authService.getCurrentUser()?.username || '';
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

  loadIncome(): void {
    this.apiService.getOtherIncome().subscribe({
      next: (income) => {
        this.incomeEntries = income;
        this.applyDateFilter();
        this.loadStatistics();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading income:', err)
    });
  }

  loadStatistics(): void {
    const startDate = this.dateFilter === 'custom' ? this.customStartDate : undefined;
    const endDate = this.dateFilter === 'custom' ? this.customEndDate : undefined;

    this.apiService.getOtherIncomeStats(startDate, endDate).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  applyDateFilter(): void {
    const now = new Date();
    let filtered = [...this.incomeEntries];

    if (this.dateFilter === 'all') {
      this.filteredIncome = filtered;
    } else if (this.dateFilter === 'custom') {
      if (this.customStartDate && this.customEndDate) {
        const startDate = new Date(this.customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.customEndDate);
        endDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter(income => {
          const incomeDate = new Date(income.date);
          return incomeDate >= startDate && incomeDate <= endDate;
        });
      }
      this.filteredIncome = filtered;
    } else {
      const { startDate, endDate } = this.getDateRange(this.dateFilter);
      filtered = filtered.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= startDate && incomeDate <= endDate;
      });
      this.filteredIncome = filtered;
    }
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
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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

  onDateFilterChange(): void {
    this.applyDateFilter();
    this.loadStatistics();
  }

  onCustomDateChange(): void {
    if (this.dateFilter === 'custom') {
      this.applyDateFilter();
      this.loadStatistics();
    }
  }

  onPaymentModeChange(): void {
    if (this.newIncome.payment_mode === 'cash') {
      this.newIncome.cash_amount = this.newIncome.amount;
      this.newIncome.bank_amount = 0;
    } else if (this.newIncome.payment_mode === 'bank') {
      this.newIncome.cash_amount = 0;
      this.newIncome.bank_amount = this.newIncome.amount;
    }
  }

  onEditPaymentModeChange(): void {
    if (!this.editIncome) return;
    
    if (this.editIncome.payment_mode === 'cash') {
      this.editIncome.cash_amount = this.editIncome.amount;
      this.editIncome.bank_amount = 0;
    } else if (this.editIncome.payment_mode === 'bank') {
      this.editIncome.cash_amount = 0;
      this.editIncome.bank_amount = this.editIncome.amount;
    }
  }

  getEmptyIncome(): OtherIncome {
    return {
      date: this.formatDateForInput(new Date()),
      source: '',
      amount: 0,
      cash_amount: 0,
      bank_amount: 0,
      payment_mode: 'cash',
      notes: '',
      created_by: this.currentUser
    };
  }

  openAddModal(): void {
    this.newIncome = this.getEmptyIncome();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newIncome = this.getEmptyIncome();
  }

  openEditModal(income: OtherIncome): void {
    this.editIncome = { ...income };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editIncome = null;
  }

  saveIncome(): void {
    if (!this.newIncome.source || !this.newIncome.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.newIncome.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (this.newIncome.payment_mode === 'split') {
      const total = this.newIncome.cash_amount + this.newIncome.bank_amount;
      if (Math.abs(total - this.newIncome.amount) > 0.01) {
        alert('Cash and bank amounts must equal total amount');
        return;
      }
    }

    this.newIncome.created_by = this.currentUser;

    this.apiService.createOtherIncome(this.newIncome).subscribe({
      next: () => {
        this.loadIncome();
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Error creating income:', err);
        alert('Failed to create income entry. Please try again.');
      }
    });
  }

  updateIncome(): void {
    if (!this.editIncome || !this.editIncome.id) return;

    if (!this.editIncome.source || !this.editIncome.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.editIncome.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (this.editIncome.payment_mode === 'split') {
      const total = this.editIncome.cash_amount + this.editIncome.bank_amount;
      if (Math.abs(total - this.editIncome.amount) > 0.01) {
        alert('Cash and bank amounts must equal total amount');
        return;
      }
    }

    this.apiService.updateOtherIncome(this.editIncome.id, this.editIncome).subscribe({
      next: () => {
        this.loadIncome();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error updating income:', err);
        alert('Failed to update income entry. Please try again.');
      }
    });
  }

  deleteIncome(income: OtherIncome): void {
    if (!income.id) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete this income entry?\n\n` +
      `Source: ${income.source}\n` +
      `Amount: ₹${income.amount.toFixed(2)}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    this.apiService.deleteOtherIncome(income.id).subscribe({
      next: () => {
        this.loadIncome();
      },
      error: (err) => {
        console.error('Error deleting income:', err);
        alert('Failed to delete income entry. Please try again.');
      }
    });
  }
}
