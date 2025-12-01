import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Settings } from '../models/settings.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  settings: Settings = {
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_website: '',
    tax_rate: 0,
    currency: 'INR',
    invoice_prefix: 'INV',
    invoice_footer: '',
    enable_barcode: 0,
    low_stock_threshold: 10
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading settings:', err)
    });
  }

  saveSettings(): void {
    this.apiService.updateSettings(this.settings).subscribe({
      next: () => {
        alert('Settings saved successfully!');
      },
      error: (err) => {
        console.error('Error saving settings:', err);
        alert('Failed to save settings');
      }
    });
  }

  backupDatabase(): void {
    this.apiService.backupDatabase().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cutecart-backup-${new Date().toISOString().slice(0, 10)}.db`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error backing up database:', err);
        alert('Failed to backup database');
      }
    });
  }
}
