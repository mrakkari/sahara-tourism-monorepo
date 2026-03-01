import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../../services/reservation.service';
import { Notification } from '../../../models/reservation.model';
import { IMAGES } from '../../constants/images';
import { LanguageService, Language } from '../../services/language.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { AuthService } from '../../../services/auth.service';
import { AuthService as SharedAuthService } from '../../../../../../shared/src/lib/auth/auth.service';
import { Partner } from '../../../models/partner.model';

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
  notifications: Notification[] = [];
  logo = IMAGES.LOGO;
  unreadCount = 0;
  currentLang: Language = 'FR';
  currentUser: Partner | null = null;
  partnerId = 'partner-001';

  constructor(
    private reservationService: ReservationService,
    private languageService: LanguageService,
    private authService: AuthService,
    private sharedAuthService: SharedAuthService,
    private router: Router
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.showNotifications = false;
    this.showProfileMenu = false;
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.partnerId = user.id;
        this.loadNotifications();
      }
    });

    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  loadNotifications() {
    this.reservationService.notifications$.subscribe(notifs => {
      this.notifications = notifs.filter(n => n.partnerId === this.partnerId);
      this.unreadCount = this.reservationService.getUnreadCount(this.partnerId);
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.showNotifications = false;
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.menuOpen = false;
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  openChat(): void {
    window.open('https://wa.me/21627391501', '_blank');
  }

  markAllRead(): void {
    this.reservationService.markAllAsRead(this.partnerId);
  }

  handleNotificationClick(notif: Notification): void {
    if (!notif.isRead) {
      this.reservationService.markAsRead(notif.id);
    }
    this.showNotifications = false;
  }

  getNotificationIcon(type: Notification['type']): string {
    const icons: Record<Notification['type'], string> = {
      'reservation_status': '📅',
      'payment': '💰',
      'system': '⚙️'
    };
    return icons[type] || '📢';
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const isFrench = this.currentLang === 'FR';
    if (diff < 60000) return isFrench ? 'À l\'instant' : 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US');
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) this.showNotifications = false;
  }

  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  logout(): void {
    this.sharedAuthService.logout();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
