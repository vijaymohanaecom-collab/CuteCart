import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  username = '';
  newPassword = '';
  confirmPassword = '';
  error = '';
  success = '';
  loading = false;

  constructor(private http: HttpClient) {}

  resetPassword(): void {
    this.error = '';
    this.success = '';

    if (!this.username || !this.newPassword || !this.confirmPassword) {
      this.error = 'All fields are required';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;

    this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      username: this.username,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.success = 'Password reset successfully. You can now login with your new password.';
        this.username = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to reset password. Please contact administrator.';
        this.loading = false;
      }
    });
  }
}
