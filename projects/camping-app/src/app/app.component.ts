import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, SidebarItem } from './components/sidebar/sidebar.component';
import { ReservationService } from './services/reservation.service';
import { Reservation } from './models/reservation.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'camping-app';
  pageTitle = 'Groupes Confirmés';
  sidebarCollapsed = false;
  notificationCount = 0;

  sidebarItems: SidebarItem[] = [
    { label: 'Groupes', icon: '👥', route: '/', badge: 0 },
    { label: 'Nouveau', icon: '➕', route: '/nouveau' },
    { label: 'Paiements', icon: '💰', route: '/payment-history' },
  ];

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.loadNotificationCount();
  }

  loadNotificationCount(): void {
    this.reservationService.getAllReservations().subscribe((reservations: Reservation[]) => {
      // Count new pending reservations as notifications
      const pendingCount = reservations.filter((r: Reservation) => r.status === 'pending').length;
      this.notificationCount = pendingCount;
      this.sidebarItems[0].badge = reservations.filter((r: Reservation) => r.status === 'confirmed' || r.status === 'arrived').length;
    });
  }

  showNotifications = false;
  notifications: any[] = []; // In a real app, use the Notification interface

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.reservationService.getNotifications().subscribe(notifs => {
      this.notifications = notifs;
    });
  }

  markAllAsRead(): void {
    this.reservationService.markAllAsRead();
    this.loadNotifications();
  }
}
