import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService, Notification } from '../../../../../shared/src/lib/auth/notification.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-notification-panel',
    standalone: true,
    imports: [CommonModule, MatMenuModule, MatIconModule, MatButtonModule, MatBadgeModule],
    template: `
      <div class="notification-panel">
        <!-- REPLACE with plain span like camping-app -->
        <button
          mat-icon-button
          [matMenuTriggerFor]="notifMenu"
          class="notification-button">
          <span class="notification-icon">🔔</span>
          <span class="notification-badge" 
                *ngIf="notificationService.unreadCount() > 0">
            {{ notificationService.unreadCount() }}
          </span>
        </button>

        <mat-menu #notifMenu="matMenu" class="notification-menu" xPosition="before">
          <div class="notification-header" (click)="$event.stopPropagation()">
            <h3 class="notification-title">Notifications</h3>
            <button
              *ngIf="notificationService.unreadCount() > 0"
              class="mark-all-read"
              (click)="markAllAsRead()">
              Tout marquer comme lu
            </button>
          </div>

          <div class="notification-list" (click)="$event.stopPropagation()">
            <div
              *ngFor="let notification of notificationService.notifications().slice(0, displayCount)"
              class="notification-item"
              [class.unread]="!notification.isRead"
              (click)="markAsRead(notification.notificationId, notification.reservationId)">
              <div class="notification-icon-wrapper">
                {{ getIcon(notification.type) }}
              </div>
              <div class="notification-content">
                <h4 class="notification-item-title">{{ notification.title }}</h4>
                <p class="notification-message">{{ notification.message }}</p>
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              <div *ngIf="!notification.isRead" class="unread-dot"></div>
            </div>

            <div *ngIf="notificationService.notifications().length === 0" class="empty-state">
              <span class="empty-icon">📭</span>
              <p>Aucune notification</p>
            </div>
          </div>

          <div class="notification-footer" (click)="$event.stopPropagation()">
              <button class="view-all-button" 
                      (click)="showMore()"
                      *ngIf="displayCount < notificationService.notifications().length">
                  Voir plus
              </button>
              <p class="all-loaded" 
                *ngIf="displayCount >= notificationService.notifications().length">
                  Toutes les notifications sont affichées
              </p>
          </div>
        </mat-menu>
      </div>
    `,
styles: [`
    .all-loaded { 
      text-align: center; 
      color: #94a3b8; 
      font-size: 0.875rem; 
      margin: 0; 
  }
    .notification-button { position: relative; width: 44px; height: 44px; border-radius: 12px; background: white; border: 1px solid rgba(0,0,0,0.05); transition: all 0.2s; }
    .notification-button:hover { background: #f8fafc; border-color: #f59e0b; }
    .notification-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
    .notification-icon { font-size: 1.25rem; }
    .notification-panel { display: flex; align-items: center; }
    ::ng-deep .notification-menu .mat-mdc-menu-panel { width: 380px; max-width: 90vw; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: #ffffff !important; }
    ::ng-deep .notification-menu .mat-mdc-menu-content { padding: 0; background: #ffffff !important; }
    .notification-header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #ffffff; }
    .notification-title { margin: 0; font-size: 1.125rem; font-weight: 600; color: #1e293b; }
    .mark-all-read { background: none; border: none; color: #3b82f6; font-size: 0.875rem; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
    .mark-all-read:hover { background: rgba(59,130,246,0.1); }
    .notification-list { max-height: 400px; overflow-y: auto; background: #ffffff; }
    .notification-item { display: flex; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s; position: relative; background: #ffffff; }
    .notification-item:hover { background: #f8fafc; }
    .notification-item.unread { background: #eff6ff; }
    .notification-icon-wrapper { font-size: 1.5rem; flex-shrink: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .notification-content { flex: 1; min-width: 0; }
    .notification-item-title { margin: 0 0 4px 0; font-size: 0.9375rem; font-weight: 600; color: #1e293b; }
    .notification-message { margin: 0 0 4px 0; font-size: 0.875rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .notification-time { font-size: 0.75rem; color: #94a3b8; }
    .unread-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; flex-shrink: 0; margin-top: 16px; }
    .empty-state { padding: 40px 20px; text-align: center; color: #94a3b8; background: #ffffff; }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 8px; }
    .empty-state p { margin: 0; font-size: 0.875rem; }
    .notification-footer { padding: 12px 20px; border-top: 1px solid #e5e7eb; background: #ffffff; }
    .view-all-button { width: 100%; padding: 10px; background: none; border: none; color: #3b82f6; font-weight: 500; cursor: pointer; border-radius: 8px; transition: background 0.2s; }
    .view-all-button:hover { background: rgba(59,130,246,0.1); }
`]
})
export class NotificationPanelComponent implements OnInit {
    displayCount = 5;
    constructor(public notificationService: NotificationService,private router: Router ) {}

    ngOnInit(): void {
        this.notificationService.loadNotifications();
        this.notificationService.loadUnreadCount();
    }

    markAsRead(id: string, reservationId?: string): void {
        this.notificationService.markAsRead(id).subscribe(() => {
            this.notificationService.loadNotifications();
            this.notificationService.loadUnreadCount();
            // ← navigate to reservation detail if reservationId exists
            if (reservationId) {
                this.router.navigate(['/reservation', reservationId]);
            }
        });
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.notificationService.loadNotifications();
            this.notificationService.loadUnreadCount();
        });
    }

    viewAllNotifications(): void {
        console.log('View all notifications');
    }

    getIcon(type: string): string {
        const icons: Record<string, string> = {
            'RESERVATION_CREATED':   '📅',
            'RESERVATION_CONFIRMED': '✅',
            'RESERVATION_REJECTED':  '❌',
            'RESERVATION_CANCELLED': '🚫',
            'RESERVATION_UPDATED':   '✏️',
            'PAYMENT_RECEIVED':      '💰',
            'INVOICE_SENT':          '🧾',
            'PROMO_CODE':            '🎁',
            'GENERAL':               '📬'
        };
        return icons[type] || '📬';
    }

    formatTime(createdAt: string): string {
        const now = new Date();
        const diff = now.getTime() - new Date(createdAt).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        return `Il y a ${days}j`;
    }

    showMore(): void { // ← ADD
        this.displayCount += 5;
    }
}