import { HttpInterceptorFn, HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  let token: string | null = null;
  
  // Skip token check for login and public routes
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  try {
    token = localStorage.getItem('token') || sessionStorage.getItem('token');
  } catch (e) {
    console.warn('Auth interceptor: Cannot access storage:', e);
  }

  // Clone request with token if available
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.error('Authentication error:', error.error);
        authService.logout();
        
        // Store the current URL for redirect after login
        const currentUrl = router.url;
        if (currentUrl !== '/login') {
          router.navigate(['/login'], { 
            queryParams: { returnUrl: currentUrl } 
          });
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
