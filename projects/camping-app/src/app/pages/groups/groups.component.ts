// camping-app/src/app/core/pages/groups/groups.component.ts

import { Component, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { ResCampingService } from '../../services/res-camping.service';
import { Reservation } from '../../models/reservation.model';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { NotificationService, ToastService } from '../../../../../shared/src/public-api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

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
  hasSearched  = false;

  currentPage  = 1;
  itemsPerPage = 15;
  Math         = Math;

  private lastUnreadCount = 0;
  private searchSubject = new Subject<string>();
  private currentStatusLoaded = 'all';

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

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (!term.trim()) {
          // Empty search → respect current status
          if (this.statusFilter === 'all') {
            return this.resCampingService.fetchConfirmedAndCheckedIn();
          } else {
            const backendStatus = this.statusFilter === 'checked_in' ? 'CHECKED_IN' : 'CONFIRMED';
            return this.resCampingService.fetchByStatus(backendStatus as any);
          }
        }
        // Search by name — filter to confirmed+checked_in is done inside the service method
        return this.resCampingService.searchReservationsByName(term);
      })
    ).subscribe((reservations: Reservation[]) => {
      this.allReservations = reservations;
      this.applyFilters();
    });
  }

  loadInitialData(): void {
    this.loading = true;
    this.resCampingService.fetchConfirmedAndCheckedIn().subscribe({
      next: reservations => {
        this.allReservations = reservations.sort((a, b) => {
          if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
          if (b.status === 'confirmed' && a.status !== 'confirmed') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.filteredReservations = this.allReservations;
        this.updatePagedData();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get totalPages(): number { return Math.ceil(this.filteredReservations.length / this.itemsPerPage); }

  applyFilters(): void {
    this.hasSearched = true;
    let filtered = this.allReservations;

    // Status still filtered locally as a safety net
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }

    // Local search fallback (works instantly without waiting for API)
    if (this.searchTerm.trim() && !this.searchSubject) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.partnerName.toLowerCase().includes(term)              ||
        r.userName?.toLowerCase().includes(term)                ||
        r.groupLeaderName?.toLowerCase().includes(term)         ||
        this.getTourLabel(r).toLowerCase().includes(term)       ||
        r.id.toLowerCase().includes(term)
      );
    }

    this.filteredReservations = filtered.sort((a, b) => {
      if (a.status === 'checked_in' && b.status !== 'checked_in') return -1;
      if (b.status === 'checked_in' && a.status !== 'checked_in') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    this.currentPage = 1;
    this.updatePagedData();
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm   = '';
    this.hasSearched  = false;
    this.filteredReservations = this.allReservations;
    this.currentPage  = 1;
    this.updatePagedData();
  }

  updatePagedData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedReservations = this.filteredReservations.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.updatePagedData(); }
  }

  getConfirmedCount(): number { return this.allReservations.filter(r => r.status === 'confirmed').length; }
  getArrivedCount():   number { return this.allReservations.filter(r => r.status === 'checked_in').length; }

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
    if (r.reservationType === 'TOURS' && r.tours?.length) return r.tours.map(t => t.name);
    if (r.tourTypes?.length) return r.tourTypes.map(t => t.name);
    return [r.groupInfo?.tourType ?? 'N/A'];
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
  onSearchSubmit(): void {
    if (!this.searchTerm.trim()) {
      // Empty → reload based on current status
      if (this.statusFilter === 'all') {
        this.resCampingService.fetchConfirmedAndCheckedIn()
          .subscribe((reservations: Reservation[]) => {
            this.allReservations = reservations;
            this.applyFilters();
          });
      } else {
        const backendStatus = this.statusFilter === 'checked_in' ? 'CHECKED_IN' : 'CONFIRMED';
        this.resCampingService.fetchByStatus(backendStatus as any)
          .subscribe((reservations: Reservation[]) => {
            this.allReservations = reservations;
            this.applyFilters();
          });
      }
      return;
    }

    this.resCampingService.searchReservationsByName(this.searchTerm.trim())
      .subscribe((reservations: Reservation[]) => {
        this.allReservations = reservations;
        this.applyFilters();
      });
  }

  onStatusChange(): void {
    this.currentStatusLoaded = this.statusFilter;
    this.loading = true;

    if (this.statusFilter === 'all') {
      if (this.searchTerm.trim()) {
        this.resCampingService.searchReservationsByName(this.searchTerm)
          .subscribe((reservations: Reservation[]) => {
            this.allReservations = reservations;
            this.applyFilters();
            this.loading = false;
          });
      } else {
        this.resCampingService.fetchConfirmedAndCheckedIn()
          .subscribe((reservations: Reservation[]) => {
            this.allReservations = reservations;
            this.applyFilters();
            this.loading = false;
          });
      }
      return;
    }

    // 'confirmed' or 'checked_in' selected
    const backendStatus = this.statusFilter === 'checked_in' ? 'CHECKED_IN' : 'CONFIRMED';

    if (this.searchTerm.trim()) {
      this.resCampingService.searchReservationsByName(this.searchTerm)
        .subscribe((reservations: Reservation[]) => {
          // searchReservationsByName already filters confirmed+checkedin
          // applyFilters() handles the specific status narrowing locally
          this.allReservations = reservations;
          this.applyFilters();
          this.loading = false;
        });
    } else {
      this.resCampingService.fetchByStatus(backendStatus as any)
        .subscribe((reservations: Reservation[]) => {
          this.allReservations = reservations;
          this.applyFilters();
          this.loading = false;
        });
    }
  }
}