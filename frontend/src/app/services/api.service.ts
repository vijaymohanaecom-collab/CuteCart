import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { Invoice } from '../models/invoice.model';
import { User } from '../models/user.model';
import { Settings } from '../models/settings.model';
import { Expense } from '../models/expense.model';
import { Staff, Attendance, AttendanceWithStaff } from '../models/staff.model';

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

  addStock(productId: string | number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/${productId}/add-stock`, data);
  }

  getStockHistory(productId: string | number, limit?: number): Observable<any[]> {
    const url = limit 
      ? `${this.apiUrl}/products/${productId}/stock-history?limit=${limit}` 
      : `${this.apiUrl}/products/${productId}/stock-history`;
    return this.http.get<any[]>(url);
  }

  getStockSummary(productId: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${productId}/stock-summary`);
  }

  getAllStockHistory(limit?: number): Observable<any[]> {
    const url = limit 
      ? `${this.apiUrl}/products/stock-history/all?limit=${limit}` 
      : `${this.apiUrl}/products/stock-history/all`;
    return this.http.get<any[]>(url);
  }

  exportProductsCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/products/export/csv`, { 
      responseType: 'blob' 
    });
  }

  importProductsCSV(csvData: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/import/csv`, { csvData });
  }

  // Customers
  getCustomers(startDate?: string, endDate?: string): Observable<any[]> {
    let url = `${this.apiUrl}/customers`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any[]>(url);
  }

  getCustomerStatistics(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/customers/statistics`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any>(url);
  }

  exportCustomersCSV(startDate?: string, endDate?: string): Observable<Blob> {
    let url = `${this.apiUrl}/customers/export/csv`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get(url, { responseType: 'blob' });
  }

  // Investments
  getInvestments(startDate?: string, endDate?: string, person?: string): Observable<any[]> {
    let url = `${this.apiUrl}/investments?`;
    const params = [];
    if (startDate && endDate) {
      params.push(`startDate=${startDate}&endDate=${endDate}`);
    }
    if (person) {
      params.push(`person=${encodeURIComponent(person)}`);
    }
    return this.http.get<any[]>(url + params.join('&'));
  }

  getInvestmentStatistics(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/investments/statistics`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any>(url);
  }

  getInvestmentPersons(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/investments/persons`);
  }

  createInvestment(investment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/investments`, investment);
  }

  updateInvestment(id: number, investment: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/investments/${id}`, investment);
  }

  deleteInvestment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/investments/${id}`);
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

  getWeeklySales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invoices/stats/weekly`);
  }

  getCategorySales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invoices/stats/categories`);
  }

  getCustomersList(): Observable<{customer_name: string, customer_phone: string}[]> {
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

  // Expenses
  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses`);
  }

  getExpensesByDateRange(startDate: string, endDate: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses/range?startDate=${startDate}&endDate=${endDate}`);
  }

  getExpense(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/expenses/${id}`);
  }

  createExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/expenses`, expense);
  }

  updateExpense(id: number, expense: Expense): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/expenses/${id}`, expense);
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/expenses/${id}`);
  }

  getExpenseStats(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/expenses/stats/summary`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get(url);
  }

  // Staff
  getStaff(status?: string): Observable<Staff[]> {
    let url = `${this.apiUrl}/staff`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<Staff[]>(url);
  }

  getStaffMember(id: number): Observable<Staff> {
    return this.http.get<Staff>(`${this.apiUrl}/staff/${id}`);
  }

  createStaff(staff: Staff): Observable<Staff> {
    return this.http.post<Staff>(`${this.apiUrl}/staff`, staff);
  }

  updateStaff(id: number, staff: Staff): Observable<Staff> {
    return this.http.put<Staff>(`${this.apiUrl}/staff/${id}`, staff);
  }

  deleteStaff(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/staff/${id}`);
  }

  getStaffStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/staff/stats/summary`);
  }

  // Attendance
  getAttendance(params?: { date?: string; staff_id?: number; startDate?: string; endDate?: string }): Observable<AttendanceWithStaff[]> {
    let url = `${this.apiUrl}/attendance`;
    const queryParams: string[] = [];
    
    if (params) {
      if (params.date) queryParams.push(`date=${params.date}`);
      if (params.staff_id) queryParams.push(`staff_id=${params.staff_id}`);
      if (params.startDate) queryParams.push(`startDate=${params.startDate}`);
      if (params.endDate) queryParams.push(`endDate=${params.endDate}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    return this.http.get<AttendanceWithStaff[]>(url);
  }

  getAttendanceRecord(id: number): Observable<AttendanceWithStaff> {
    return this.http.get<AttendanceWithStaff>(`${this.apiUrl}/attendance/${id}`);
  }

  markAttendance(attendance: Attendance): Observable<AttendanceWithStaff> {
    return this.http.post<AttendanceWithStaff>(`${this.apiUrl}/attendance`, attendance);
  }

  updateAttendance(id: number, attendance: Partial<Attendance>): Observable<AttendanceWithStaff> {
    return this.http.put<AttendanceWithStaff>(`${this.apiUrl}/attendance/${id}`, attendance);
  }

  deleteAttendance(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/attendance/${id}`);
  }

  bulkMarkAttendance(date: string, records: Partial<Attendance>[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/bulk`, { date, records });
  }

  getAttendanceStats(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/attendance/stats/summary`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get(url);
  }

  // Backup
  getBackupStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/backup/status`);
  }

  createBackup(): Observable<any> {
    return this.http.post(`${this.apiUrl}/backup/create`, {});
  }

  listBackups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/backup/list`);
  }

  deleteBackup(filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/backup/${filename}`);
  }

  downloadBackup(filename: string): string {
    return `${this.apiUrl}/backup/download/${filename}`;
  }

  // Other Income
  getOtherIncome(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/other-income`);
  }

  getOtherIncomeByDateRange(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/other-income/range?startDate=${startDate}&endDate=${endDate}`);
  }

  getOtherIncomeStats(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/other-income/stats`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get(url);
  }

  createOtherIncome(income: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/other-income`, income);
  }

  updateOtherIncome(id: number, income: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/other-income/${id}`, income);
  }

  deleteOtherIncome(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/other-income/${id}`);
  }

  // Cash Register
  getCashRegisterEntries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cash-register`);
  }

  getTodayCashRegister(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cash-register/today`);
  }

  getCashRegisterByDate(date: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cash-register/date/${date}`);
  }

  getCashRegisterSummary(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/cash-register/summary`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get(url);
  }

  openCashRegister(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cash-register/open`, data);
  }

  closeCashRegister(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cash-register/close`, data);
  }

  updateCashRegister(date: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/cash-register/${date}`, data);
  }

  deleteCashRegister(date: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cash-register/${date}`);
  }

  runCashRegisterAutomation(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cash-register/automation/run`, {});
  }

  autoCloseYesterday(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cash-register/automation/auto-close-yesterday`, {});
  }

  autoOpenToday(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cash-register/automation/auto-open-today`, {});
  }

  // Notifications
  getNotifications(limit?: number): Observable<any[]> {
    const url = limit ? `${this.apiUrl}/notifications?limit=${limit}` : `${this.apiUrl}/notifications`;
    return this.http.get<any[]>(url);
  }

  getUnreadNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications/unread`);
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/read-all`, {});
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${id}`);
  }
}
