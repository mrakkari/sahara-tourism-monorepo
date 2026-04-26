import { Component, OnInit, ViewChild, AfterViewInit, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminReservationService } from '../../core/services/admin-reservation.service';
import { Reservation } from '../../core/models/reservation.model';
import { NotificationService } from '../../../../../shared/src/lib/auth/notification.service';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { TOUR_TYPES, RESERVATION_SOURCES } from '../../core/constants/business-data.constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    StatCardComponent,
    StatusBadgeComponent,
    GlassCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  pagedReservations: Reservation[] = [];


  showDatePicker = false;
  selectedDate: Date | null = null;

  calendarDate = new Date(); // month being viewed
  calendarDays: { date: Date; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean }[] = [];

  // Filters
  statusFilter = 'all';
  tourTypeFilter = 'all';
  searchTerm = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Tour types and sources for filtering
  tourTypes = Array.from(TOUR_TYPES);
  reservationSources = Array.from(RESERVATION_SOURCES);

  // Pagination
  pageSize = 5;
  pageIndex = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private lastNotifCount = 0;

  private currentStatusLoaded = 'all';
  


  constructor(
      private adminReservationService: AdminReservationService,
      private notificationService: NotificationService
  ) {
      effect(() => {
          const count = this.notificationService.unreadCount();
          // only reload if unread count actually increased
          if (count > this.lastNotifCount) {
              this.lastNotifCount = count;
              this.adminReservationService.fetchActiveReservations();
          }
      });
  }

  ngOnInit(): void {
    this.adminReservationService.fetchActiveReservations();

    this.adminReservationService.getAllReservations().subscribe(reservations => {
      this.reservations = reservations;
      this.applyFilters();
    });

   
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-picker-wrapper')) {
      this.showDatePicker = false;
    }
  }

  onStatusChange(): void {
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;

    if (this.statusFilter === 'all') {
      this.adminReservationService.fetchActiveReservations();
      return;
    }

    this.adminReservationService.getReservationsByStatus(this.statusFilter as any)
      .subscribe(reservations => {
        this.reservations = reservations;
        this.applyFilters();
      });
  }
  get otherDateBlocks(): { date: Date; label: string; dateStr: string; reservations: Reservation[] }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map = new Map<string, { date: Date; label: string; dateStr: string; reservations: Reservation[] }>();

    for (const r of this.otherReservations) {
      const rawDate = (r.reservationType === 'TOURS' || r.reservationType === 'EXTRAS')
        ? (r.serviceDate ?? r.checkInDate)
        : r.checkInDate;

      const d = new Date(rawDate);
      d.setHours(0, 0, 0, 0);
      const key = d.toDateString();

      if (!map.has(key)) {
        const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const label = diffDays === 0
          ? "Aujourd'hui"
          : diffDays === 1
            ? 'Demain'
            : diffDays === 2
              ? 'Après-demain'
              : d.toLocaleDateString('fr-FR', { weekday: 'long' });

        const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        map.set(key, { date: d, label, dateStr, reservations: [] });
      }
      map.get(key)!.reservations.push(r);
    }

    return Array.from(map.values()).sort((a, b) => {
      const aIsPast = a.date < today;
      const bIsPast = b.date < today;
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }
  get allDateBlocks(): { date: Date; label: string; dateStr: string; reservations: Reservation[] }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map = new Map<string, { date: Date; label: string; dateStr: string; reservations: Reservation[] }>();

    for (const r of this.filteredReservations) {
      const rawDate = (r.reservationType === 'TOURS' || r.reservationType === 'EXTRAS')
        ? (r.serviceDate ?? r.checkInDate)
        : r.checkInDate;

      const d = new Date(rawDate);
      d.setHours(0, 0, 0, 0);
      const key = d.toDateString();

      if (!map.has(key)) {
        const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const label = diffDays === 0
          ? "Aujourd'hui"
          : diffDays === 1
            ? 'Demain'
            : d.toLocaleDateString('fr-FR', { weekday: 'long' });

        const dateStr = d.toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'long', year: 'numeric'
        });

        map.set(key, { date: d, label, dateStr, reservations: [] });
      }
      map.get(key)!.reservations.push(r);
    }

    return Array.from(map.values()).sort((a, b) => {
      const aIsPast = a.date < today;
      const bIsPast = b.date < today;
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReservations.length / this.itemsPerPage);
  }

  loadReservations(): void {
    this.adminReservationService.getAllReservations().subscribe(reservations => {
      this.reservations = reservations;
      this.applyFilters();
    });
  }

  filterToday(): void {
    const today = new Date();
    this.selectedDate = today;
    this.startDate = today;
    this.endDate = today;
    this.adminReservationService.fetchReservationsByDate(today); 
  }

  applyFilters(): void {
    this.filteredReservations = [...this.reservations];
    this.currentPage = 1;
    this.updatePagedData();
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.tourTypeFilter = 'all';
    this.searchTerm = '';
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.adminReservationService.fetchActiveReservations();
  }

  updatePagedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedReservations = this.filteredReservations.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedData();
    }
  }

  // Stats Helpers
  getTotalReservations(): number { return this.reservations.length; }
  getPendingCount(): number { return this.reservations.filter(r => r.status === 'pending').length; }
  getConfirmedCount(): number {
      return this.reservations.filter(r => 
          r.status === 'confirmed' || r.status === 'checked_in'
      ).length;
  }
  getTotalRevenue(): number { return this.reservations.reduce((sum, r) => sum + r.payment.paidAmount, 0); }

  // UI Helpers
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  calculateDuration(r: Reservation): number {
    const cin = new Date(r.checkInDate);
    const cout = new Date(r.checkOutDate);
    return Math.ceil((cout.getTime() - cin.getTime()) / (1000 * 3600 * 24));
  }

  getPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'pending': 'Non payé',
      'partial': 'Partiel',
      'completed': 'Payé'
    };
    return map[status] || status;
  }

  getStatusLabel(status: string): string {
      const labels: Record<string, string> = {
          'CONFIRMED': 'Confirmée',
          'PENDING':   'En attente',
          'CHECKED_IN': 'En cours',   
          'REJECTED':  'Rejetée',
          'CANCELLED': 'Annulée',
          'COMPLETED': 'Terminée'
      };
      return labels[status?.toUpperCase()] || status;
  }

  getStatusClass(status: string): string {
      switch (status?.toUpperCase()) {
          case 'CONFIRMED':  return 'status-confirmed';
          case 'PENDING':    return 'status-pending';
          case 'CHECKED_IN': return 'status-arrived';   
          case 'REJECTED':   return 'status-rejected';
          case 'CANCELLED':  return 'status-cancelled';
          case 'COMPLETED':  return 'status-completed';
          default: return '';
      }
  }


  confirmReservation(id: string): void {
      if (confirm('Confirmer cette réservation ?')) {
          this.adminReservationService.confirmReservation(id).subscribe({
              next: () => this.loadReservations(),
              error: (err) => console.error('Erreur confirmation:', err)
          });
      }
  }

  exportToCSV(): void {
    this.exportToPDF();
  }
  
  exportToPDF(): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('Réservations Sahara', 14, 22);
    
    // Add subtitle with filters info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const today = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Exporté le ${today}`, 14, 30);
    doc.text(`Page ${this.currentPage} sur ${this.totalPages} | ${this.filteredReservations.length} réservations au total`, 14, 36);
    
    // Prepare table data from current page
    const tableData = this.pagedReservations.map(r => [
      r.partnerName,
      r.tourTypes?.map(t => t.name).join(', ') || 'N/A',
      `${r.numberOfPeople} pers.`,
      this.formatDate(r.checkInDate),
      `${this.calculateDuration(r)} nuits`,
      r.source?.name || 'N/A',     // ← was r.source || 'N/A'
      this.getStatusLabel(r.status),
      this.getPaymentStatusLabel(r.payment.paymentStatus),
      `${r.payment.totalAmount} TND`
    ]);
    
    // Generate table
    autoTable(doc, {
      head: [[
        'Partenaire', 
        'Type Tour', 
        'Personnes', 
        'Check-in', 
        'Durée', 
        'Source', 
        'Statut', 
        'Paiement', 
        'Montant'
      ]],
      body: tableData,
      startY: 42,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Partenaire
        1: { cellWidth: 20 }, // Type
        2: { cellWidth: 18 }, // Personnes
        3: { cellWidth: 20 }, // Check-in
        4: { cellWidth: 15 }, // Durée
        5: { cellWidth: 20 }, // Source
        6: { cellWidth: 22 }, // Statut
        7: { cellWidth: 20 }, // Paiement
        8: { cellWidth: 25, halign: 'right' } // Montant
      },
      margin: { top: 42 },
    });
    
    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`reservations_page${this.currentPage}_${timestamp}.pdf`);
  
  }
  getDisplayNames(r: Reservation): { label: string; badge: 'hebergement' | 'tour' | 'extra' }[] {
    switch (r.reservationType) {
      case 'HEBERGEMENT':
        return (r.tourTypes ?? []).map(t => ({ label: t.name, badge: 'hebergement' as const }));
  
      case 'TOURS':
        return (r.tours ?? []).map(t => ({ label: t.name, badge: 'tour' as const }));
  
      case 'EXTRAS':
        // Show only active extras (already filtered in mapToReservation, but guard anyway)
        return (r.extras ?? []).filter(e => e.isActive).map(e => ({ label: e.name, badge: 'extra' as const }));
  
      default:
        // Fallback for old data that may not have reservationType yet
        if (r.tourTypes?.length) {
          return r.tourTypes.map(t => ({ label: t.name, badge: 'hebergement' as const }));
        }
        return [{ label: 'N/A', badge: 'hebergement' as const }];
    }
  }
  getDisplayDate(r: Reservation): string {
    const raw = r.reservationType === 'HEBERGEMENT'
      ? r.checkInDate
      : (r.serviceDate ?? r.checkInDate); // graceful fallback for missing serviceDate
  
    return raw ? this.formatDate(raw) : '—';
  }
  getTypeLabel(r: Reservation): string {
    const map: Record<string, string> = {
      HEBERGEMENT: '🏕️ Séjour',
      TOURS:       '🗺️ Tour',
      EXTRAS:      '✨ Extras',
    };
    return r.reservationType ? (map[r.reservationType] ?? r.reservationType) : '—';
  }

  get upcomingDayBlocks(): { date: Date; label: string; dateStr: string; reservations: Reservation[] }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const blocks: { date: Date; label: string; dateStr: string; reservations: Reservation[] }[] = [];
    let dayOffset = 0;

    while (blocks.length < 3 && dayOffset < 365) {
      const day = new Date(today);
      day.setDate(today.getDate() + dayOffset);
      day.setHours(0, 0, 0, 0);

      const dayReservations = this.filteredReservations.filter(r => {
        const d = this.getRelevantDateObj(r, today);
        if (!d) return false;
        return d.getTime() === day.getTime();
      });

      if (dayReservations.length > 0) {
        const diff = dayOffset;
        const label = diff === 0
          ? "Aujourd'hui"
          : diff === 1
            ? 'Demain'
            : day.toLocaleDateString('fr-FR', { weekday: 'long' });

        const dateStr = day.toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'long', year: 'numeric'
        });

        blocks.push({ date: day, label, dateStr, reservations: dayReservations });
      }
      dayOffset++;
    }
    return blocks;
  }
  get otherReservations(): Reservation[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const blockDates = new Set(
      this.upcomingDayBlocks.map(b => b.date.getTime())
    );

    // NO sort — backend already sorted correctly
    return this.filteredReservations.filter(r => {
      const d = this.getRelevantDateObj(r, today);
      if (!d) return true;
      return !blockDates.has(d.getTime());
    });
  }
  private getRelevantDate(r: Reservation): string | null {
    const raw = (r.reservationType === 'TOURS' || r.reservationType === 'EXTRAS')
      ? r.serviceDate
      : r.checkInDate;
    if (!raw || raw.trim() === '') return null;
    return raw;
  }

  private getRelevantDateObj(r: Reservation, today: Date): Date | null {
    const raw = this.getRelevantDate(r);
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  formatFullDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  // Add date picker filter
  filterByDate(date: Date | null): void {
    this.selectedDate = date;
    this.showDatePicker = false;
    if (!date) {
      this.startDate = null;
      this.endDate = null;
    } else {
      this.startDate = date;
      this.endDate = date;
    }
    this.applyFilters();
  }

  toggleDatePicker(): void {
    // stopPropagation so the HostListener doesn't immediately close it
    this.showDatePicker = !this.showDatePicker;
    if (this.showDatePicker) {
      this.calendarDate = this.selectedDate ? new Date(this.selectedDate) : new Date();
      this.buildCalendar();
    }
  }
  buildCalendar(): void {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: { date: Date; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean }[] = [];

    // Previous month padding days
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, 0 - i);
      days.push({ date: d, isCurrentMonth: false, isSelected: false, isToday: false });
    }

    // Current month days — isCurrentMonth is always TRUE here
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      const isSelected = this.selectedDate
        ? d.getTime() === new Date(this.selectedDate).setHours(0, 0, 0, 0)
        : false;
      days.push({
        date: d,
        isCurrentMonth: true,   // ← always true for current month loop
        isSelected,
        isToday: d.getTime() === today.getTime()
      });
    }

    // Next month padding days
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
  selectCalendarDate(day: { date: Date; isCurrentMonth: boolean }): void {
    if (!day.isCurrentMonth) return;
    this.selectedDate = day.date;
    this.startDate = day.date;
    this.endDate = day.date;
    this.showDatePicker = false;
    this.adminReservationService.fetchReservationsByDate(day.date); // ← changed
  }

  clearCalendarDate(): void {
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.showDatePicker = false;
    this.statusFilter = 'all';
    this.adminReservationService.fetchActiveReservations();
  }

  nextMonth(): void {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 1);
    this.buildCalendar();
  }
  get calendarMonthLabel(): string {
    return this.calendarDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
  get reservationsWithDayHeaders(): ({ type: 'header'; label: string; dateStr: string } | { type: 'row'; reservation: Reservation })[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: ({ type: 'header'; label: string; dateStr: string } | { type: 'row'; reservation: Reservation })[] = [];
    const addedHeaders = new Set<string>();

    for (const r of this.pagedReservations) {
      const checkIn = new Date(r.checkInDate);
      checkIn.setHours(0, 0, 0, 0);

      const diffDays = Math.round((checkIn.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const key = checkIn.toDateString();

      // Only add header for today, tomorrow, day after tomorrow
      if (diffDays >= 0 && diffDays < 3 && !addedHeaders.has(key)) {
        addedHeaders.add(key);
        const label = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? 'Demain' : 'Après-demain';
        const dateStr = checkIn.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
        result.push({ type: 'header', label, dateStr });
      }

      result.push({ type: 'row', reservation: r });
    }

    return result;
  }
  onSearchSubmit(): void {
    if (!this.searchTerm.trim()) {
      this.adminReservationService.fetchActiveReservations(); // ← was fetchAllReservations
      return;
    }
    this.adminReservationService.searchReservationsByName(this.searchTerm.trim())
      .subscribe(reservations => {
        this.reservations = reservations;
        this.applyFilters();
      });
  }
}