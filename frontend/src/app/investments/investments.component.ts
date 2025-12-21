import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

interface Investment {
  id?: number;
  date: string;
  description: string;
  person: string;
  amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface InvestmentStatistics {
  totalInvestments: number;
  totalAmount: number;
  recentInvestments: number;
  recentAmount: number;
  thisMonthInvestments: number;
  thisMonthAmount: number;
  byPerson: Array<{ person: string; count: number; total_amount: number }>;
  topInvestor: { person: string; total_amount: number; investment_count: number } | null;
}

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investments.component.html',
  styleUrls: ['./investments.component.css']
})
export class InvestmentsComponent implements OnInit {
  investments: Investment[] = [];
  filteredInvestments: Investment[] = [];
  statistics: InvestmentStatistics = {
    totalInvestments: 0,
    totalAmount: 0,
    recentInvestments: 0,
    recentAmount: 0,
    thisMonthInvestments: 0,
    thisMonthAmount: 0,
    byPerson: [],
    topInvestor: null
  };

  // Modal state
  showModal = false;
  editMode = false;
  currentInvestment: Investment = this.getEmptyInvestment();

  // Filters
  searchTerm: string = '';
  personFilter: string = 'all';
  startDate: string = '';
  endDate: string = '';

  // Person list
  persons: string[] = [];

  // Loading state
  loading: boolean = false;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInvestments();
    this.loadStatistics();
    this.loadPersons();
  }

  getEmptyInvestment(): Investment {
    return {
      date: new Date().toISOString().split('T')[0],
      description: '',
      person: '',
      amount: 0,
      notes: ''
    };
  }

  loadInvestments(): void {
    this.loading = true;
    this.apiService.getInvestments(this.startDate, this.endDate, this.personFilter !== 'all' ? this.personFilter : undefined).subscribe({
      next: (data) => {
        this.investments = data || [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading investments:', err);
        console.error('Error details:', err.message, err.status);
        this.investments = [];
        this.filteredInvestments = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStatistics(): void {
    this.apiService.getInvestmentStatistics(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.statistics = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        // Set default statistics on error
        this.statistics = {
          totalInvestments: 0,
          totalAmount: 0,
          recentInvestments: 0,
          recentAmount: 0,
          thisMonthInvestments: 0,
          thisMonthAmount: 0,
          byPerson: [],
          topInvestor: null
        };
        this.cdr.detectChanges();
      }
    });
  }

  loadPersons(): void {
    this.apiService.getInvestmentPersons().subscribe({
      next: (data) => {
        this.persons = data || [];
      },
      error: (err) => {
        console.error('Error loading persons:', err);
        this.persons = [];
      }
    });
  }

  applyFilters(): void {
    this.filteredInvestments = this.investments.filter(investment => {
      const matchesSearch = !this.searchTerm || 
        investment.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        investment.person.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (investment.notes && investment.notes.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onPersonFilterChange(): void {
    this.loadInvestments();
    this.loadStatistics();
  }

  onDateFilterApply(): void {
    if (this.startDate && this.endDate) {
      this.loadInvestments();
      this.loadStatistics();
    }
  }

  clearDateFilter(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadInvestments();
    this.loadStatistics();
  }

  openAddModal(): void {
    this.editMode = false;
    this.currentInvestment = this.getEmptyInvestment();
    this.showModal = true;
  }

  openEditModal(investment: Investment): void {
    this.editMode = true;
    this.currentInvestment = { ...investment };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentInvestment = this.getEmptyInvestment();
  }

  saveInvestment(): void {
    if (!this.currentInvestment.date || !this.currentInvestment.description || 
        !this.currentInvestment.person || !this.currentInvestment.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.currentInvestment.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (this.editMode && this.currentInvestment.id) {
      this.apiService.updateInvestment(this.currentInvestment.id, this.currentInvestment).subscribe({
        next: () => {
          this.loadInvestments();
          this.loadStatistics();
          this.loadPersons();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating investment:', err);
          alert('Failed to update investment');
        }
      });
    } else {
      this.apiService.createInvestment(this.currentInvestment).subscribe({
        next: () => {
          this.loadInvestments();
          this.loadStatistics();
          this.loadPersons();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating investment:', err);
          alert('Failed to create investment');
        }
      });
    }
  }

  deleteInvestment(investment: Investment): void {
    if (!investment.id) return;
    
    if (confirm(`Are you sure you want to delete this investment of ${this.formatCurrency(investment.amount)} from ${investment.person}?`)) {
      this.apiService.deleteInvestment(investment.id).subscribe({
        next: () => {
          this.loadInvestments();
          this.loadStatistics();
          this.loadPersons();
        },
        error: (err) => {
          console.error('Error deleting investment:', err);
          alert('Failed to delete investment');
        }
      });
    }
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
}
