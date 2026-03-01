import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, SidebarItem } from '../../components/sidebar/sidebar.component';
import { NotificationPanelComponent } from '../../components/notification-panel/notification-panel.component';
import { AuthService } from '../../../../../shared/src/lib/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, SidebarComponent, NotificationPanelComponent],
  template: `
    <div class="admin-layout">
      <!-- Dark Sidebar -->
      <lib-sidebar
        title="Campement Dunes Insolites"
        icon="🌐"
        [items]="sidebarItems"
        [(collapsed)]="sidebarCollapsed"
        [(mobileOpen)]="mobileMenuOpen"
        (logoutClick)="handleLogout()">
      </lib-sidebar>

      <!-- Main Content Area -->
      <main class="admin-content" [class.sidebar-collapsed]="sidebarCollapsed">
        <!-- Top Bar -->
        <header class="top-bar">
          <div class="top-bar-left">
            <button class="hamburger-btn" (click)="toggleMobileMenu()">
              <span class="hamburger-icon">☰</span>
            </button>
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="top-bar-right">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="search" placeholder="Rechercher..." class="search-input">
            </div>
            <app-notification-panel></app-notification-panel>
            <button class="btn-deconnexion" (click)="handleLogout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #FFFFFF;
    }

    .admin-content {
      flex: 1;
      margin-left: 280px;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .admin-content.sidebar-collapsed {
      margin-left: 80px;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .hamburger-btn {
      display: none;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.1);
      width: 44px;
      height: 44px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1.5rem;
      color: #1e293b;
      transition: all 0.2s ease;
      align-items: center;
      justify-content: center;
    }

    .hamburger-btn:hover {
      background: #f8fafc;
      border-color: #f59e0b;
    }

    .hamburger-icon { display: block; }

    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1E293B;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      padding: 10px 16px;
      transition: all 0.3s ease;
    }

    .search-box:focus-within {
      border-color: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
    }

    .search-icon { opacity: 0.6; }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.95rem;
      min-width: 200px;
    }

    .btn-deconnexion {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      background: transparent;
      border: 1.5px solid #ef4444;
      border-radius: 10px;
      color: #ef4444;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      svg { width: 16px; height: 16px; flex-shrink: 0; }

      &:hover {
        background: #ef4444;
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
    }

    .page-content {
      flex: 1;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1024px) {
      .admin-content { margin-left: 0; }
      .admin-content.sidebar-collapsed { margin-left: 0; }
      .hamburger-btn { display: flex; }
      .search-input { min-width: 150px; }
    }

    @media (max-width: 768px) {
      .top-bar { padding: 12px 16px; }
      .page-title { font-size: 1.25rem; }
      .search-box { display: none; }
      .top-bar-right { gap: 12px; }
    }

    @media (max-width: 480px) {
      .btn-deconnexion span { display: none; }
    }
  `]
})
export class MainLayoutComponent {
  pageTitle = 'Dashboard';
  sidebarCollapsed = false;
  mobileMenuOpen = false;

  get userName(): string {
    return this.authService.getUser()?.name ?? 'Admin';
  }

  constructor(private router: Router, private authService: AuthService) { }

  sidebarItems: SidebarItem[] = [
    { label: 'Nouvelle Réservation', icon: '➕', route: '/nouvelle-reservation', highlight: true },
    { label: 'Réservations', icon: '📅', route: '/reservations', badge: 5 },
    { label: 'Factures', icon: '📄', route: '/factures' },
    { label: 'Proformas', icon: '📋', route: '/proformas' },
    { label: 'Clients', icon: '👥', route: '/clients' },
    { label: 'Produits', icon: '📦', route: '/produits' },
    { label: 'Statistiques', icon: '📊', route: '/statistiques' },
  ];

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
