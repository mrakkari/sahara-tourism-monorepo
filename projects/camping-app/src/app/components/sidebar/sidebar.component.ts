import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SidebarItem {
    label: string;
    icon: string;
    route: string;
    badge?: number;
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <nav class="glass-sidebar" [class.collapsed]="collapsed">
      <!-- Header / Logo -->
      <div class="sidebar-header">
        <div class="logo-wrapper">
          <div class="logo-icon">{{ icon }}</div>
          <span class="logo-text" *ngIf="!collapsed">{{ title }}</span>
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()">
          {{ collapsed ? '→' : '←' }}
        </button>
      </div>

      <!-- Navigation Items -->
      <ul class="nav-items">
        <li *ngFor="let item of items">
          <a [routerLink]="item.route" 
             routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: item.route === '/' || item.route === ''}"
             class="nav-item"
             [title]="collapsed ? item.label : ''">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
            
            <!-- Badge -->
            <span class="nav-badge" *ngIf="item.badge && !collapsed">
              {{ item.badge }}
            </span>
            <span class="nav-dot" *ngIf="item.badge && collapsed"></span>
            
            <!-- Active Glow Indicator -->
            <div class="active-glow"></div>
          </a>
        </li>
      </ul>

      <!-- User Profile (Bottom) -->
      <div class="sidebar-footer" *ngIf="!collapsed">
        <div class="user-card-mini">
          <div class="user-avatar">👤</div>
          <div class="user-info">
            <span class="user-name">Admin</span>
            <span class="user-role">Super User</span>
          </div>
        </div>
      </div>
    </nav>
  `,
    styles: [`
    :host {
      display: block;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 50;
    }

    .glass-sidebar {
      height: 100%;
      width: 260px;
      background: #1a1a1a;
      border-right: 1px solid #333;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      overflow: hidden;
    }

    .glass-sidebar.collapsed {
      width: 70px;
    }

    /* Header */
    .sidebar-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #333;
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .logo-text {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      color: #fff;
      white-space: nowrap;
    }

    .collapse-btn {
      background: #333;
      border: none;
      color: #999;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #444;
        color: #fff;
      }
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
    }

    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 6px;
      color: #999;
      text-decoration: none;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .nav-icon {
      font-size: 1.25rem;
      min-width: 24px;
      text-align: center;
    }

    .nav-label {
      font-weight: 500;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    /* Active State */
    .nav-item.active {
      color: #fff;
      background: #333;
    }

    .active-glow {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #fff;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .nav-item.active .active-glow {
      opacity: 1;
    }

    .nav-item:hover {
      background: #2a2a2a;
      color: #fff;
    }

    /* Badges */
    .nav-badge {
      margin-left: auto;
      background: #dc3545;
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 10px;
    }

    .nav-dot {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 6px;
      height: 6px;
      background: #dc3545;
      border-radius: 50%;
    }

    /* Footer */
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid #333;
    }

    .user-card-mini {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #2a2a2a;
      padding: 10px;
      border-radius: 6px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: #444;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      color: #fff;
      font-weight: 500;
      font-size: 0.85rem;
    }

    .user-role {
      color: #777;
      font-size: 0.7rem;
    }
  `]
})
export class SidebarComponent {
    @Input() title = 'Menu';
    @Input() icon = '📋';
    @Input() items: SidebarItem[] = [];
    @Input() collapsed = false;
    @Output() collapsedChange = new EventEmitter<boolean>();

    toggleCollapse() {
        this.collapsed = !this.collapsed;
        this.collapsedChange.emit(this.collapsed);
    }
}
