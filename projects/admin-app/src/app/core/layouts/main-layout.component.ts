import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationPanelComponent } from '../../components/notification-panel/notification-panel.component';
import { AuthService } from '../../../../../shared/src/lib/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  highlight?: boolean;
  badge?: number;
  children?: { label: string; icon: string; route: string; description?: string }[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, NotificationPanelComponent],
  template: `
    <!-- Mobile drawer backdrop -->
    <div class="drawer-backdrop" *ngIf="mobileDrawerOpen" (click)="mobileDrawerOpen = false"></div>

    <!-- Mobile drawer -->
    <nav class="mobile-drawer" [class.open]="mobileDrawerOpen">
      <div class="drawer-header">
        <img src="https://www.dunes-insolites.com/wp-content/uploads/2024/05/Campement-Dunes-insolites-logo.png"
             alt="Logo" class="drawer-logo">
        <span class="drawer-title">Dunes Insolites</span>
        <button class="drawer-close" (click)="mobileDrawerOpen = false">✕</button>
      </div>
      <ul class="drawer-nav">
        <li *ngFor="let item of navItems">
          <ng-container *ngIf="!item.children">
            <a [routerLink]="item.route"
               routerLinkActive="active"
               class="drawer-item"
               [class.highlight]="item.highlight"
               (click)="mobileDrawerOpen = false">
              <span class="item-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
              <span class="nav-badge" *ngIf="item.badge">{{ item.badge }}</span>
            </a>
          </ng-container>
          <ng-container *ngIf="item.children">
            <button class="drawer-item drawer-group-btn"
                    [class.highlight]="item.highlight"
                    (click)="toggleDrawerGroup(item.label)">
              <span class="item-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
              <span class="chevron">{{ drawerExpanded === item.label ? '▲' : '▼' }}</span>
            </button>
            <div class="drawer-children" *ngIf="drawerExpanded === item.label">
              <a *ngFor="let c of item.children"
                 [routerLink]="c.route"
                 class="drawer-child"
                 (click)="mobileDrawerOpen = false">
                <span>{{ c.icon }}</span>
                <span>{{ c.label }}</span>
              </a>
            </div>
          </ng-container>
        </li>
      </ul>
      <button class="drawer-logout" (click)="handleLogout()">🚪 Se déconnecter</button>
    </nav>

    <!-- TOP HEADER -->
    <header class="top-header">
      <div class="header-inner">

        <div class="header-left">
          <button class="hamburger-btn" (click)="mobileDrawerOpen = true" aria-label="Menu">
            <span class="bar"></span><span class="bar"></span><span class="bar"></span>
          </button>
          <a routerLink="/dashboard" class="brand">
            <img src="https://www.dunes-insolites.com/wp-content/uploads/2024/05/Campement-Dunes-insolites-logo.png"
                 alt="Dunes Insolites" class="brand-logo">
            <span class="brand-name">Dunes Insolites</span>
          </a>
        </div>

        <nav class="desktop-nav">
          <ng-container *ngFor="let item of navItems">

            <!-- Simple route item (no children) -->
            <a *ngIf="!item.children"
               [routerLink]="item.route"
               routerLinkActive="nav-active"
               class="nav-link"
               [class.nav-cta]="item.highlight">
              <span class="nav-icon">{{ item.icon }}</span>
              {{ item.label }}
              <span class="nav-badge" *ngIf="item.badge">{{ item.badge }}</span>
            </a>

            <!-- Items WITH children (Nouvelle Réservation + Catalogue) -->
            <div *ngIf="item.children" class="nav-dropdown-host">
              <button
                [class.nav-cta]="item.highlight"
                [class.nav-link]="!item.highlight"
                [class.open]="activeDropdown === item.label"
                (click)="$event.stopPropagation(); toggleDropdown(item.label)">
                <span class="nav-icon">{{ item.icon }}</span>
                {{ item.label }}
                <span class="cta-chevron">▾</span>
              </button>

              <!-- Dropdown panel -->
              <div class="dropdown-panel" *ngIf="activeDropdown === item.label">
                <a *ngFor="let c of item.children"
                   [routerLink]="c.route"
                   class="dropdown-item"
                   (click)="activeDropdown = null">
                  <span class="d-icon">{{ c.icon }}</span>
                  <div>
                    <strong>{{ c.label }}</strong>
                    <small *ngIf="c.description">{{ c.description }}</small>
                  </div>
                </a>
              </div>
            </div>

          </ng-container>
        </nav>

        <div class="header-right">
          <app-notification-panel></app-notification-panel>
          <button class="logout-btn" (click)="handleLogout()" title="Se déconnecter">
            <span>🚪</span>
            <span class="logout-label">Déconnexion</span>
          </button>
        </div>

      </div>
    </header>

    <!-- PAGE CONTENT -->
    <main class="page-main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host { display: block; }
    * { box-sizing: border-box; }

    /* ── Top header ───────────────────────────────────────────── */
    .top-header {
      position: sticky; top: 0; z-index: 200;
      background: #000;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 1px 8px rgba(0,0,0,0.4);
    }

    .header-inner {
      display: flex; align-items: center;
      height: 64px; padding: 0 24px; gap: 24px;
      max-width: 1600px; margin: 0 auto;
    }

    /* ── Brand ────────────────────────────────────────────────── */
    .header-left { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .brand-logo {
      width: 36px; height: 36px; border-radius: 50%;
      object-fit: contain; background: #fff;
      padding: 3px; border: 2px solid rgba(255,255,255,0.15);
    }
    .brand-name { font-weight: 700; font-size: 0.95rem; color: #fff; white-space: nowrap; }

    /* ── Hamburger (mobile only) ─────────────────────────────── */
    .hamburger-btn {
      display: none; flex-direction: column; justify-content: center;
      gap: 5px; background: none; border: none; cursor: pointer;
      padding: 6px; border-radius: 8px;
    }
    .hamburger-btn:hover { background: rgba(255,255,255,0.08); }
    .bar { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; }

    /* ── Desktop nav ──────────────────────────────────────────── */
    .desktop-nav {
      flex: 1; display: flex; align-items: center;
      gap: 4px; overflow: visible;
    }

    /* shared base for all nav buttons/links */
    .nav-link {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px; border-radius: 8px;
      color: #94a3b8; text-decoration: none;
      font-size: 0.875rem; font-weight: 500;
      white-space: nowrap; transition: all 0.18s;
      border: none; background: none; cursor: pointer;
    }
    .nav-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
    .nav-link.nav-active { color: #fff; background: #1f2937; }

    .nav-icon { font-size: 1rem; flex-shrink: 0; }
    .cta-chevron { font-size: 0.6rem; margin-left: 2px; flex-shrink: 0; }

    .nav-badge {
      background: #dc2626; color: #fff;
      font-size: 0.68rem; font-weight: 700;
      padding: 1px 6px; border-radius: 10px;
    }

    /* CTA style (Nouvelle Réservation) */
    .nav-cta {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 14px; border-radius: 8px;
      background: linear-gradient(135deg, rgba(245,158,11,.18), rgba(251,191,36,.12));
      color: #fbbf24; font-size: 0.875rem; font-weight: 600;
      border: 1px solid rgba(245,158,11,.3);
      cursor: pointer; white-space: nowrap; transition: all 0.18s;
    }
    .nav-cta:hover, .nav-cta.open {
      background: linear-gradient(135deg, rgba(245,158,11,.28), rgba(251,191,36,.22));
      color: #fcd34d; border-color: #f59e0b;
    }

    /* ── Dropdowns ────────────────────────────────────────────── */
    .nav-dropdown-host { position: relative; }

    .dropdown-panel {
      position: absolute; top: calc(100% + 8px); left: 0;
      min-width: 240px; background: #0f172a;
      border: 1px solid rgba(245,158,11,.25);
      border-radius: 10px; overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
      animation: dropIn .18s ease;
      z-index: 300;
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dropdown-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      color: #94a3b8; text-decoration: none;
      transition: all .16s;
      border-bottom: 1px solid rgba(255,255,255,.04);
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover { background: rgba(245,158,11,.1); color: #fbbf24; }
    .dropdown-item:hover strong { color: #fcd34d; }

    .d-icon { font-size: 1.2rem; min-width: 24px; text-align: center; flex-shrink: 0; }
    .dropdown-item strong { display: block; font-size: 0.875rem; font-weight: 600; color: #cbd5e1; }
    .dropdown-item small { display: block; font-size: 0.72rem; color: #475569; margin-top: 2px; }

    /* ── Header right ─────────────────────────────────────────── */
    .header-right {
      display: flex; align-items: center;
      gap: 12px; flex-shrink: 0; margin-left: auto;
    }

    .logout-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px;
      background: rgba(220,38,38,.15); color: #f87171;
      border: 1px solid rgba(220,38,38,.3);
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; transition: all .18s;
    }
    .logout-btn:hover { background: #dc2626; color: #fff; border-color: #dc2626; }

    /* ── Page content ─────────────────────────────────────────── */
    .page-main {
      min-height: calc(100vh - 64px);
      background: #f8fafc;
    }

    /* ── Mobile drawer ────────────────────────────────────────── */
    .drawer-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.55); z-index: 400;
    }

    .mobile-drawer {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 280px; background: #000;
      border-right: 1px solid rgba(255,255,255,.08);
      z-index: 500; display: flex; flex-direction: column;
      transform: translateX(-100%); transition: transform .28s ease;
    }
    .mobile-drawer.open { transform: translateX(0); }

    .drawer-header {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .drawer-logo { width: 36px; height: 36px; border-radius: 50%; background: #fff; padding: 3px; }
    .drawer-title { font-weight: 700; color: #fff; font-size: 0.95rem; flex: 1; }
    .drawer-close {
      background: none; border: none; color: #94a3b8;
      font-size: 1rem; cursor: pointer; padding: 4px 8px; border-radius: 6px;
    }
    .drawer-close:hover { background: rgba(255,255,255,.08); color: #fff; }

    .drawer-nav { list-style: none; padding: 12px 10px; margin: 0; flex: 1; overflow-y: auto; }
    .drawer-nav li { margin-bottom: 2px; }

    .drawer-item {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border-radius: 8px;
      color: #94a3b8; text-decoration: none;
      font-size: 0.9rem; font-weight: 500;
      width: 100%; border: none; background: none; cursor: pointer;
      transition: all .16s; text-align: left;
    }
    .drawer-item:hover { background: rgba(255,255,255,.06); color: #fff; }
    .drawer-item.active { background: #1f2937; color: #fff; }
    .drawer-item.highlight { color: #fbbf24; }

    .chevron { font-size: 0.55rem; margin-left: auto; color: #64748b; }

    .drawer-children { padding-left: 12px; margin-bottom: 4px; }
    .drawer-child {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 12px; border-radius: 8px;
      color: #64748b; text-decoration: none; font-size: 0.85rem;
      transition: all .16s;
    }
    .drawer-child:hover { background: rgba(245,158,11,.1); color: #fbbf24; }

    .item-icon { font-size: 1rem; min-width: 20px; text-align: center; }
    .nav-badge {
      background: #dc2626; color: #fff;
      font-size: 0.68rem; font-weight: 700;
      padding: 1px 6px; border-radius: 10px; margin-left: auto;
    }

    .drawer-logout {
      margin: 12px 10px; padding: 12px 14px;
      background: #dc2626; color: #fff;
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 0.9rem; font-weight: 600; text-align: left;
      transition: background .18s;
    }
    .drawer-logout:hover { background: #b91c1c; }

    /* ── Responsive ───────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .desktop-nav { display: none; }
      .hamburger-btn { display: flex; }
      .logout-label { display: none; }
      .brand-name { display: none; }
    }
    @media (max-width: 640px) {
      .header-inner { padding: 0 16px; }
    }
  `]
})
export class MainLayoutComponent {
  activeDropdown: string | null = null;
  mobileDrawerOpen = false;
  drawerExpanded: string | null = null;

  navItems: NavItem[] = [
    {
      label: 'Nouvelle Réservation', icon: '', highlight: true,
      children: [
        { label: 'Hébergement', icon: '🏕️', route: '/nouvelle-reservation/hebergement', description: 'Séjour au camping avec activités' },
        { label: 'Tours',       icon: '🗺️', route: '/nouvelle-reservation/tours',        description: 'Excursions packagées multi-jours' },
        { label: 'Extras',      icon: '✨', route: '/nouvelle-reservation/extras',       description: 'Services additionnels sans séjour' },
      ]
    },
    { label: 'Réservations', icon: '📅', route: '/reservations', badge: 5 },
    { label: 'Factures',     icon: '📄', route: '/factures' },
    { label: 'Proformas',    icon: '📋', route: '/proformas' },
    { label: 'Clients',      icon: '👥', route: '/clients' },
    {
      label: 'Catalogue', icon: '📦',
      children: [
        { label: 'Hébergements', icon: '🏕️', route: '/produits', description: 'Types de séjours disponibles' },
        { label: 'Tours',        icon: '🗺️', route: '/tours',    description: 'Excursions et circuits' },
        { label: 'Extras',       icon: '✨', route: '/extras',   description: 'Services additionnels' },
        { label: 'Sources',      icon: '📡', route: '/sources',  description: 'Origines des réservations' },
      ]
    },
    { label: 'Statistiques', icon: '📊', route: '/statistiques' },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  toggleDropdown(label: string): void {
    this.activeDropdown = this.activeDropdown === label ? null : label;
  }

  toggleDrawerGroup(label: string): void {
    this.drawerExpanded = this.drawerExpanded === label ? null : label;
  }

  // Close dropdown when clicking anywhere outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.nav-dropdown-host')) {
      this.activeDropdown = null;
    }
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}