import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  highlight?: boolean; // For highlighting special items like " Nouvelle Réservation"
}

@Component({
  selector: 'lib-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Backdrop -->
    <div 
      *ngIf="mobileOpen && isMobile" 
      class="mobile-backdrop"
      (click)="closeMobileSidebar()">
    </div>

    <!-- Dark Sidebar -->
    <nav 
      class="dark-sidebar" 
      [class.collapsed]="collapsed"
      [class.mobile-open]="mobileOpen"
      [class.mobile-hidden]="!mobileOpen && isMobile">
      
      <!-- Header / Logo -->
      <div class="sidebar-header">
        <div class="logo-wrapper">
          <div class="logo-icon">🌐</div>
          <div class="logo-text" *ngIf="!collapsed">
            <span class="logo-title">{{ title }}</span>
          </div>
        </div>
        <button 
          class="collapse-btn" 
          (click)="toggleCollapse()"
          *ngIf="!isMobile"
          [title]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <span *ngIf="collapsed">→</span>
          <span *ngIf="!collapsed">←</span>
        </button>
      </div>

      <!-- Navigation Items -->
      <ul class="nav-items">
        <li *ngFor="let item of items">
          <a 
            [routerLink]="item.route" 
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: item.route === '/'}"
            class="nav-item"
            [class.highlight]="item.highlight"
            [title]="collapsed ? item.label : ''"
            (click)="onNavItemClick()">
            
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
            
            <!-- Badge -->
            <span class="nav-badge" *ngIf="item.badge && !collapsed">
              {{ item.badge }}
            </span>
            <span class="nav-dot" *ngIf="item.badge && collapsed"></span>
          </a>
        </li>
      </ul>

      <!-- Logout Button at Bottom -->
      <div class="sidebar-footer">
        <button 
          class="logout-btn" 
          (click)="onLogoutClick()"
          [title]="collapsed ? 'Se déconnecter' : ''">
          <span class="logout-icon">🚪</span>
          <span class="logout-text" *ngIf="!collapsed">Se déconnecter</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 1000;
    }

    /* Mobile Backdrop */
    .mobile-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Dark Sidebar Container */
    .dark-sidebar {
      height: 100%;
      width: 280px;
      background: #000000; /* Pure black for modern high-contrast design */
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
      
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 1000;
    }

    .dark-sidebar.collapsed {
      width: 80px;
    }

    /* Mobile Responsive */
    @media (max-width: 1024px) {
      .dark-sidebar {
        transform: translateX(-100%);
      }

      .dark-sidebar.mobile-open {
        transform: translateX(0);
      }

      .dark-sidebar.mobile-hidden {
        transform: translateX(-100%);
      }
    }

    /* Header */
    .sidebar-header {
      padding: 24px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      min-height: 80px;
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
      flex: 1;
    }

    .logo-icon {
      font-size: 1.75rem;
      min-width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .logo-title {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      color: #ffffff;
      white-space: nowrap;
      line-height: 1.3;
    }

    .collapse-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .collapse-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border-color: rgba(245, 158, 11, 0.3); /* amber accent */
    }

    /* Nav Items */
    .nav-items {
      list-style: none;
      padding: 16px 12px;
      margin: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .nav-items::-webkit-scrollbar {
      width: 6px;
    }

    .nav-items::-webkit-scrollbar-track {
      background: transparent;
    }

    .nav-items::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .nav-items::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      color: #94a3b8; /* text-gray-400 */
      text-decoration: none;
      transition: all 0.2s ease;
      font-size: 0.95rem;
      font-weight: 500;
      border-left: 4px solid transparent;
    }

    .nav-icon {
      font-size: 1.25rem;
      min-width: 24px;
      text-align: center;
      transition: transform 0.2s;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    /* Hover State */
    .nav-item:hover {
      background: rgba(31, 41, 55, 0.7); /* bg-gray-800/70 */
      color: #ffffff;
    }

    .nav-item:hover .nav-icon {
      transform: scale(1.05);
    }

    /* Active State - Dark theme with amber left border */
    .nav-item.active {
      background: #1f2937; /* bg-gray-800 */
      color: #ffffff;
      border-left-color: #f59e0b; /* border-amber-500 */
    }

    /* Highlighted Item (Nouvelle Réservation) */
    .nav-item.highlight {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.1) 100%);
      color: #fbbf24; /* text-amber-400 */
      font-weight: 600;
    }

    .nav-item.highlight:hover {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(251, 191, 36, 0.2) 100%);
      color: #fcd34d; /* text-amber-300 */
    }

    .nav-item.highlight.active {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.25) 100%);
      border-left-color: #fbbf24;
      color: #ffffff;
    }

    /* Badges */
    .nav-badge {
      background: #dc2626; /* bg-red-600 */
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      min-width: 20px;
      text-align: center;
      margin-left: auto;
    }

    .nav-dot {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      background: #dc2626;
      border-radius: 50%;
    }

    /* Footer */
    .sidebar-footer {
      padding: 16px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #dc2626; /* bg-red-600 */
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 600;
      transition: all 0.2s;
      justify-content: center;
    }

    .logout-btn:hover {
      background: #b91c1c; /* bg-red-700 */
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
    }

    .logout-btn:active {
      transform: translateY(0);
    }

    .logout-icon {
      font-size: 1.25rem;
    }

    .logout-text {
      white-space: nowrap;
    }

    /* Collapsed State Adjustments */
    .dark-sidebar.collapsed .sidebar-header {
      padding: 24px 12px;
      justify-content: center;
    }

    .dark-sidebar.collapsed .logo-wrapper {
      justify-content: center;
    }

    .dark-sidebar.collapsed .nav-items {
      padding: 16px 8px;
    }

    .dark-sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 14px 8px;
      gap: 0;
    }

    .dark-sidebar.collapsed .logout-btn {
      padding: 14px 8px;
      justify-content: center;
    }

    /* Smooth transitions */
    * {
      box-sizing: border-box;
    }
  `]
})
export class SidebarComponent {
  @Input() title = 'Campement Dunes Insolites';
  @Input() icon = '🌐';
  @Input() items: SidebarItem[] = [];
  @Input() collapsed = false;
  @Input() mobileOpen = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileOpenChange = new EventEmitter<boolean>();
  @Output() logoutClick = new EventEmitter<void>();

  isMobile = false;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  closeMobileSidebar() {
    if (this.isMobile) {
      this.mobileOpen = false;
      this.mobileOpenChange.emit(this.mobileOpen);
    }
  }

  onNavItemClick() {
    // Close sidebar on mobile when nav item is clicked
    this.closeMobileSidebar();
  }

  onLogoutClick() {
    this.logoutClick.emit();
  }
}
