import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AdminNotificationService } from '../../core/services/admin-notification.service';
import { Notification } from '../../core/models/admin.models';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-notification-panel',
    standalone: true,
    imports: [
        CommonModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        MatBadgeModule
    ],
    template: `
    <div class="notification-panel">
      <button
        mat-icon-button
        [matMenuTriggerFor]="notifMenu"
        class="notification-button"
        [matBadge]="(unreadCount$ | async) || 0"
        [matBadgeHidden]="(unreadCount$ | async) === 0"
        matBadgeColor="warn"
        matBadgeSize="small">
        <span class="notification-icon">🔔</span>
      </button>

      <mat-menu #notifMenu="matMenu" class="notification-menu" xPosition="before">
        <div class="notification-header" (click)="$event.stopPropagation()">
          <h3 class="notification-title">Notifications</h3>
          <button
            *ngIf="(unreadCount$ | async)! > 0"
            class="mark-all-read"
            (click)="markAllAsRead()">
            Tout marquer comme lu
          </button>
        </div>

        <div class="notification-list" (click)="$event.stopPropagation()">
          <div
            *ngFor="let notification of (notifications$ | async)?.slice(0, 5)"
            class="notification-item"
            [class.unread]="!notification.read"
            (click)="markAsRead(notification.id)">
            <div class="notification-icon-wrapper">
              {{ notification.icon || '📬' }}
            </div>
            <div class="notification-content">
              <h4 class="notification-item-title">{{ notification.title }}</h4>
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
            </div>
            <div *ngIf="!notification.read" class="unread-dot"></div>
          </div>

          <div *ngIf="(notifications$ | async)?.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>Aucune notification</p>
          </div>
        </div>

        <div class="notification-footer" (click)="$event.stopPropagation()">
          <button class="view-all-button" (click)="viewAllNotifications()">
            Voir toutes les notifications
          </button>
        </div>
      </mat-menu>
    </div>
  `,
    styles: [`
    .notification-panel {
      display: flex;
      align-items: center;
    }

    .notification-button {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.2s;
    }

    .notification-button:hover {
      background: #f8fafc;
      border-color: #f59e0b;
    }

    .notification-icon {
      font-size: 1.25rem;
    }

    /* Notification Menu Styling */
    ::ng-deep .notification-menu .mat-mdc-menu-panel {
      width: 380px;
      max-width: 90vw;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    ::ng-deep .notification-menu .mat-mdc-menu-content {
      padding: 0;
    }

    .notification-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notification-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .mark-all-read {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .mark-all-read:hover {
      background: rgba(59, 130, 246, 0.1);
    }

    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
    }

    .notification-item:hover {
      background: #f8fafc;
    }

    .notification-item.unread {
      background: #eff6ff;
    }

    .notification-icon-wrapper {
      font-size: 1.5rem;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-item-title {
      margin: 0 0 4px 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .notification-message {
      margin: 0 0 4px 0;
      font-size: 0.875rem;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notification-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: #3b82f6;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 16px;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 8px;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    .notification-footer {
      padding: 12px 20px;
      border-top: 1px solid #e5e7eb;
    }

    .view-all-button {
      width: 100%;
      padding: 10px;
      background: none;
      border: none;
      color: #3b82f6;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .view-all-button:hover {
      background: rgba(59, 130, 246, 0.1);
    }
  `]
})
export class NotificationPanelComponent implements OnInit {
    notifications$: Observable<Notification[]>;
    unreadCount$: Observable<number>;

    constructor(private notificationService: AdminNotificationService) {
        this.notifications$ = this.notificationService.getNotifications();
        this.unreadCount$ = this.notificationService.getUnreadCount();
    }

    ngOnInit(): void { }

    markAsRead(id: string): void {
        this.notificationService.markAsRead(id);
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead();
    }

    viewAllNotifications(): void {
        // Navigate to full notifications page (if you create one)
        console.log('View all notifications');
    }

    formatTime(timestamp: Date): string {
        const now = new Date();
        const diff = now.getTime() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        return `Il y a ${days}j`;
    }
}
