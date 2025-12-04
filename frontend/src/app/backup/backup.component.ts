import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

interface Backup {
  filename: string;
  size: number;
  created_at: string;
  type: 'local' | 'google_drive';
  drive_file_id?: string;
  drive_file_url?: string;
}

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backup.component.html',
  styleUrl: './backup.component.css'
})
export class BackupComponent implements OnInit {
  backups: Backup[] = [];
  status: any = null;
  loading = false;
  creatingBackup = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStatus();
    this.loadBackups();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  loadStatus(): void {
    this.apiService.getBackupStatus().subscribe({
      next: (status) => {
        this.status = status;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading backup status:', err)
    });
  }

  loadBackups(): void {
    this.loading = true;
    this.apiService.listBackups().subscribe({
      next: (response) => {
        this.backups = response.backups || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading backups:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createBackup(): void {
    if (this.creatingBackup) return;

    const confirm = window.confirm(
      'Create a new backup?\n\n' +
      'This will backup the entire database and configuration files.'
    );

    if (!confirm) return;

    this.creatingBackup = true;
    this.apiService.createBackup().subscribe({
      next: (response) => {
        alert('Backup created successfully!');
        this.creatingBackup = false;
        this.loadStatus();
        this.loadBackups();
      },
      error: (err) => {
        console.error('Error creating backup:', err);
        alert('Failed to create backup. Please try again.');
        this.creatingBackup = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteBackup(backup: Backup): void {
    const confirm = window.confirm(
      `Delete this backup?\n\n` +
      `File: ${backup.filename}\n` +
      `Size: ${this.formatBytes(backup.size)}\n` +
      `Created: ${new Date(backup.created_at).toLocaleString()}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirm) return;

    this.apiService.deleteBackup(backup.filename).subscribe({
      next: () => {
        this.loadBackups();
      },
      error: (err) => {
        console.error('Error deleting backup:', err);
        alert('Failed to delete backup. Please try again.');
      }
    });
  }

  downloadBackup(backup: Backup): void {
    const url = this.apiService.downloadBackup(backup.filename);
    window.open(url, '_blank');
  }

  openDriveLink(backup: Backup): void {
    if (backup.drive_file_url) {
      window.open(backup.drive_file_url, '_blank');
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getBackupAge(dateString: string): string {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }
}
