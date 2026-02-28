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
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatusBadgeComponent
  ],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  animations: [
    trigger('tableAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(30, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class GroupsComponent implements OnInit {
  allReservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  pagedReservations: Reservation[] = [];

  // Filters
  statusFilter = 'all';
  searchTerm = '';
  hasSearched = false;

  currentPage: number = 1;
  itemsPerPage: number = 15;

  // Make Math available in template
  Math = Math;

  constructor(
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.reservationService.getAllReservations().subscribe((reservations: Reservation[]) => {
      // Only get confirmed or arrived reservations
      this.allReservations = reservations
        .filter((r: Reservation) => r.status === 'confirmed' || r.status === 'arrived')
        .sort((a: Reservation, b: Reservation) => {
          // Priority: confirmed (ready for check-in) first, then arrived
          if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
          if (b.status === 'confirmed' && a.status !== 'confirmed') return 1;

          if (a.status === 'arrived' && b.status !== 'arrived') return -1;
          if (b.status === 'arrived' && a.status !== 'arrived') return 1;

          // Then sort by most recent date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      this.filteredReservations = this.allReservations;
      this.updatePagedData();
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReservations.length / this.itemsPerPage);
  }

  applyFilters(): void {
    this.hasSearched = true;
    let filtered = this.allReservations;

    // Filter by status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((r: Reservation) => r.status === this.statusFilter);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((r: Reservation) =>
        r.partnerName.toLowerCase().includes(term) ||
        this.getTourLabel(r.groupInfo.tourType).toLowerCase().includes(term) ||
        this.getGroupLeaderName(r).toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }

    // Sort: checked-in first, then by most recent
    this.filteredReservations = filtered.sort((a: Reservation, b: Reservation) => {
      if (a.status === 'arrived' && b.status !== 'arrived') return -1;
      if (b.status === 'arrived' && a.status !== 'arrived') return 1;
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

  getConfirmedCount(): number {
    return this.allReservations.filter((r: Reservation) => r.status === 'confirmed').length;
  }

  getArrivedCount(): number {
    return this.allReservations.filter((r: Reservation) => r.status === 'arrived').length;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getNights(r: Reservation): number {
    const checkIn = new Date(r.checkInDate).getTime();
    const checkOut = new Date(r.checkOutDate).getTime();
    return Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  }

  getTourLabel(type: string | undefined): string {
    // With real data, tour type names are already meaningful
    // Just return the name directly with a fallback
    return type || 'Tour Personnalisé';
  }

  getPaymentStatus(reservation: Reservation): string {
    if (!reservation.payment) return 'Non payé';

    const totalAmount = reservation.payment.totalAmount || 0;
    const paidAmount = reservation.payment.paidAmount || 0;

    if (paidAmount === 0) {
      return 'Non payé';
    } else if (paidAmount >= totalAmount) {
      return 'Payé 100%';
    } else {
      const percentage = Math.round((paidAmount / totalAmount) * 100);
      return `Payé ${percentage}%`;
    }
  }

  getPaymentStatusClass(reservation: Reservation): string {
    if (!reservation.payment) return 'not-paid';

    const totalAmount = reservation.payment.totalAmount || 0;
    const paidAmount = reservation.payment.paidAmount || 0;

    if (paidAmount === 0) {
      return 'not-paid';
    } else if (paidAmount >= totalAmount) {
      return 'fully-paid';
    } else {
      return 'partially-paid';
    }
  }

  getGroupLeaderName(reservation: Reservation): string {
    // Try to get the group leader name from groupInfo or use the first guest name
    return reservation.groupInfo?.leaderName ||
      reservation.groupInfo?.contactName ||
      reservation.partnerName ||
      'N/A';
  }

  markArrived(id: string): void {
    if (confirm('Confirmer l\'arrivée de ce groupe au campement ?')) {
      this.reservationService.markAsArrived(id);
      this.notificationService.showSuccess('✅ Groupe enregistré avec succès !');
      this.loadInitialData();
    }
  }
}