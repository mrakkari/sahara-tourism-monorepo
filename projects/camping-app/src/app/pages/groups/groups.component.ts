import { Component, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { ResCampingService } from '../../services/res-camping.service';
import { Reservation } from '../../models/reservation.model';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { NotificationService, ToastService } from '../../../../../shared/src/public-api';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  animations: [
    trigger('tableAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(30, [animate('0.3s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))])
        ], { optional: true })
      ])
    ])
  ]
})
export class GroupsComponent implements OnInit {

  allReservations:      Reservation[] = [];
  filteredReservations: Reservation[] = [];
  pagedReservations:    Reservation[] = [];
  loading = true;

  statusFilter = 'all';
  searchTerm   = '';

  // Calendar
  showDatePicker  = false;
  selectedDate: Date | null = null;
  calendarDate    = new Date();
  calendarDays: { date: Date; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean }[] = [];

  currentPage  = 1;
  itemsPerPage = 15;
  Math         = Math;

  private lastUnreadCount = 0;

  constructor(
    private resCampingService:   ResCampingService,
    private notificationService: NotificationService,
    private toastService:        ToastService
  ) {
    effect(() => {
      const count = this.notificationService.unreadCount();
      if (count > this.lastUnreadCount) {
        this.lastUnreadCount = count;
        this.loadInitialData();
      }
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-wrapper')) {
      this.showDatePicker = false;
    }
  }

  // ── Load ──────────────────────────────────────────────────────

  loadInitialData(): void {
    this.loading = true;
    this.resCampingService.fetchCampingActive().subscribe({
      next: reservations => {
        this.allReservations      = reservations;
        this.filteredReservations = reservations;
        this.updatePagedData();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ── Search ────────────────────────────────────────────────────

  onSearchSubmit(): void {
    if (!this.searchTerm.trim()) {
      this.reloadBasedOnFilters();
      return;
    }
    this.loading = true;
    this.resCampingService.searchCampingByName(this.searchTerm.trim()).subscribe({
      next: reservations => {
        this.allReservations = reservations;
        this.applyLocalFilters();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ── Status ────────────────────────────────────────────────────

  onStatusChange(): void {
    if (this.selectedDate) {
      // date already loaded — just filter locally
      this.applyLocalFilters();
      return;
    }
    this.loading = true;
    if (this.statusFilter === 'all') {
      this.resCampingService.fetchCampingActive().subscribe({
        next: res => { this.allReservations = res; this.applyLocalFilters(); this.loading = false; },
        error: () => this.loading = false
      });
    } else {
      const backendStatus = this.statusFilter === 'checked_in' ? 'CHECKED_IN' : 'CONFIRMED';
      this.resCampingService.fetchCampingByStatus(backendStatus).subscribe({
        next: res => { this.allReservations = res; this.applyLocalFilters(); this.loading = false; },
        error: () => this.loading = false
      });
    }
  }

  // ── Calendar ──────────────────────────────────────────────────

  toggleDatePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showDatePicker = !this.showDatePicker;
    if (this.showDatePicker) {
      this.calendarDate = this.selectedDate ? new Date(this.selectedDate) : new Date();
      this.buildCalendar();
    }
  }

  buildCalendar(): void {
    const year  = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: { date: Date; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean }[] = [];

    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, 0 - i);
      days.push({ date: d, isCurrentMonth: false, isSelected: false, isToday: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      const isSelected = this.selectedDate
        ? d.getTime() === new Date(this.selectedDate).setHours(0, 0, 0, 0)
        : false;
      days.push({ date: d, isCurrentMonth: true, isSelected, isToday: d.getTime() === today.getTime() });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, isSelected: false, isToday: false });
    }

    this.calendarDays = days;
  }

  prevMonth(): void {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  get calendarMonthLabel(): string {
    return this.calendarDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  selectCalendarDate(day: { date: Date; isCurrentMonth: boolean }): void {
    if (!day.isCurrentMonth) return;
    this.selectedDate    = day.date;
    this.showDatePicker  = false;
    this.loading         = true;

    this.resCampingService.fetchCampingByDate(day.date).subscribe({
      next: res => {
        this.allReservations = res;
        this.applyLocalFilters(); // applies status filter on top if selected
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  clearCalendarDate(): void {
    this.selectedDate   = null;
    this.showDatePicker = false;
    this.statusFilter   = 'all';
    this.searchTerm     = '';
    this.loadInitialData();
  }

  // ── Filters ───────────────────────────────────────────────────

  applyLocalFilters(): void {
    let filtered = [...this.allReservations];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }

    this.filteredReservations = filtered;
    this.currentPage = 1;
    this.updatePagedData();
  }

  reloadBasedOnFilters(): void {
    if (this.selectedDate) {
      this.selectCalendarDate({ date: this.selectedDate, isCurrentMonth: true });
      return;
    }
    this.onStatusChange();
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm   = '';
    this.selectedDate = null;
    this.showDatePicker = false;
    this.loadInitialData();
  }

  // ── Pagination ────────────────────────────────────────────────

  get totalPages(): number { return Math.ceil(this.filteredReservations.length / this.itemsPerPage); }

  updatePagedData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedReservations = this.filteredReservations.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.updatePagedData(); }
  }

  // ── Stats ─────────────────────────────────────────────────────

  getConfirmedCount(): number { return this.allReservations.filter(r => r.status === 'confirmed').length; }
  getArrivedCount():   number { return this.allReservations.filter(r => r.status === 'checked_in').length; }

  // ── Display helpers ───────────────────────────────────────────

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getArrivalDate(r: Reservation): string {
    return (r.reservationType === 'HEBERGEMENT' || !r.reservationType)
      ? this.formatDate(r.checkInDate)
      : this.formatDate(r.serviceDate);
  }

  getDepartureDate(r: Reservation): string {
    return (r.reservationType === 'HEBERGEMENT' || !r.reservationType)
      ? this.formatDate(r.checkOutDate)
      : '—';
  }

  getNights(r: Reservation): number {
    if (r.reservationType !== 'HEBERGEMENT' && r.reservationType) return 0;
    const diff = new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime();
    return Math.max(1, Math.ceil(diff / 86_400_000));
  }

  getTourLabel(r: Reservation): string {
    if (r.reservationType === 'TOURS' && r.tours?.length) return r.tours.map(t => t.name).join(', ');
    if (r.tourTypes?.length) return r.tourTypes.map(t => t.name).join(', ');
    return r.groupInfo?.tourType ?? 'N/A';
  }

  getTourNames(r: Reservation): string[] {
    if (r.reservationType === 'HEBERGEMENT' && r.tourTypes?.length) 
      return r.tourTypes.map(t => t.name);
    
    if (r.reservationType === 'TOURS' && r.tours?.length) 
      return r.tours.map(t => t.name);
    
    if (r.reservationType === 'EXTRAS' && r.extras?.length)
      return r.extras.filter(e => e.isActive).map(e => e.name);
    
    return [];  // ← return empty instead of ['N/A']
  }

  getTypeLabel(r: Reservation): string {
    const map: Record<string, string> = { HEBERGEMENT: '🏕️ Séjour', TOURS: '🗺️ Tour', EXTRAS: '✨ Extras' };
    return r.reservationType ? (map[r.reservationType] ?? r.reservationType) : '—';
  }

  getPaymentStatus(r: Reservation): string {
    const total = r.payment.totalAmount || 0;
    const paid  = r.payment.paidAmount  || 0;
    if (paid === 0)    return 'Non payé';
    if (paid >= total) return 'Payé 100%';
    return `Payé ${Math.round((paid / total) * 100)}%`;
  }

  getPaymentStatusClass(r: Reservation): string {
    const total = r.payment.totalAmount || 0;
    const paid  = r.payment.paidAmount  || 0;
    if (paid === 0)    return 'not-paid';
    if (paid >= total) return 'fully-paid';
    return 'partially-paid';
  }

  getGroupLeaderName(r: Reservation): string {
    return r.groupLeaderName || r.groupInfo?.groupLeaderName || r.partnerName || 'N/A';
  }

  markArrived(id: string): void {
    if (!confirm('Confirmer l\'arrivée de ce groupe au campement ?')) return;
    this.resCampingService.markAsArrived(id).subscribe({
      next: () => { this.toastService.showSuccess('✅ Groupe enregistré avec succès !'); this.loadInitialData(); },
      error: err => { console.error('Check-in failed:', err); this.toastService.showError('❌ Erreur lors du check-in.'); }
    });
  }
}