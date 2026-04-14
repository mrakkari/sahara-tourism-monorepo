import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, SidebarItem } from '../../../components/sidebar/sidebar.component';
import { ResCampingService } from '../../../services/res-camping.service';
import { Reservation } from '../../../models/reservation.model';
import { AuthService } from '../../../../../../shared/src/lib/auth/auth.service';
import { NotificationService } from '../../../../../../shared/src/public-api'; // ADD THIS

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, RouterModule, CommonModule, SidebarComponent],
    templateUrl: './main-layout.component.html',
    styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
    pageTitle = 'Groupes Confirmés';
    sidebarCollapsed = false;
    showNotifications = false;
    displayCount =5;

    sidebarItems: SidebarItem[] = [
        { label: 'Groupes', icon: '👥', route: '/camping-app', badge: 0 },
        { label: 'Nouveau', icon: '➕', route: '/nouveau' },
        { label: 'Paiements', icon: '💰', route: '/payment-history' },
    ];

    // READ DIRECTLY FROM SERVICE SIGNALS — no local copies
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
        private resCampingService: ResCampingService,
        private notificationService: NotificationService, // ADD THIS
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // load real notifications from backend
        this.notificationService.loadNotifications();
        this.notificationService.loadUnreadCount();

        // SSE: get token and open real-time connection
        const token = this.authService.getToken();
        if (token) {
            this.notificationService.subscribeToSSE(token);
        }

        // keep sidebar badge for confirmed groups (this stays as is)
        this.resCampingService.getAllReservations().subscribe((reservations: Reservation[]) => {
            this.sidebarItems[0].badge = reservations.filter(
                (r: Reservation) => r.status === 'confirmed' || r.status === 'checked_in'
            ).length;
        });
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
            // navigate to group detail if reservationId exists
            if (reservationId) {
                this.showNotifications = false;
                this.router.navigate(['/group', reservationId]);
            }
        });
    }

    handleLogout(): void {
        this.notificationService.disconnect(); // close SSE on logout
        this.authService.logout();
        this.router.navigate(['/login']);
    }
    showMore(): void {
        this.displayCount += 5;
    }
}