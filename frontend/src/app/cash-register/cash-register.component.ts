import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

export interface CashRegister {
  id?: number;
  date: string;
  opening_cash: number;
  closing_cash?: number;
  expected_closing_cash?: number;
  difference?: number;
  notes?: string;
  created_by?: string;
  closed_by?: string;
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
  status?: string;
  is_auto_closed?: number;
  is_auto_opened?: number;
}

export interface TodayCashData {
  entry: CashRegister | null;
  cashSales: number;
  cashExpenses: number;
  expectedClosingCash: number;
  hasEntry: boolean;
}

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-register.component.html',
  styleUrl: './cash-register.component.css'
})
export class CashRegisterComponent implements OnInit {
  todayData: TodayCashData | null = null;
  entries: CashRegister[] = [];
  filteredEntries: CashRegister[] = [];
  
  showOpenModal = false;
  showCloseModal = false;
  showHistoryModal = false;
  showEditModal = false;
  
  editingEntry: CashRegister | null = null;
  editOpeningCash: number = 0;
  editClosingCash: number = 0;
  editNotes: string = '';
  
  openingCash: number = 0;
  closingCash: number = 0;
  notes: string = '';
  
  dateFilter: 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom' | 'all' = 'this_month';
  customStartDate: string = '';
  customEndDate: string = '';
  
  summary = {
    totalOpening: 0,
    totalClosing: 0,
    totalDifference: 0,
    entryCount: 0,
    closedCount: 0
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTodayData();
    this.loadHistory();
    this.setDefaultCustomDates();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get currentUser(): string {
    return this.authService.getCurrentUser()?.username || '';
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
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

  loadTodayData(): void {
    this.apiService.getTodayCashRegister().subscribe({
      next: (data) => {
        this.todayData = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading today data:', err)
    });
  }

  loadHistory(): void {
    this.apiService.getCashRegisterEntries().subscribe({
      next: (entries) => {
        this.entries = entries;
        this.applyDateFilter();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading history:', err)
    });
  }

  loadSummary(): void {
    const startDate = this.dateFilter === 'custom' ? this.customStartDate : undefined;
    const endDate = this.dateFilter === 'custom' ? this.customEndDate : undefined;

    this.apiService.getCashRegisterSummary(startDate, endDate).subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.filteredEntries = data.entries;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading summary:', err)
    });
  }

  applyDateFilter(): void {
    const now = new Date();
    let filtered = [...this.entries];

    if (this.dateFilter === 'all') {
      this.filteredEntries = filtered;
    } else if (this.dateFilter === 'custom') {
      if (this.customStartDate && this.customEndDate) {
        const startDate = new Date(this.customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.customEndDate);
        endDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= endDate;
        });
      }
      this.filteredEntries = filtered;
    } else {
      const { startDate, endDate } = this.getDateRange(this.dateFilter);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
      this.filteredEntries = filtered;
    }

    this.calculateSummary();
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
      
      case 'this_week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      
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

  calculateSummary(): void {
    this.summary.entryCount = this.filteredEntries.length;
    this.summary.closedCount = this.filteredEntries.filter(e => e.closing_cash !== null && e.closing_cash !== undefined).length;
    this.summary.totalOpening = this.filteredEntries.reduce((sum, e) => sum + e.opening_cash, 0);
    this.summary.totalClosing = this.filteredEntries.reduce((sum, e) => sum + (e.closing_cash || 0), 0);
    this.summary.totalDifference = this.filteredEntries.reduce((sum, e) => sum + (e.difference || 0), 0);
  }

  onDateFilterChange(): void {
    this.applyDateFilter();
  }

  onCustomDateChange(): void {
    if (this.dateFilter === 'custom') {
      this.applyDateFilter();
    }
  }

  openRegister(): void {
    if (!this.openingCash || this.openingCash < 0) {
      alert('Please enter a valid opening cash amount');
      return;
    }

    const data = {
      date: this.todayDate,
      opening_cash: this.openingCash,
      notes: this.notes,
      created_by: this.currentUser
    };

    this.apiService.openCashRegister(data).subscribe({
      next: () => {
        this.loadTodayData();
        this.loadHistory();
        this.closeOpenModal();
        alert('Cash register opened successfully');
      },
      error: (err) => {
        console.error('Error opening register:', err);
        alert(err.error?.error || 'Failed to open cash register');
      }
    });
  }

  closeRegister(): void {
    if (!this.closingCash || this.closingCash < 0) {
      alert('Please enter a valid closing cash amount');
      return;
    }

    const data = {
      date: this.todayDate,
      closing_cash: this.closingCash,
      notes: this.notes,
      closed_by: this.currentUser
    };

    this.apiService.closeCashRegister(data).subscribe({
      next: () => {
        this.loadTodayData();
        this.loadHistory();
        this.closeCloseModal();
        alert('Cash register closed successfully');
      },
      error: (err) => {
        console.error('Error closing register:', err);
        alert(err.error?.error || 'Failed to close cash register');
      }
    });
  }

  openOpenModal(): void {
    this.openingCash = 0;
    this.notes = '';
    this.showOpenModal = true;
  }

  closeOpenModal(): void {
    this.showOpenModal = false;
    this.openingCash = 0;
    this.notes = '';
  }

  openCloseModal(): void {
    this.closingCash = this.todayData?.expectedClosingCash || 0;
    this.notes = this.todayData?.entry?.notes || '';
    this.showCloseModal = true;
  }

  closeCloseModal(): void {
    this.showCloseModal = false;
    this.closingCash = 0;
    this.notes = '';
  }

  openHistoryModal(): void {
    this.showHistoryModal = true;
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
  }

  deleteEntry(entry: CashRegister): void {
    const confirmDelete = confirm(
      `Are you sure you want to delete the cash register entry for ${entry.date}?\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    this.apiService.deleteCashRegister(entry.date).subscribe({
      next: () => {
        this.loadHistory();
        if (entry.date === this.todayDate) {
          this.loadTodayData();
        }
      },
      error: (err) => {
        console.error('Error deleting entry:', err);
        alert('Failed to delete entry. Please try again.');
      }
    });
  }

  getDifferenceClass(difference: number | undefined): string {
    if (!difference) return '';
    if (difference > 0) return 'positive';
    if (difference < 0) return 'negative';
    return 'zero';
  }

  getStatusBadgeClass(entry: CashRegister): string {
    if (entry.is_auto_closed) return 'status-badge auto-closed';
    if (entry.closing_cash !== null && entry.closing_cash !== undefined) return 'status-badge closed';
    return 'status-badge open';
  }

  getStatusText(entry: CashRegister): string {
    if (entry.is_auto_closed) return 'Auto-Closed';
    if (entry.closing_cash !== null && entry.closing_cash !== undefined) return 'Closed';
    return 'Open';
  }

  openEditModal(entry: CashRegister): void {
    this.editingEntry = { ...entry };
    this.editOpeningCash = entry.opening_cash;
    this.editClosingCash = entry.closing_cash || 0;
    this.editNotes = entry.notes || '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingEntry = null;
    this.editOpeningCash = 0;
    this.editClosingCash = 0;
    this.editNotes = '';
  }

  saveEdit(): void {
    if (!this.editingEntry) return;

    const updateData: any = {
      opening_cash: this.editOpeningCash,
      notes: this.editNotes
    };

    if (this.editingEntry.closing_cash !== null && this.editingEntry.closing_cash !== undefined) {
      updateData.closing_cash = this.editClosingCash;
    }

    this.apiService.updateCashRegister(this.editingEntry.date, updateData).subscribe({
      next: () => {
        this.loadHistory();
        if (this.editingEntry?.date === this.todayDate) {
          this.loadTodayData();
        }
        this.closeEditModal();
        alert('Cash register entry updated successfully');
      },
      error: (err) => {
        console.error('Error updating entry:', err);
        alert('Failed to update entry. Please try again.');
      }
    });
  }
}
