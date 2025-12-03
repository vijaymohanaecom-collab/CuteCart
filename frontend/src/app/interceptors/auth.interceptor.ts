import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token: string | null = null;

  try {
    token = localStorage.getItem('token');
  } catch (e) {
    console.warn('Auth interceptor: Cannot access localStorage:', e);
    // Try sessionStorage as fallback
    try {
      token = sessionStorage.getItem('token');
    } catch (e2) {
      console.warn('Auth interceptor: Cannot access sessionStorage either:', e2);
    }
  }

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.warn('Auth interceptor: No token available for request to:', req.url);
  }

  return next(req);
};
