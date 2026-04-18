import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../shared/src/lib/auth/auth.service';
import { NotificationService } from '../../../../../../shared/src/public-api';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, RouterModule, CommonModule],
    templateUrl: './main-layout.component.html',
    styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
    pageTitle = 'Groupes Confirmés';
    showNotifications = false;
    displayCount = 5;

    get notifications() {
        return this.notificationService.notifications();
    }

    get notificationCount() {
        return this.notificationService.unreadCount();
    }

    get userName(): string {
        return this.authService.getUser()?.name ?? 'Camp Sahara';
    }

    constructor(
        private notificationService: NotificationService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.notificationService.loadNotifications();
        this.notificationService.loadUnreadCount();

        const token = this.authService.getToken();
        if (token) {
            this.notificationService.subscribeToSSE(token);
        }
    }

    toggleNotifications(): void {
        this.showNotifications = !this.showNotifications;
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.notificationService.loadUnreadCount();
        });
    }

    markAsRead(id: string, reservationId?: string): void {
        this.notificationService.markAsRead(id).subscribe(() => {
            this.notificationService.loadNotifications();
            this.notificationService.loadUnreadCount();
            if (reservationId) {
                this.showNotifications = false;
                this.router.navigate(['/group', reservationId]);
            }
        });
    }

    handleLogout(): void {
        this.notificationService.disconnect();
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    showMore(): void {
        this.displayCount += 5;
    }
}