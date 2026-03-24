import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../../services/reservation.service';
import { IMAGES } from '../../constants/images';
import { LanguageService, Language } from '../../services/language.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { AuthService } from '../../../../../../shared/src/lib/auth/auth.service';
import { NotificationService, Notification } from '../../../../../../shared/src/lib/auth/notification.service';
import { AuthUser } from '../../../../../../shared/src/public-api';

// ← REMOVED: local AuthService import (was imported twice)
// ← REMOVED: Partner import (replaced with AuthUser)
// ← REMOVED: Notification from reservation.model (replaced with shared)
// ← ADDED: NotificationService from shared
// ← ADDED: AuthUser from shared

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  menuOpen = false;
  showNotifications = false;
  showProfileMenu = false;
  logo = IMAGES.LOGO;
  currentLang: Language = 'FR';

  // ← CHANGED: Partner → AuthUser
  currentUser: AuthUser | null = null;
  displayCount =5;

  // ← REMOVED: notifications, unreadCount, partnerId
  //   these now come from NotificationService signals directly

    public notifService = inject(NotificationService);

  constructor(
    private reservationService: ReservationService,
    private languageService: LanguageService,
    private authService: AuthService,
    private router: Router
  ) { }
    


  @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
      this.showNotifications = false;
      this.showProfileMenu = false;
    }
    toggleMenu(): void {
      this.menuOpen = !this.menuOpen;
  }

  toggleLanguage(): void {
      this.languageService.toggleLanguage();
  }

  toggleNotifications(event: Event): void {
      event.stopPropagation();
      this.showNotifications = !this.showNotifications;
      this.showProfileMenu = false;
  }

  toggleProfileMenu(event: Event): void {
      event.stopPropagation();
      this.showProfileMenu = !this.showProfileMenu;
      this.showNotifications = false;
  }

  closeProfileMenu(): void {
      this.showProfileMenu = false;
  }

  logout(): void {
      this.authService.logout();
      this.router.navigate(['/login']);
  }

  markAllRead(): void {
      this.notifService.markAllAsRead().subscribe(() => {
          this.notifService.loadNotifications();
          this.notifService.loadUnreadCount();
      });
  }

  handleNotificationClick(notif: Notification): void {
      // mark as read
      if (!notif.isRead) {
          this.notifService.markAsRead(notif.notificationId).subscribe(() => {
              this.notifService.loadNotifications();
              this.notifService.loadUnreadCount();
          });
      }

      // navigate to reservation if reservationId exists
      if (notif.reservationId) {
          this.router.navigate(['/historique']);
          // later: navigate to specific reservation detail
      }

      this.showNotifications = false;
  }

  getNotificationIcon(type: string): string {
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

  openChat(): void {
      window.open('https://wa.me/your-number', '_blank');
  }

  ngOnInit(): void {
    // ← CHANGED: user.id → user.userId
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  showMore(): void {
    this.displayCount += 5;
  }

}