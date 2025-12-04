import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { SettingsService } from '../services/settings.service';
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
    low_stock_threshold: 10,
    discount_presets: ''
  };
  
  discountPresetsInput = '';

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        
        // Parse discount presets for display
        if (settings.discount_presets) {
          try {
            const presets = JSON.parse(settings.discount_presets);
            this.discountPresetsInput = presets.join(',');
          } catch (e) {
            this.discountPresetsInput = '';
          }
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading settings:', err)
    });
  }

  saveSettings(): void {
    // Parse and validate discount presets
    if (this.discountPresetsInput) {
      try {
        const presets = this.discountPresetsInput
          .split(',') 
          .map(p => parseFloat(p.trim()))
          .filter(p => !isNaN(p) && p > 0 && p <= 100);
        
        this.settings.discount_presets = JSON.stringify(presets);
      } catch (e) {
        alert('Invalid discount presets format. Please use comma-separated numbers.');
        return;
      }
    } else {
      this.settings.discount_presets = JSON.stringify([5, 10, 15, 20]);
    }
    
    this.settingsService.updateSettings(this.settings).subscribe({
      next: () => {
        alert('Settings saved successfully! Changes will be applied across the application.');
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
