import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications: { message: string; timestamp: Date }[] = [];

    showSuccess(message: string): void {
        this.addNotification(message);
        console.log(`✅ SUCCESS: ${message}`);
        alert(`✅ ${message}`);
    }

    showError(message: string): void {
        this.addNotification(message);
        console.error(`❌ ERROR: ${message}`);
        alert(`❌ ${message}`);
    }

    showInfo(message: string): void {
        this.addNotification(message);
        console.log(`ℹ️ INFO: ${message}`);
        alert(`ℹ️ ${message}`);
    }

    showWarning(message: string): void {
        this.addNotification(message);
        console.warn(`⚠️ WARNING: ${message}`);
        alert(`⚠️ ${message}`);
    }

    private addNotification(message: string): void {
        this.notifications.push({
            message,
            timestamp: new Date()
        });
    }

    getNotifications() {
        return this.notifications;
    }
}
