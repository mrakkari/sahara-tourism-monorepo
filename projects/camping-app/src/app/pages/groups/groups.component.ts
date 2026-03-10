import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { NotificationService } from '../../services/notification.service';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

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
  allReservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  pagedReservations: Reservation[] = [];
  loading = true;

  statusFilter = 'all';
  searchTerm = '';
  hasSearched = false;

  currentPage = 1;
  itemsPerPage = 15;
  Math = Math;

  constructor(
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    // Fetch CONFIRMED from backend — these are groups awaiting check-in
    this.reservationService.fetchByStatus('CONFIRMED').subscribe({
      next: (confirmed) => {
        // Also fetch CHECKED_IN groups (currently at camp)
        this.reservationService.fetchByStatus('CHECKED_IN').subscribe({
          next: (checkedIn) => {
            this.allReservations = [...confirmed, ...checkedIn].sort((a, b) => {
              // confirmed first, then checked_in
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
      },
      error: () => this.loading = false
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReservations.length / this.itemsPerPage);
  }

  applyFilters(): void {
    this.hasSearched = true;
    let filtered = this.allReservations;

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.partnerName.toLowerCase().includes(term) ||
        this.getTourLabel(r).toLowerCase().includes(term) ||
        this.getGroupLeaderName(r).toLowerCase().includes(term) ||
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
    this.searchTerm = '';
    this.hasSearched = false;
    this.filteredReservations = this.allReservations;
    this.currentPage = 1;
    this.updatePagedData();
  }

  updatePagedData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedReservations = this.filteredReservations.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedData();
    }
  }

  getConfirmedCount(): number {
    return this.allReservations.filter(r => r.status === 'confirmed').length;
  }

  getArrivedCount(): number {
    return this.allReservations.filter(r => r.status === 'checked_in').length;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  getNights(r: Reservation): number {
    const diff = new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getTourLabel(r: Reservation): string {
    if (r.tourTypes && r.tourTypes.length > 0) {
      return r.tourTypes.map(t => t.name).join(', ');
    }
    return r.groupInfo?.tourType || 'Tour Personnalisé';
  }

  getTourNames(r: Reservation): string[] {
    if (r.tourTypes && r.tourTypes.length > 0) {
      return r.tourTypes.map(t => t.name);
    }
    return [r.groupInfo?.tourType || 'Tour Personnalisé'];
  }

  getPaymentStatus(r: Reservation): string {
    const total = r.payment.totalAmount || 0;
    const paid  = r.payment.paidAmount  || 0;
    if (paid === 0)       return 'Non payé';
    if (paid >= total)    return 'Payé 100%';
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
    return r.groupLeaderName
        || r.groupInfo?.leaderName
        || r.groupInfo?.groupLeaderName
        || r.partnerName
        || 'N/A';
  }

  markArrived(id: string): void {
    if (!confirm('Confirmer l\'arrivée de ce groupe au campement ?')) return;
    this.reservationService.markAsArrived(id).subscribe({
      next: () => {
        this.notificationService.showSuccess('✅ Groupe enregistré avec succès !');
        this.loadInitialData();
      },
      error: (err) => {
        console.error('Check-in failed:', err);
        this.notificationService.showSuccess('❌ Erreur lors du check-in.');
      }
    });
  }
}