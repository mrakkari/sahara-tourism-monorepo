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
        <div class="drawer-brand">
          <span class="drawer-title">Dunes Insolites</span>
          <span class="drawer-badge">Administration</span>
        </div>
        <button class="drawer-close" (click)="mobileDrawerOpen = false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
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
              <svg class="chevron-icon" [class.rotated]="drawerExpanded === item.label"
                   width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
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
      <button class="drawer-logout" (click)="handleLogout()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Se déconnecter
      </button>
    </nav>

    <!-- ── TOP HEADER ────────────────────────────────────────────── -->
    <header class="top-header">
      <div class="header-inner">

        <!-- Left: Hamburger + Brand -->
        <div class="header-left">
          <button class="hamburger-btn" (click)="mobileDrawerOpen = true" aria-label="Menu">
            <span class="bar"></span><span class="bar"></span><span class="bar"></span>
          </button>
          <a routerLink="/admin-app" class="brand">
            <img src="https://www.dunes-insolites.com/wp-content/uploads/2024/05/Campement-Dunes-insolites-logo.png"
                 alt="Dunes Insolites" class="brand-logo">
            <div class="brand-text">
              <span class="brand-name">Dunes Insolites</span>
              <span class="brand-sub">Administration</span>
            </div>
          </a>
          <div class="header-divider"></div>
        </div>

        <!-- Center: Desktop navigation -->
        <nav class="desktop-nav">
          <ng-container *ngFor="let item of navItems">

            <!-- Simple route link -->
            <a *ngIf="!item.children"
               [routerLink]="item.route"
               routerLinkActive="nav-active"
               class="nav-link"
               [class.nav-cta]="item.highlight">
              <span class="nav-icon">{{ item.icon }}</span>
              {{ item.label }}
              <span class="nav-badge" *ngIf="item.badge">{{ item.badge }}</span>
            </a>

            <!-- Dropdown link -->
            <div *ngIf="item.children" class="nav-dropdown-host">
              <button
                [class.nav-cta]="item.highlight"
                [class.nav-link]="!item.highlight"
                [class.open]="activeDropdown === item.label"
                (click)="$event.stopPropagation(); toggleDropdown(item.label)">
                <span class="nav-icon">{{ item.icon }}</span>
                {{ item.label }}
                <svg class="cta-chevron" [class.rotated]="activeDropdown === item.label"
                     width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

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

        <!-- Right: Notifications + Logout -->
        <div class="header-right">
          <app-notification-panel></app-notification-panel>
          <button class="logout-btn" (click)="handleLogout()" title="Se déconnecter">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
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
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Variables ────────────────────────────────────────────── */
    /* Navy: #1A3A5C  |  Gold: #C59B3D  |  Navy-dark: #0F1E2E    */

    /* ── Top header ───────────────────────────────────────────── */
    .top-header {
      position: sticky; top: 0; z-index: 200;
      background: #1A3A5C;
      border-bottom: 1px solid rgba(197,155,61,0.22);
      box-shadow: 0 2px 16px rgba(15,30,46,0.28);
    }

    .header-inner {
      display: flex; align-items: center;
      height: 64px; padding: 0 24px; gap: 0;
      max-width: 1600px; margin: 0 auto;
    }

    /* ── Brand ────────────────────────────────────────────────── */
    .header-left {
      display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }

    .brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; flex-shrink: 0;
      transition: opacity 0.18s;
    }
    .brand:hover { opacity: 0.88; }

    .brand-logo {
      width: 34px; height: 34px; border-radius: 8px;
      object-fit: contain; background: rgba(255,255,255,0.12);
      padding: 3px; border: 1.5px solid rgba(197,155,61,0.35);
    }

    .brand-text {
      display: flex; flex-direction: column; gap: 1px; line-height: 1;
    }
    .brand-name {
      font-weight: 700; font-size: 0.9rem; color: #fff;
      font-family: 'Montserrat', sans-serif; letter-spacing: -0.01em;
    }
    .brand-sub {
      font-size: 0.58rem; font-weight: 600;
      color: #C59B3D; text-transform: uppercase; letter-spacing: 0.12em;
    }

    .header-divider {
      width: 1px; height: 26px;
      background: rgba(255,255,255,0.12);
      margin: 0 16px; flex-shrink: 0;
    }

    /* ── Hamburger (mobile only) ─────────────────────────────── */
    .hamburger-btn {
      display: none; flex-direction: column; justify-content: center;
      gap: 5px; background: none; border: none; cursor: pointer;
      padding: 7px; border-radius: 8px; transition: background 0.18s;
    }
    .hamburger-btn:hover { background: rgba(255,255,255,0.08); }
    .bar {
      display: block; width: 21px; height: 2px;
      background: rgba(255,255,255,0.82); border-radius: 2px;
    }

    /* ── Desktop nav ──────────────────────────────────────────── */
    .desktop-nav {
      flex: 1; display: flex; align-items: center;
      gap: 2px; overflow: visible;
    }

    .nav-link {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 11px; border-radius: 8px;
      color: rgba(255,255,255,0.70); text-decoration: none;
      font-size: 0.85rem; font-weight: 500;
      white-space: nowrap; transition: all 0.18s;
      border: none; background: none; cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    .nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
    .nav-link.nav-active {
      color: #C59B3D;
      background: rgba(197,155,61,0.14);
    }

    .nav-icon { font-size: 0.95rem; flex-shrink: 0; }

    .cta-chevron {
      margin-left: 2px; flex-shrink: 0;
      transition: transform 0.2s ease;
      color: currentColor;
    }
    .cta-chevron.rotated { transform: rotate(180deg); }

    .nav-badge {
      background: #C59B3D; color: #0F1E2E;
      font-size: 0.65rem; font-weight: 800;
      padding: 1px 6px; border-radius: 10px;
    }

    /* CTA — Nouvelle Réservation */
    .nav-cta {
      display: flex; align-items: center; gap: 7px;
      padding: 7px 14px; border-radius: 8px;
      background: rgba(197,155,61,0.15);
      color: #C59B3D; font-size: 0.85rem; font-weight: 600;
      border: 1px solid rgba(197,155,61,0.35);
      cursor: pointer; white-space: nowrap; transition: all 0.18s;
      font-family: 'Inter', sans-serif;
    }
    .nav-cta:hover, .nav-cta.open {
      background: #C59B3D; color: #0F1E2E;
      border-color: #C59B3D;
    }

    /* ── Dropdowns ────────────────────────────────────────────── */
    .nav-dropdown-host { position: relative; }

    .dropdown-panel {
      position: absolute; top: calc(100% + 8px); left: 0;
      min-width: 248px; background: #1A3A5C;
      border: 1px solid rgba(197,155,61,0.28);
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 12px 32px rgba(15,30,46,0.45);
      animation: dropIn .16s ease; z-index: 300;
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dropdown-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 16px;
      color: rgba(255,255,255,0.65); text-decoration: none;
      transition: all .15s;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover {
      background: rgba(197,155,61,0.12); color: #C59B3D;
    }
    .dropdown-item:hover strong { color: #d4aa56; }

    .d-icon { font-size: 1.1rem; min-width: 22px; text-align: center; flex-shrink: 0; }
    .dropdown-item strong {
      display: block; font-size: 0.875rem; font-weight: 600;
      color: rgba(255,255,255,0.88);
    }
    .dropdown-item small {
      display: block; font-size: 0.7rem;
      color: rgba(255,255,255,0.38); margin-top: 2px;
    }

    /* ── Header right ─────────────────────────────────────────── */
    .header-right {
      display: flex; align-items: center;
      gap: 10px; flex-shrink: 0; margin-left: auto;
    }

    .logout-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 13px; border-radius: 8px;
      background: transparent; color: rgba(255,255,255,0.60);
      border: 1px solid rgba(255,255,255,0.14);
      font-size: 0.8rem; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      transition: all .18s; font-family: 'Inter', sans-serif;
    }
    .logout-btn:hover {
      background: rgba(192,57,43,0.18);
      border-color: rgba(192,57,43,0.45);
      color: #e57373;
    }

    /* ── Page content ─────────────────────────────────────────── */
    .page-main {
      min-height: calc(100vh - 64px);
      background: #F5F7FA;
    }

    /* ── Mobile drawer ────────────────────────────────────────── */
    .drawer-backdrop {
      position: fixed; inset: 0;
      background: rgba(15,30,46,0.60); z-index: 400;
    }

    .mobile-drawer {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 272px; background: #0F1E2E;
      border-right: 1px solid rgba(197,155,61,0.16);
      z-index: 500; display: flex; flex-direction: column;
      transform: translateX(-100%); transition: transform .26s ease;
    }
    .mobile-drawer.open { transform: translateX(0); }

    .drawer-header {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .drawer-logo {
      width: 34px; height: 34px; border-radius: 8px;
      object-fit: contain; background: rgba(255,255,255,0.08);
      padding: 3px; border: 1.5px solid rgba(197,155,61,0.30);
      flex-shrink: 0;
    }
    .drawer-brand { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .drawer-title { font-weight: 700; color: #fff; font-size: 0.9rem; }
    .drawer-badge {
      font-size: 0.58rem; font-weight: 600; color: #C59B3D;
      text-transform: uppercase; letter-spacing: 0.12em;
    }
    .drawer-close {
      background: none; border: none; color: rgba(255,255,255,0.45);
      cursor: pointer; padding: 6px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.18s;
    }
    .drawer-close:hover {
      background: rgba(255,255,255,0.08); color: #fff;
    }

    .drawer-nav {
      list-style: none; padding: 10px 8px;
      margin: 0; flex: 1; overflow-y: auto;
    }
    .drawer-nav li { margin-bottom: 1px; }

    .drawer-item {
      display: flex; align-items: center; gap: 10px;
      padding: 11px 12px; border-radius: 8px;
      color: rgba(255,255,255,0.60); text-decoration: none;
      font-size: 0.875rem; font-weight: 500;
      width: 100%; border: none; background: none; cursor: pointer;
      transition: all .16s; text-align: left;
      font-family: 'Inter', sans-serif;
    }
    .drawer-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .drawer-item.active {
      background: rgba(197,155,61,0.14); color: #C59B3D;
    }
    .drawer-item.highlight { color: #C59B3D; }

    .chevron-icon {
      margin-left: auto; color: rgba(255,255,255,0.35);
      transition: transform 0.2s ease; flex-shrink: 0;
    }
    .chevron-icon.rotated { transform: rotate(180deg); }

    .drawer-children { padding-left: 10px; margin-bottom: 2px; }
    .drawer-child {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 12px; border-radius: 8px;
      color: rgba(255,255,255,0.45); text-decoration: none;
      font-size: 0.83rem; transition: all .15s;
    }
    .drawer-child:hover {
      background: rgba(197,155,61,0.10); color: #C59B3D;
    }

    .item-icon { font-size: 0.95rem; min-width: 20px; text-align: center; }
    .nav-badge {
      background: #C59B3D; color: #0F1E2E;
      font-size: 0.65rem; font-weight: 800;
      padding: 1px 6px; border-radius: 10px; margin-left: auto;
    }

    .drawer-logout {
      margin: 10px 8px 16px; padding: 11px 14px;
      background: rgba(192,57,43,0.18); color: #e57373;
      border: 1px solid rgba(192,57,43,0.30);
      border-radius: 8px; cursor: pointer;
      font-size: 0.875rem; font-weight: 600;
      text-align: left; display: flex; align-items: center; gap: 8px;
      transition: all .18s; font-family: 'Inter', sans-serif;
    }
    .drawer-logout:hover {
      background: rgba(192,57,43,0.32);
      border-color: rgba(192,57,43,0.55);
    }

    /* ── Responsive ───────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .desktop-nav { display: none; }
      .hamburger-btn { display: flex; }
      .logout-label { display: none; }
      .brand-sub { display: none; }
    }
    @media (max-width: 640px) {
      .header-inner { padding: 0 16px; }
      .brand-name { display: none; }
      .header-divider { display: none; }
    }
  `]
})
export class MainLayoutComponent {
  activeDropdown: string | null = null;
  mobileDrawerOpen = false;
  drawerExpanded: string | null = null;

  navItems: NavItem[] = [
    {
      label: 'Nouvelle Réservation', icon: '✦', highlight: true,
      children: [
        { label: 'Hébergement', icon: '🏕️', route: '/nouvelle-reservation/hebergement', description: 'Séjour au camping avec activités' },
        { label: 'Tours',       icon: '🗺️', route: '/nouvelle-reservation/tours',        description: 'Excursions packagées multi-jours' },
        { label: 'Extras',      icon: '✨', route: '/nouvelle-reservation/extras',       description: 'Services additionnels sans séjour' },
      ]
    },
    { label: 'Réservations', icon: '📅', route: '/reservations' },
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
