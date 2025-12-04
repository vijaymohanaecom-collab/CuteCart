import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Expense, EXPENSE_CATEGORIES } from '../models/expense.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  categories = EXPENSE_CATEGORIES;
  
  // Form state
  showAddModal = false;
  showEditModal = false;
  newExpense: Expense = {
    date: '',
    category: '',
    description: '',
    amount: 0,
    payment_method: 'cash',
    notes: '',
    created_by: ''
  };
  editExpense: Expense | null = null;

  // Date filter
  dateFilter: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom' | 'all' = 'this_month';
  customStartDate: string = '';
  customEndDate: string = '';

  // Statistics
  stats = {
    totalExpenses: 0,
    expenseCount: 0,
    byCategory: [] as { category: string; total: number }[]
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
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

  loadExpenses(): void {
    this.apiService.getExpenses().subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        this.applyDateFilter();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading expenses:', err)
    });
  }

  applyDateFilter(): void {
    const now = new Date();
    let filtered = [...this.expenses];

    if (this.dateFilter === 'all') {
      this.filteredExpenses = filtered;
    } else if (this.dateFilter === 'custom') {
      if (this.customStartDate && this.customEndDate) {
        const startDate = new Date(this.customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.customEndDate);
        endDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }
      this.filteredExpenses = filtered;
    } else {
      const { startDate, endDate } = this.getDateRange(this.dateFilter);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
      this.filteredExpenses = filtered;
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

  calculateStatistics(): void {
    this.stats.expenseCount = this.filteredExpenses.length;
    this.stats.totalExpenses = this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Group by category
    const categoryMap = new Map<string, number>();
    this.filteredExpenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    this.stats.byCategory = Array.from(categoryMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  onDateFilterChange(): void {
    this.applyDateFilter();
  }

  onCustomDateChange(): void {
    if (this.dateFilter === 'custom') {
      this.applyDateFilter();
    }
  }

  getEmptyExpense(): Expense {
    return {
      date: this.formatDateForInput(new Date()),
      category: '',
      description: '',
      amount: 0,
      payment_method: 'cash',
      notes: '',
      created_by: this.currentUser
    };
  }

  openAddModal(): void {
    this.newExpense = this.getEmptyExpense();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newExpense = this.getEmptyExpense();
  }

  openEditModal(expense: Expense): void {
    this.editExpense = { ...expense };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editExpense = null;
  }

  saveExpense(): void {
    if (!this.newExpense.category || !this.newExpense.description || !this.newExpense.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.newExpense.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    this.newExpense.created_by = this.currentUser;

    this.apiService.createExpense(this.newExpense).subscribe({
      next: () => {
        this.loadExpenses();
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Error creating expense:', err);
        alert('Failed to create expense. Please try again.');
      }
    });
  }

  updateExpense(): void {
    if (!this.editExpense || !this.editExpense.id) return;

    if (!this.editExpense.category || !this.editExpense.description || !this.editExpense.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.editExpense.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    this.apiService.updateExpense(this.editExpense.id, this.editExpense).subscribe({
      next: () => {
        this.loadExpenses();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error updating expense:', err);
        alert('Failed to update expense. Please try again.');
      }
    });
  }

  deleteExpense(expense: Expense): void {
    if (!expense.id) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete this expense?\n\n` +
      `Category: ${expense.category}\n` +
      `Description: ${expense.description}\n` +
      `Amount: ₹${expense.amount.toFixed(2)}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    this.apiService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.loadExpenses();
      },
      error: (err) => {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense. Please try again.');
      }
    });
  }
}
