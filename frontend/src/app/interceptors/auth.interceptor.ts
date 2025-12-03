import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  let token: string | null = null;

  // Try to get token from localStorage
  try {
    token = localStorage.getItem('token');
  } catch (e) {
    console.warn('Auth interceptor: Cannot access localStorage:', e);
  }

  // Fallback to sessionStorage
  if (!token) {
    try {
      token = sessionStorage.getItem('token');
    } catch (e) {
      console.warn('Auth interceptor: Cannot access sessionStorage:', e);
    }
  }

  // Clone request with token if available
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else if (!req.url.includes('/auth/login')) {
    console.warn('Auth interceptor: No token available for request to:', req.url);
  }

  // Handle errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.error('Authentication error:', error.error);
        
        // Clear invalid token
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (e) {
          console.warn('Cannot clear localStorage:', e);
        }
        
        try {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        } catch (e) {
          console.warn('Cannot clear sessionStorage:', e);
        }
        
        // Redirect to login if not already there
        if (!req.url.includes('/auth/login') && router.url !== '/login') {
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
};
