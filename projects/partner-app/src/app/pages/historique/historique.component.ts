import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import { TourType } from '../../models/tour.model';
import { ReservationResponse, BackendReservationStatus } from '../../models/reservation-api.model';
import { Router } from '@angular/router';

@Component({
    selector: 'app-historique',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './historique.component.html',
    styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent implements OnInit {
    reservations: ReservationResponse[] = [];
    filteredReservations: ReservationResponse[] = [];
    paginatedReservations: ReservationResponse[] = [];
    loading = true;
    cancelLoading = false;
    cancelError: string | null = null;
    cancelSuccess = false;

    statusFilter: 'all' | BackendReservationStatus = 'all';
    tourTypeFilter = 'all';
    searchQuery = '';
    sortBy: 'date' | 'amount' = 'date';
    sortOrder: 'asc' | 'desc' = 'desc';

    selectedReservation: ReservationResponse | null = null;
    allTourTypes: TourType[] = [];

    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 0;

    Math = Math;

    constructor(
        private reservationService: ReservationService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadTourTypes();
        this.loadReservations();
    }

    private loadTourTypes(): void {
        this.reservationService.getAllTourTypes().subscribe({
            next: (types) => this.allTourTypes = types,
            error: (err) => console.error('Failed to load tour types', err)
        });
    }

    loadReservations(): void {
        this.loading = true;
        this.reservationService.getMyReservations().subscribe({
            next: (reservations) => {
                this.reservations = reservations;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading reservations:', err);
                this.loading = false;
            }
        });
    }

    // ── Display helpers (map backend fields to display values) ──

    getClientName(res: ReservationResponse): string {
        return res.groupLeaderName || res.userName || '—';
    }

    getTourTypeNames(res: ReservationResponse): string {
        if (!res.tourTypes || res.tourTypes.length === 0) return '—';
        return res.tourTypes.map(t => t.name).join(', ');
    }

    getTotalAmount(res: ReservationResponse): number {
        return (res.totalAmount || 0) + (res.totalExtrasAmount || 0);
    }

    // ── Filters ──────────────────────────────────────────────────

    applyFilters(): void {
        let result = [...this.reservations];

        if (this.statusFilter !== 'all') {
            result = result.filter(r => r.status === this.statusFilter);
        }

        if (this.tourTypeFilter !== 'all') {
            result = result.filter(r =>
                r.tourTypes?.some(t => t.name === this.tourTypeFilter)
            );
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(r =>
                r.groupLeaderName?.toLowerCase().includes(query) ||
                r.groupName?.toLowerCase().includes(query) ||
                r.tourTypes?.some(t => t.name.toLowerCase().includes(query))
            );
        }

        result.sort((a, b) => {
            let comparison = 0;
            if (this.sortBy === 'date') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (this.sortBy === 'amount') {
                comparison = this.getTotalAmount(a) - this.getTotalAmount(b);
            }
            return this.sortOrder === 'asc' ? comparison : -comparison;
        });

        this.filteredReservations = result;
        this.currentPage = 1;
        this.updatePagination();
    }

    // ── Pagination (unchanged logic) ─────────────────────────────

    updatePagination(): void {
        this.totalPages = Math.ceil(this.filteredReservations.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        this.paginatedReservations = this.filteredReservations.slice(startIndex, startIndex + this.itemsPerPage);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); }
    }

    previousPage(): void {
        if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); }
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxPagesToShow = 5;
        if (this.totalPages <= maxPagesToShow) {
            for (let i = 1; i <= this.totalPages; i++) pages.push(i);
        } else {
            if (this.currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push(-1); pages.push(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 2) {
                pages.push(1); pages.push(-1);
                for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
            } else {
                pages.push(1); pages.push(-1);
                pages.push(this.currentPage - 1);
                pages.push(this.currentPage);
                pages.push(this.currentPage + 1);
                pages.push(-1); pages.push(this.totalPages);
            }
        }
        return pages;
    }

    // ── Modal ─────────────────────────────────────────────────────

    viewDetails(reservation: ReservationResponse): void {
        this.selectedReservation = reservation;
        this.cancelError = null;      // ← ADD
        this.cancelSuccess = false;
    }

    closeDetails(): void {
        this.selectedReservation = null;
    }

    // ── Download ──────────────────────────────────────────────────

    downloadPDF(reservation: ReservationResponse): void {
        const content = this.generatePDFContent(reservation);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservation-${reservation.reservationId}.txt`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    private generatePDFContent(res: ReservationResponse): string {
        let content = `
========================================
    DÉTAILS DE LA RÉSERVATION
========================================

Groupe: ${res.groupName}
Chef de groupe: ${res.groupLeaderName}

Tours: ${this.getTourTypeNames(res)}
Date d'arrivée: ${new Date(res.checkInDate).toLocaleDateString()}
Date de départ: ${new Date(res.checkOutDate).toLocaleDateString()}

Participants:
- Adultes: ${res.numberOfAdults}
- Enfants: ${res.numberOfChildren}

Montant Tours: ${res.totalAmount} ${res.currency}
Montant Extras: ${res.totalExtrasAmount} ${res.currency}
Montant Total: ${this.getTotalAmount(res)} ${res.currency}
`;
        if (res.extras?.length > 0) {
            content += '\nExtras:\n';
            res.extras.forEach(e => {
                content += `- ${e.name}: ${e.quantity} x ${e.unitPrice} ${res.currency} = ${e.totalPrice} ${res.currency}\n`;
            });
        }
        content += `
Statut: ${res.status}
Créée le: ${new Date(res.createdAt).toLocaleDateString()}
========================================
`;
        return content;
    }

    // ── Status helpers ────────────────────────────────────────────

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
            case 'CHECKED_IN': return 'status-arrived';   // ← add
            case 'REJECTED':   return 'status-rejected';
            case 'CANCELLED':  return 'status-cancelled';
            case 'COMPLETED':  return 'status-completed';
            default: return '';
        }
    }

    // ── Cancel ────────────────────────────────────────────────────

    isCancellable(res: ReservationResponse): boolean {
        // Only PENDING or CONFIRMED can be cancelled
        if (!['PENDING', 'CONFIRMED'].includes(res.status)) return false;

        // Must be more than 48H before checkInDate
        const checkIn = new Date(res.checkInDate);
        const now = new Date();
        const diffHours = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours > 48;
    }

    cancelReservation(res: ReservationResponse): void {
        if (!confirm(`Confirmer l'annulation de la réservation de "${res.groupLeaderName}" ?`)) return;

        this.cancelLoading = true;
        this.cancelError = null;
        this.cancelSuccess = false;

        this.reservationService.cancelReservation(res.reservationId).subscribe({
            next: (updated) => {
                // Update the reservation in the local list
                const index = this.reservations.findIndex(r => r.reservationId === updated.reservationId);
                if (index !== -1) this.reservations[index] = updated;

                // Update the modal too
                this.selectedReservation = updated;

                this.cancelLoading = false;
                this.cancelSuccess = true;
                this.applyFilters();
            },
            error: (err) => {
                this.cancelLoading = false;
                // Show backend message if available
                this.cancelError = err?.error?.message || 'Annulation impossible. Veuillez réessayer.';
            }
        });
    }

    editReservation(res: ReservationResponse): void {
        this.closeDetails();
        this.router.navigate(['/create-reservation'], {
            state: { editMode: true, reservation: res }
        });
    }

    isEditable(res: ReservationResponse): boolean {
        return ['PENDING', 'CONFIRMED', 'REJECTED'].includes(res.status);
    }
}