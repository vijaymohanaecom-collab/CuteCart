import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  editMode = false;
  currentUser: User = this.getEmptyUser();

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('UserManagement ngOnInit called');
    this.loadUsers();
  }

  loadUsers(): void {
    console.log('Loading users...');
    this.apiService.getUsers().subscribe({
      next: (users) => {
        console.log('Users loaded:', users);
        console.log('Users type:', typeof users);
        console.log('Users is array:', Array.isArray(users));
        console.log('Users length:', users?.length);
        this.users = Array.isArray(users) ? users : [];
        console.log('Component users array:', this.users);
        this.cdr.detectChanges();
        console.log('Change detection triggered');
      },
      error: (err) => {
        console.error('Error loading users:', err);
        alert('Failed to load users. Check console for details.');
      }
    });
  }

  getEmptyUser(): User {
    return {
      username: '',
      password: '',
      role: 'sales'
    };
  }

  openAddModal(): void {
    this.editMode = false;
    this.currentUser = this.getEmptyUser();
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.editMode = true;
    this.currentUser = { ...user, password: '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentUser = this.getEmptyUser();
  }

  saveUser(): void {
    if (this.editMode && this.currentUser.id) {
      this.apiService.updateUser(this.currentUser.id, this.currentUser).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating user:', err);
          alert('Failed to update user');
        }
      });
    } else {
      this.apiService.createUser(this.currentUser).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating user:', err);
          alert(err.error?.error || 'Failed to create user');
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user "${user.username}"?`)) {
      this.apiService.deleteUser(user.id!).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert(err.error?.error || 'Failed to delete user');
        }
      });
    }
  }
}
