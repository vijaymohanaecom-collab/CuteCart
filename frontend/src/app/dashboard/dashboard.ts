import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;

  stats = {
    todaySales: 0,
    todayCount: 0,
    monthSales: 0,
    monthCount: 0,
    totalSales: 0,
    totalCount: 0
  };

  salesChart: any;
  categoryChart: any;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    this.loadChartData();
  }

  loadStats(): void {
    this.apiService.getInvoiceStats().subscribe({
      next: (data) => {
        this.stats.todaySales = data.today.total;
        this.stats.todayCount = data.today.count;
        this.stats.monthSales = data.month.total;
        this.stats.monthCount = data.month.count;
        this.stats.totalSales = data.total.total;
        this.stats.totalCount = data.total.count;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  loadChartData(): void {
    // Load weekly sales data
    this.apiService.getWeeklySales().subscribe({
      next: (weeklyData) => {
        const labels = weeklyData.map(d => d.day);
        const data = weeklyData.map(d => d.total);
        this.initSalesChart(labels, data);
      },
      error: (err) => {
        console.error('Error loading weekly sales:', err);
        // Fallback to empty data
        this.initSalesChart(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [0, 0, 0, 0, 0, 0, 0]);
      }
    });

    // Load category sales data
    this.apiService.getCategorySales().subscribe({
      next: (categoryData) => {
        if (categoryData.length > 0) {
          const labels = categoryData.map(d => d.category || 'Uncategorized');
          const data = categoryData.map(d => d.total);
          this.initCategoryChart(labels, data);
        } else {
          // No data available
          this.initCategoryChart(['No Data'], [1]);
        }
      },
      error: (err) => {
        console.error('Error loading category sales:', err);
        // Fallback to empty data
        this.initCategoryChart(['No Data'], [1]);
      }
    });
  }

  initSalesChart(labels: string[], data: number[]): void {
    const salesCtx = this.salesChartRef.nativeElement.getContext('2d');
    this.salesChart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Sales (₹)',
          data: data,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const value = context.parsed?.y ?? 0;
                return '₹' + value.toFixed(2);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        }
      }
    });
  }

  initCategoryChart(labels: string[], data: number[]): void {
    const categoryCtx = this.categoryChartRef.nativeElement.getContext('2d');
    this.categoryChart = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#00f2fe',
            '#43e97b'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed ?? 0;
                return label + ': ₹' + value.toFixed(2);
              }
            }
          }
        }
      }
    });
  }
}
