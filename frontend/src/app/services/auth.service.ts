import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private inactivityTimer: any;
  private readonly INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours
  private storageAvailable = true;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkStorageAvailability();
    const user = this.getCurrentUser();
    if (user) {
      this.currentUserSubject.next(user);
      this.resetInactivityTimer();
    }
  }

  private checkStorageAvailability(): void {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      this.storageAvailable = true;
    } catch (e) {
      this.storageAvailable = false;
    }
  }

  private safeStorageGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('AuthService: localStorage not available, trying sessionStorage:', e);
      try {
        return sessionStorage.getItem(key);
      } catch (e2) {
        console.warn('AuthService: sessionStorage also not available:', e2);
        return null;
      }
    }
  }

  private safeStorageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('AuthService: localStorage not available, trying sessionStorage:', e);
      try {
        sessionStorage.setItem(key, value);
      } catch (e2) {
        console.warn('AuthService: sessionStorage also not available:', e2);
      }
    }
  }

  private safeStorageRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('AuthService: localStorage not available, trying sessionStorage:', e);
      try {
        sessionStorage.removeItem(key);
      } catch (e2) {
        console.warn('AuthService: sessionStorage also not available:', e2);
      }
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      tap((response: any) => {
        this.safeStorageSet('token', response.token);
        this.safeStorageSet('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.resetInactivityTimer();
      })
    );
  }

  logout(): void {
    this.safeStorageRemove('token');
    this.safeStorageRemove('user');
    this.currentUserSubject.next(null);
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.safeStorageGet('token');
  }

  getCurrentUser(): any {
    const user = this.safeStorageGet('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return this.safeStorageGet('token');
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isManager(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'manager';
  }

  canViewProfit(): boolean {
    return this.isManager();
  }

  resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(() => {
      this.autoLogout();
    }, this.INACTIVITY_TIMEOUT);
  }

  private autoLogout(): void {
    alert('Session expired due to inactivity. Please login again.');
    this.logout();
  }
}
