import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../../services/reservation.service';
import { Notification } from '../../../models/reservation.model';
import { IMAGES } from '../../constants/images';
import { LanguageService, Language } from '../../services/language.service';
import { TranslatePipe } from '../../services/translate.pipe';

import { AuthService } from '../../../services/auth.service';
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
  notifications: Notification[] = [];
  logo = IMAGES.LOGO;
  unreadCount = 0;
  currentLang: Language = 'FR';
  currentUser: Partner | null = null;
  partnerId = 'partner-001'; // Default backup

  constructor(
    private reservationService: ReservationService,
    private languageService: LanguageService,
    private authService: AuthService
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.showNotifications = false;
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.partnerId = user.id;
        // Refresh notifications for this partner
        this.loadNotifications();
      }
    });

    // Subscribe to language changes
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
    const icons = {
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
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${isFrench ? 'min' : 'min'}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${isFrench ? 'h' : 'h'}`;
    return date.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US');
  }
}