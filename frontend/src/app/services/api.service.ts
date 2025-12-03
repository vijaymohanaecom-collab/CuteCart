import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { Invoice } from '../models/invoice.model';
import { User } from '../models/user.model';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProduct(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string | number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  exportProductsCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/products/export/csv`, { 
      responseType: 'blob' 
    });
  }

  importProductsCSV(csvData: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/import/csv`, { csvData });
  }

  // Invoices
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices`);
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices`, invoice);
  }

  updateInvoice(id: number, data: any): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/invoices/${id}`, data);
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/invoices/${id}`);
  }

  getInvoiceStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/stats/summary`);
  }

  getCustomers(): Observable<{customer_name: string, customer_phone: string}[]> {
    return this.http.get<{customer_name: string, customer_phone: string}[]>(`${this.apiUrl}/invoices/customers/list`);
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // Settings
  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: Settings): Observable<Settings> {
    return this.http.put<Settings>(`${this.apiUrl}/settings`, settings);
  }

  backupDatabase(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/settings/backup`, { responseType: 'blob' });
  }
}
