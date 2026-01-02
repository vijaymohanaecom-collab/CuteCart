import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
  networkError = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 'sales') {
        this.router.navigate(['/billing']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  login(): void {
    if (!this.username || !this.password) {
      this.error = 'Please enter username and password';
      return;
    }

    this.loading = true;
    this.error = '';
    this.networkError = false;

    console.log('Attempting login for:', this.username);

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        const user = this.authService.getCurrentUser();
        if (user?.role === 'sales') {
          this.router.navigate(['/billing']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.loading = false;

        if (err.status === 0) {
          this.networkError = true;
          this.error = 'Network error: Cannot connect to server. Check your connection and IP address.';
        } else if (err.status === 401) {
          this.error = 'Invalid username or password';
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          this.error = err.error?.error || 'Login failed. Please try again.';
        }
      }
    });
  }

  testConnection(): void {
    console.log('Testing API connection...');
    // This will be handled by the auth service
  }
}
