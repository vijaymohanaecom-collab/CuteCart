import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<Settings | null>(null);
  public settings$ = this.settingsSubject.asObservable();
  
  private defaultSettings: Settings = {
    store_name: 'CuteCart',
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

  constructor(private apiService: ApiService) {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.getSettings().subscribe({
      next: (settings) => {
        this.settingsSubject.next(settings);
      },
      error: (err) => {
        console.error('Error loading settings:', err);
        // Use default settings if API fails
        this.settingsSubject.next(this.defaultSettings);
      }
    });
  }

  getSettings(): Settings {
    return this.settingsSubject.value || this.defaultSettings;
  }

  getLowStockThreshold(): number {
    const settings = this.getSettings();
    return settings.low_stock_threshold || 10;
  }

  getTaxRate(): number {
    const settings = this.getSettings();
    return settings.tax_rate || 0;
  }

  getInvoicePrefix(): string {
    const settings = this.getSettings();
    return settings.invoice_prefix || 'INV';
  }

  updateSettings(settings: Settings): Observable<Settings> {
    return this.apiService.updateSettings(settings).pipe(
      tap((updatedSettings) => {
        this.settingsSubject.next(updatedSettings);
      })
    );
  }

  refreshSettings(): void {
    this.loadSettings();
  }
}
