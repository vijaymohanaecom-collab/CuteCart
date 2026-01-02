import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isLoggedIn();
  
  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    const returnUrl = state.url !== '/' ? state.url : null;
    
    // Navigate to login with redirect URL
    router.navigate(['/login'], { 
      queryParams: returnUrl ? { returnUrl } : null 
    });
    return false;
  }

  // Check for role-based redirection
  const user = authService.getCurrentUser();
  const isSalesPerson = user?.role === 'sales';
  const isDashboardRoute = state.url === '/dashboard' || state.url === '/';

  // Redirect sales personnel from dashboard to billing
  if (isSalesPerson && isDashboardRoute) {
    router.navigate(['/billing']);
    return false;
  }

  authService.resetInactivityTimer();
  return true;
};
