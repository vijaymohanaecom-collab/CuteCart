import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  sidebarOpen = false;
  isMobile = false;
  storePhone = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.checkScreenSize();
    this.loadStorePhone();
  }

  loadStorePhone(): void {
    this.settingsService.settings$.subscribe(settings => {
      if (settings && settings.store_phone) {
        this.storePhone = settings.store_phone;
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    // Auto-close sidebar on mobile when screen size changes
    if (this.isMobile && this.sidebarOpen) {
      this.sidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  closeSidebarOnMobile(): void {
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
