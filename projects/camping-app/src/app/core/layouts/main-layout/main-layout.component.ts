import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, SidebarItem } from '../../../components/sidebar/sidebar.component';
import { ReservationService } from '../../../services/reservation.service';
import { Reservation } from '../../../models/reservation.model';
import { AuthService } from '../../../../../../shared/src/lib/auth/auth.service';

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
    notificationCount = 0;
    showNotifications = false;
    notifications: any[] = [];

    sidebarItems: SidebarItem[] = [
        { label: 'Groupes', icon: '👥', route: '/camping-app', badge: 0 },
        { label: 'Nouveau', icon: '➕', route: '/nouveau' },
        { label: 'Paiements', icon: '💰', route: '/payment-history' },
    ];

    get userName(): string {
        return this.authService.getUser()?.name ?? 'Camp Sahara';
    }

    constructor(
        private reservationService: ReservationService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadNotificationCount();
    }

    loadNotificationCount(): void {
        this.reservationService.getAllReservations().subscribe((reservations: Reservation[]) => {
            const pendingCount = reservations.filter((r: Reservation) => r.status === 'pending').length;
            this.notificationCount = pendingCount;
            this.sidebarItems[0].badge = reservations.filter(
                (r: Reservation) => r.status === 'confirmed' || r.status === 'arrived'
            ).length;
        });
    }

    toggleNotifications(): void {
        this.showNotifications = !this.showNotifications;
        if (this.showNotifications) {
            this.loadNotifications();
        }
    }

    loadNotifications(): void {
        this.reservationService.getNotifications().subscribe((notifs: any[]) => {
            this.notifications = notifs;
        });
    }

    markAllAsRead(): void {
        this.reservationService.markAllAsRead();
        this.loadNotifications();
    }

    handleLogout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
