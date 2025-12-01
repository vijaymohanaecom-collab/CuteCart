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
    this.initCharts();
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

  initCharts(): void {
    // Sales Chart
    const salesCtx = this.salesChartRef.nativeElement.getContext('2d');
    this.salesChart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales',
          data: [12, 19, 15, 25, 22, 30, 28],
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
            display: false
          }
        }
      }
    });

    // Category Chart
    const categoryCtx = this.categoryChartRef.nativeElement.getContext('2d');
    this.categoryChart = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Electronics', 'Clothing', 'Food', 'Others'],
        datasets: [{
          data: [30, 25, 20, 25],
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}
