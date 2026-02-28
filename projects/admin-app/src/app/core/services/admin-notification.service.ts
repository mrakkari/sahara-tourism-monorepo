import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notification } from '../models/admin.models';

@Injectable({
    providedIn: 'root'
})
export class AdminNotificationService {
    private notifications$ = new BehaviorSubject<Notification[]>(this.getMockNotifications());

    constructor() {
        // Simulate polling for new notifications every 30 seconds
        this.startPolling();
    }

    /**
     * Get all notifications
     */
    getNotifications(): Observable<Notification[]> {
        return this.notifications$.asObservable();
    }

    /**
     * Get unread notification count
     */
    getUnreadCount(): Observable<number> {
        return this.notifications$.pipe(
            map(notifications => notifications.filter(n => !n.read).length)
        );
    }

    /**
     * Mark notification as read
     */
    markAsRead(id: string): void {
        const notifications = this.notifications$.value.map(n =>
            n.id === id ? { ...n, read: true } : n
        );
        this.notifications$.next(notifications);
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): void {
        const notifications = this.notifications$.value.map(n => ({ ...n, read: true }));
        this.notifications$.next(notifications);
    }

    /**
     * Add new notification
     */
    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
        const newNotification: Notification = {
            ...notification,
            id: this.generateId(),
            timestamp: new Date(),
            read: false
        };

        const current = this.notifications$.value;
        this.notifications$.next([newNotification, ...current]);
    }

    /**
     * Delete notification
     */
    deleteNotification(id: string): void {
        const notifications = this.notifications$.value.filter(n => n.id !== id);
        this.notifications$.next(notifications);
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        this.notifications$.next([]);
    }

    private startPolling(): void {
        // Simulate receiving new notifications every 30 seconds
        interval(30000).subscribe(() => {
            if (Math.random() > 0.7) { // 30% chance of new notification
                this.simulateNewNotification();
            }
        });
    }

    private simulateNewNotification(): void {
        const types: Array<'new_reservation' | 'payment_received' | 'info'> = [
            'new_reservation', 'payment_received', 'info'
        ];
        const type = types[Math.floor(Math.random() * types.length)];

        const messages = {
            new_reservation: {
                title: 'Nouvelle réservation',
                message: 'Une nouvelle réservation a été créée',
                icon: '📅'
            },
            payment_received: {
                title: 'Paiement reçu',
                message: 'Un paiement a été reçu d\'un partenaire',
                icon: '💰'
            },
            info: {
                title: 'Information',
                message: 'Mise à jour du système disponible',
                icon: 'ℹ️'
            }
        };

        this.addNotification({
            type,
            ...messages[type]
        });
    }

    private generateId(): string {
        return 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    private getMockNotifications(): Notification[] {
        return [
            {
                id: 'NOTIF-001',
                type: 'new_reservation',
                title: 'Nouvelle réservation',
                message: 'Réservation #R-2024-1234 créée par Sahara Adventures Ltd',
                timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
                read: false,
                icon: '📅'
            },
            {
                id: 'NOTIF-002',
                type: 'payment_received',
                title: 'Paiement reçu',
                message: 'Paiement de 1,500 TND reçu de Desert Explorers Co',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                read: false,
                icon: '💰'
            },
            {
                id: 'NOTIF-003',
                type: 'new_reservation',
                title: 'Nouvelle réservation',
                message: 'Réservation #R-2024-1233 créée par Oasis Tours',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                read: true,
                icon: '📅'
            },
            {
                id: 'NOTIF-004',
                type: 'info',
                title: 'Rappel',
                message: '15 réservations prévues pour aujourd\'hui',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
                read: true,
                icon: 'ℹ️'
            }
        ];
    }
}
