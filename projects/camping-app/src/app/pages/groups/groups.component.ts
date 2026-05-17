import { Component, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { CampingStats, ResCampingService } from '../../services/res-camping.service';
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
  todayReservations:    Reservation[] = [];
  upcomingReservations: Reservation[] = [];
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
  campingStats: CampingStats = {
    inCampAdults: 0, inCampChildren: 0, inCampTotal: 0,
    arrivingTodayAdults: 0, arrivingTodayChildren: 0, arrivingTodayTotal: 0
  };

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
        this.splitReservations(reservations)
        this.loading = false;
      },
      error: () => this.loading = false
    });

    this.resCampingService.fetchCampingStats().subscribe(stats => {
      this.campingStats = stats;
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
        this.splitReservations(reservations)
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ── Status ────────────────────────────────────────────────────

  onStatusChange(): void {
    if (this.selectedDate) {
      this.applyLocalFilters();
      return;
    }
    this.loading = true;
    if (this.statusFilter === 'all') {
      this.resCampingService.fetchCampingActive().subscribe({
        next: res => { this.allReservations = res; this.applyLocalFilters(); this.splitReservations(res); this.loading = false; },
        error: () => this.loading = false
      });
    } else {
      const statusMap: Record<string, 'CONFIRMED' | 'CHECKED_IN'> = {
        checked_in: 'CHECKED_IN',
        confirmed:  'CONFIRMED',
        pending:    'CONFIRMED',
        completed:  'CHECKED_IN',
      };
      const backendStatus = statusMap[this.statusFilter] ?? 'CONFIRMED';
      this.resCampingService.fetchCampingByStatus(backendStatus).subscribe({
        next: res => { this.allReservations = res; this.applyLocalFilters(); this.splitReservations(res); this.loading = false; },
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
        this.splitReservations(res);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
  getStatusLabel(r: Reservation): string {
    const map: Record<string, string> = {
      pending:    '⏳ En attente',
      confirmed:  '✅ Confirmé',
      checked_in: '🏕️ Au camp',
      completed:  '🏁 Terminé',
      cancelled:  '❌ Annulé',
      rejected:   '🚫 Rejeté',
    };
    return map[r.status] ?? r.status;
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
  private splitReservations(reservations: Reservation[]): void {
    const todayStr = new Date().toISOString().split('T')[0];

    this.todayReservations = reservations.filter(r => {
      const date = r.reservationType === 'EXTRAS' ? r.serviceDate : r.checkInDate;
      return date?.startsWith(todayStr) || r.status === 'completed';
    });

    this.upcomingReservations = reservations.filter(r => {
      if (r.status === 'completed') return false;
      const date = r.reservationType === 'EXTRAS' ? r.serviceDate : r.checkInDate;
      return date ? date > todayStr : false;
    });
  }

  getRepartitionItems(r: Reservation): string[] {
    if (r.reservationType === 'EXTRAS') return ['—'];
    if (!r.repartitions || r.repartitions.length === 0) return ['—'];

    const labelMap: Record<string, string> = {
      SINGLE: 'SQL',
      DOUBLE: 'DBL',
      TRIPLE: 'TRP',
      X4: '4*PAX',
      X5: '5*PAX',
      X6: '6*PAX',
      X7: '7*PAX',
    };

    return r.repartitions.map(rep =>
      `${rep.numberOfTentes} ${labelMap[rep.tenteType] ?? rep.tenteType}`
    );
  }


  printTodayReservations(): void {
      const labelMap: Record<string, string> = {
        SINGLE: 'SQL', DOUBLE: 'DBL', TRIPLE: 'TRP',
        X4: '4 PAX', X5: '5 PAX', X6: '6 PAX', X7: '7 PAX',
      };

    const rows = this.todayReservations.map(r => {
      const repartition = (r.repartitions && r.repartitions.length > 0)
        ? r.repartitions.map(rep => `${rep.numberOfTentes} ${labelMap[rep.tenteType] ?? rep.tenteType}`).join('<br>')
        : '—';

      const type = this.getTypeLabel(r);
      const tourNames = this.getTourNames(r).join(', ') || '—';
      const nights = (r.reservationType === 'HEBERGEMENT' || !r.reservationType)
        ? `${this.getNights(r)} nuit${this.getNights(r) > 1 ? 's' : ''}`
        : (r.reservationType === 'EXTRAS' ? 'Service' : '—');

      return `
        <tr>
          <td>${r.partnerName}</td>
          <td>${type}<br><small>${tourNames}</small></td>
          <td>👥 ${r.numberOfPeople}<br><small>${r.adults} Ad, ${r.children} Enf</small></td>
          <td>${repartition}</td>
          <td>${r.source || '—'}</td>
          <td>${this.getArrivalDate(r)}</td>
          <td>${this.getDepartureDate(r)}</td>
          <td>${nights}</td>
          <td>${this.getPaymentStatus(r)}</td>
          <td>${this.getStatusLabel(r)}</td>
        </tr>`;
    }).join('');

    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Réservations du jour — ${today}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            color: #1e1e1e;
            padding: 24px;
            background: #fff;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 2px solid #2c2c2a;
          }
          .print-header h1 {
            font-size: 18px;
            font-weight: 700;
            color: #2c2c2a;
            margin-bottom: 4px;
          }
          .print-header .subtitle {
            font-size: 12px;
            color: #888;
          }
          .print-header .date-info {
            text-align: right;
            font-size: 11px;
            color: #555;
          }
          .count-badge {
            display: inline-block;
            background: #2c2c2a;
            color: #fff;
            padding: 2px 10px;
            border-radius: 99px;
            font-size: 10px;
            font-weight: 600;
            margin-left: 8px;
            vertical-align: middle;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          thead tr {
            background: #2c2c2a;
          }
          thead th {
            color: #d3d1c7;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 9px 8px;
            text-align: left;
            white-space: nowrap;
          }
          tbody tr {
            border-bottom: 1px solid #eeede8;
          }
          tbody tr:nth-child(even) { background: #f8f7f3; }
          tbody tr:hover { background: #f0efe9; }
          td {
            padding: 8px;
            vertical-align: top;
            line-height: 1.4;
          }
          td small {
            display: block;
            color: #888;
            font-size: 9px;
            margin-top: 2px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e2df;
            font-size: 9px;
            color: #aaa;
            text-align: center;
          }
          @media print {
            body { padding: 8px; }
            @page { margin: 8mm; size: A4 portrait; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div>
            <h1>📋 Réservations du jour <span class="count-badge">${this.todayReservations.length} groupe(s)</span></h1>
            <div class="subtitle">Campement Dunes Insolites — Suivi des arrivées</div>
          </div>
          <div class="date-info">
            <strong>${today}</strong><br>
            Imprimé le ${new Date().toLocaleString('fr-FR')}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Partenaire</th>
              <th>Type</th>
              <th>Personnes</th>
              <th>Répartition</th>
              <th>Source</th>
              <th>Arrivée</th>
              <th>Sortie</th>
              <th>Nuits</th>
              <th>Paiement</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          Dunes Insolites — El Faouar, Kébili — dunesinsolites@gmail.com
        </div>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=1100,height=750');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  }
}