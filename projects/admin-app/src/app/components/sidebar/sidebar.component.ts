import { Component, Input, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  highlight?: boolean;
  action?: string;
  children?: SidebarChild[];   // ← new: inline expandable sub-items
}

export interface SidebarChild {
  label: string;
  icon: string;
  route: string;
  description?: string;
}

@Component({
  selector: 'lib-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="mobileOpen && isMobile" class="mobile-backdrop" (click)="closeMobileSidebar()"></div>

    <nav class="dark-sidebar"
      [class.collapsed]="collapsed"
      [class.mobile-open]="mobileOpen"
      [class.mobile-hidden]="!mobileOpen && isMobile">

      <!-- Header -->
      <div class="sidebar-header">
        <div class="logo-wrapper">
          <div class="logo-icon">{{ icon }}</div>
          <div class="logo-text" *ngIf="!collapsed">
            <span class="logo-title">{{ title }}</span>
          </div>
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()" *ngIf="!isMobile"
          [title]="collapsed ? 'Expand' : 'Collapse'">
          <span *ngIf="collapsed">→</span>
          <span *ngIf="!collapsed">←</span>
        </button>
      </div>

      <!-- Nav Items -->
      <ul class="nav-items">
        <li *ngFor="let item of items" class="nav-li">

          <!-- ── Action item (expandable with children) ── -->
          <button *ngIf="item.action"
            class="nav-item nav-item-btn"
            [class.highlight]="item.highlight"
            [class.expanded]="expandedAction === item.action"
            [title]="collapsed ? item.label : ''"
            (click)="onActionItem(item)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
            <span class="expand-chevron" *ngIf="!collapsed && item.children">
              {{ expandedAction === item.action ? '▲' : '▼' }}
            </span>
          </button>

          <!-- ── Inline children panel ── -->
          <div class="children-panel"
            *ngIf="item.children && expandedAction === item.action && !collapsed">
            <a *ngFor="let child of item.children"
              class="child-item"
              [routerLink]="child.route"
              (click)="onChildClick()">
              <span class="child-icon">{{ child.icon }}</span>
              <div class="child-text">
                <strong>{{ child.label }}</strong>
                <small *ngIf="child.description">{{ child.description }}</small>
              </div>
            </a>
          </div>

          <!-- ── Collapsed: tooltip popover for children ── -->
          <div class="collapsed-children"
            *ngIf="item.children && expandedAction === item.action && collapsed">
            <a *ngFor="let child of item.children"
              class="collapsed-child"
              [routerLink]="child.route"
              [title]="child.label"
              (click)="onChildClick()">
              <span>{{ child.icon }}</span>
            </a>
          </div>

          <!-- ── Regular routed item ── -->
          <a *ngIf="!item.action"
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: item.route === '/'}"
            class="nav-item"
            [class.highlight]="item.highlight"
            [title]="collapsed ? item.label : ''"
            (click)="onNavItemClick()">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
            <span class="nav-badge" *ngIf="item.badge && !collapsed">{{ item.badge }}</span>
            <span class="nav-dot"   *ngIf="item.badge && collapsed"></span>
          </a>
        </li>
      </ul>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="onLogoutClick()" [title]="collapsed ? 'Se déconnecter' : ''">
          <span class="logout-icon">🚪</span>
          <span class="logout-text" *ngIf="!collapsed">Se déconnecter</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; position: fixed; top: 0; left: 0; height: 100vh; z-index: 1000; }

    .mobile-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5); z-index: 999;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .dark-sidebar {
      height: 100%; width: 280px;
      background: #000;
      border-right: 1px solid rgba(255,255,255,0.1);
      box-shadow: 2px 0 10px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      position: relative; z-index: 1000;
    }

    .dark-sidebar.collapsed { width: 80px; }

    @media (max-width: 1024px) {
      .dark-sidebar { transform: translateX(-100%); }
      .dark-sidebar.mobile-open { transform: translateX(0); }
      .dark-sidebar.mobile-hidden { transform: translateX(-100%); }
    }

    .sidebar-header {
      padding: 24px 20px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      min-height: 80px;
    }

    .logo-wrapper { display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1; }
    .logo-icon { font-size: 1.75rem; min-width: 32px; display: flex; align-items: center; justify-content: center; }
    .logo-text { display: flex; flex-direction: column; overflow: hidden; }
    .logo-title { font-weight: 700; font-size: 1rem; color: #fff; white-space: nowrap; }

    .collapse-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8; width: 32px; height: 32px;
      border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; font-size: 1rem; flex-shrink: 0;
    }

    .collapse-btn:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(245,158,11,0.3); }

    .nav-items {
      list-style: none; padding: 16px 12px; margin: 0;
      flex: 1; display: flex; flex-direction: column; gap: 4px;
      overflow-y: auto; overflow-x: hidden;
    }

    .nav-li { display: flex; flex-direction: column; }

    /* ── Shared nav-item styles ── */
    .nav-item, .nav-item-btn {
      position: relative;
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-radius: 10px;
      color: #94a3b8; text-decoration: none;
      transition: all 0.2s ease;
      font-size: 0.95rem; font-weight: 500;
      border-left: 4px solid transparent;
      width: 100%; cursor: pointer;
    }

    .nav-item-btn {
      background: transparent;
      border-top: none; border-right: none; border-bottom: none;
      border-left: 4px solid transparent;
      text-align: left;
    }

    .nav-icon { font-size: 1.25rem; min-width: 24px; text-align: center; transition: transform 0.2s; }
    .nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

    .nav-item:hover, .nav-item-btn:hover { background: rgba(31,41,55,0.7); color: #fff; }
    .nav-item:hover .nav-icon, .nav-item-btn:hover .nav-icon { transform: scale(1.05); }

    .nav-item.active { background: #1f2937; color: #fff; border-left-color: #f59e0b; }

    .nav-item.highlight, .nav-item-btn.highlight {
      background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.1));
      color: #fbbf24; font-weight: 600;
    }

    .nav-item.highlight:hover, .nav-item-btn.highlight:hover {
      background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(251,191,36,0.2));
      color: #fcd34d;
    }

    /* expanded state: left border indicator */
    .nav-item-btn.expanded {
      background: linear-gradient(135deg, rgba(245,158,11,0.22), rgba(251,191,36,0.15));
      color: #fcd34d;
      border-left-color: #f59e0b;
      border-radius: 10px 10px 0 0;
    }

    /* chevron */
    .expand-chevron {
      font-size: 0.55rem;
      margin-left: auto;
      color: #64748b;
      transition: transform 0.2s;
    }

    .nav-badge {
      background: #dc2626; color: white;
      font-size: 0.7rem; font-weight: 700;
      padding: 2px 8px; border-radius: 12px;
      min-width: 20px; text-align: center; margin-left: auto;
    }

    .nav-dot {
      position: absolute; top: 10px; right: 10px;
      width: 8px; height: 8px;
      background: #dc2626; border-radius: 50%;
    }

    /* ── Children panel (expanded, not collapsed sidebar) ── */
    .children-panel {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(245,158,11,0.2);
      border-top: none;
      border-radius: 0 0 10px 10px;
      overflow: hidden;
      animation: slideDown 0.22s cubic-bezier(0.4,0,0.2,1);
      margin-bottom: 4px;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .child-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 16px 11px 20px;
      text-decoration: none;
      color: #94a3b8;
      transition: all 0.18s ease;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;

      &:last-child { border-bottom: none; }

      &:hover {
        background: rgba(245,158,11,0.1);
        color: #fbbf24;

        .child-icon { transform: scale(1.1); }
        strong { color: #fcd34d; }
      }
    }

    .child-icon {
      font-size: 1.1rem;
      min-width: 24px;
      text-align: center;
      transition: transform 0.2s;
    }

    .child-text {
      display: flex;
      flex-direction: column;
      gap: 1px;

      strong {
        font-size: 0.88rem;
        font-weight: 600;
        color: #cbd5e1;
        display: block;
      }

      small {
        font-size: 0.73rem;
        color: #475569;
        display: block;
        line-height: 1.3;
      }
    }

    /* ── Collapsed children: stacked icon-only buttons ── */
    .collapsed-children {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 8px;
      animation: slideDown 0.2s ease;
    }

    .collapsed-child {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 40px;
      border-radius: 8px;
      background: rgba(245,158,11,0.08);
      border: 1px solid rgba(245,158,11,0.2);
      text-decoration: none;
      font-size: 1.1rem;
      transition: all 0.18s;
      margin: 0 auto;
      cursor: pointer;

      &:hover {
        background: rgba(245,158,11,0.2);
        border-color: #f59e0b;
        transform: scale(1.05);
      }
    }

    /* ── Footer ── */
    .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.05); }

    .logout-btn {
      width: 100%; display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      background: #dc2626; color: white;
      border: none; border-radius: 10px;
      cursor: pointer; font-size: 0.95rem; font-weight: 600;
      transition: all 0.2s; justify-content: center;
    }

    .logout-btn:hover {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220,38,38,0.4);
    }

    .logout-icon { font-size: 1.25rem; }
    .logout-text { white-space: nowrap; }

    /* ── Collapsed overrides ── */
    .dark-sidebar.collapsed .sidebar-header { padding: 24px 12px; justify-content: center; }
    .dark-sidebar.collapsed .logo-wrapper { justify-content: center; }
    .dark-sidebar.collapsed .nav-items { padding: 16px 8px; }
    .dark-sidebar.collapsed .nav-item,
    .dark-sidebar.collapsed .nav-item-btn { justify-content: center; padding: 14px 8px; gap: 0; }
    .dark-sidebar.collapsed .logout-btn { padding: 14px 8px; justify-content: center; }

    * { box-sizing: border-box; }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() title = 'Campement Dunes Insolites';
  @Input() icon  = '🌐';
  @Input() items: SidebarItem[] = [];
  @Input() collapsed   = false;
  @Input() mobileOpen  = false;

  @Output() collapsedChange  = new EventEmitter<boolean>();
  @Output() mobileOpenChange = new EventEmitter<boolean>();
  @Output() logoutClick      = new EventEmitter<void>();
  @Output() itemClick        = new EventEmitter<SidebarItem>();

  isMobile = false;
  expandedAction: string | null = null;  // tracks which action item is open

  ngOnInit() { this.checkScreenSize(); }

  @HostListener('window:resize')
  onResize() { this.checkScreenSize(); }

  private checkScreenSize() { this.isMobile = window.innerWidth < 1024; }

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

  onNavItemClick()  { this.closeMobileSidebar(); }
  onLogoutClick()   { this.logoutClick.emit(); }

  onActionItem(item: SidebarItem): void {
    if (item.children?.length) {
      // Toggle the inline sub-menu
      this.expandedAction = this.expandedAction === item.action ? null : (item.action ?? null);
    } else {
      // No children — bubble up to parent as before
      this.itemClick.emit(item);
    }
  }

  onChildClick(): void {
    this.expandedAction = null;
    this.closeMobileSidebar();
  }
}