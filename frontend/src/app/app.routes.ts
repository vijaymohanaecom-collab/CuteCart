import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'billing', 
    loadComponent: () => import('./billing/billing.component').then(m => m.BillingComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'products', 
    loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'invoices', 
    loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'expenses', 
    loadComponent: () => import('./expenses/expenses.component').then(m => m.ExpensesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'sales'] }
  },
  { 
    path: 'other-income', 
    loadComponent: () => import('./other-income/other-income.component').then(m => m.OtherIncomeComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'cash-register', 
    loadComponent: () => import('./cash-register/cash-register.component').then(m => m.CashRegisterComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'sales'] }
  },
  { 
    path: 'staff', 
    loadComponent: () => import('./staff/staff.component').then(m => m.StaffComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'backup', 
    loadComponent: () => import('./backup/backup.component').then(m => m.BackupComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'users', 
    loadComponent: () => import('./user-management/user-management').then(m => m.UserManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'reports', 
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./reset-password/reset-password').then(m => m.ResetPasswordComponent)
  }
];
