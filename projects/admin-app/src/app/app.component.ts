import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, SidebarItem } from './components/sidebar/sidebar.component';
import { NotificationPanelComponent } from './components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, SidebarComponent, NotificationPanelComponent],
  template: `
    <div class="admin-layout">
      <!-- Dark Sidebar with New Menu Structure -->
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
            <!-- Hamburger Menu (Mobile Only) -->
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
            <!-- NEW: Notification Panel Component -->
            <app-notification-panel></app-notification-panel>
            <div class="user-menu">
              <span class="user-avatar">👤</span>
              <span class="user-name">Admin</span>
            </div>
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

    .hamburger-icon {
      display: block;
    }

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

    .search-icon {
      opacity: 0.6;
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.95rem;
      min-width: 200px;
    }

    .notification-btn {
      position: relative;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.05);
      width: 44px;
      height: 44px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1.25rem;
      transition: all 0.2s ease;
    }

    .notification-btn:hover {
      background: #f8fafc;
      border-color: #f59e0b;
    }

    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #dc2626;
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .user-menu:hover {
      background: #f8fafc;
      border-color: #f59e0b;
    }

    .user-avatar {
      font-size: 1.25rem;
    }

    .user-name {
      font-weight: 500;
      color: #1E293B;
    }

    .page-content {
      flex: 1;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Mobile Responsive */
    @media (max-width: 1024px) {
      .admin-content {
        margin-left: 0;
      }

      .admin-content.sidebar-collapsed {
        margin-left: 0;
      }

      .hamburger-btn {
        display: flex;
      }

      .search-input {
        min-width: 150px;
      }
    }

    @media (max-width: 768px) {
      .top-bar {
        padding: 12px 16px;
      }

      .page-title {
        font-size: 1.25rem;
      }

      .search-box {
        display: none;
      }

      .top-bar-right {
        gap: 12px;
      }
    }

    @media (max-width: 480px) {
      .user-name {
        display: none;
      }
    }
  `]
})
export class AppComponent {
  title = 'admin-app';
  pageTitle = 'Dashboard';
  sidebarCollapsed = false;
  mobileMenuOpen = false;

  constructor(private router: Router) { }

  sidebarItems: SidebarItem[] = [
    {
      label: 'Nouvelle Réservation',
      icon: '➕',
      route: '/nouvelle-reservation',
      highlight: true
    },
    {
      label: 'Réservations',
      icon: '📅',
      route: '/reservations',
      badge: 5
    },
    {
      label: 'Factures',
      icon: '📄',
      route: '/factures'
    },
    {
      label: 'Proformas',
      icon: '📋',
      route: '/proformas'
    },
    {
      label: 'Clients',
      icon: '👥',
      route: '/clients'
    },
    {
      label: 'Produits',
      icon: '📦',
      route: '/produits'
    },
    {
      label: 'Statistiques',
      icon: '📊',
      route: '/statistiques'
    },
  ];

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  handleLogout() {
    console.log('Logout clicked - implement authentication logout here');
    // TODO: Implement actual logout logic
    // this.authService.logout();
    // this.router.navigate(['/login']);
    alert('Logout functionality - to be implemented');
  }
}
