import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation, ReservationStatus } from '../../models/reservation.model';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import { TourType } from '../../models/tour.model';

@Component({
    selector: 'app-historique',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './historique.component.html',
    styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent implements OnInit {
    reservations: Reservation[] = [];
    filteredReservations: Reservation[] = [];
    paginatedReservations: Reservation[] = [];
    loading = true;

    statusFilter: 'all' | ReservationStatus = 'all';
    tourTypeFilter = 'all'; // now plain string, not TourType enum
    searchQuery = '';
    sortBy: 'date' | 'amount' = 'date';
    sortOrder: 'asc' | 'desc' = 'desc';

    selectedReservation: Reservation | null = null;
    allTourTypes: TourType[] = []; // loaded from backend via ReservationService

    // Pagination properties
    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 0;

    Math = Math;

    constructor(
        private reservationService: ReservationService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadTourTypes();
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.loadReservations(user.id);
            }
        });
    }

    private loadTourTypes(): void {
        this.reservationService.getAllTourTypes().subscribe({
            next: (types) => this.allTourTypes = types,
            error: (err) => console.error('Failed to load tour types', err)
        });
    }

    loadReservations(partnerId: string) {
        this.loading = true;
        this.reservationService.getAllReservations().subscribe({
            next: (reservations) => {
                this.reservations = reservations.filter(r => r.partnerId === partnerId);
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading reservations:', err);
                this.loading = false;
            }
        });
    }

    applyFilters() {
        let result = [...this.reservations];

        if (this.statusFilter !== 'all') {
            result = result.filter(r => r.status === this.statusFilter);
        }

        if (this.tourTypeFilter !== 'all') {
            result = result.filter(r => r.tourType === this.tourTypeFilter);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(r =>
                r.contactInfo?.firstName?.toLowerCase().includes(query) ||
                r.contactInfo?.lastName?.toLowerCase().includes(query) ||
                r.tourType?.toLowerCase().includes(query) // now works since tourType is string
            );
        }

        result.sort((a, b) => {
            let comparison = 0;
            if (this.sortBy === 'date') {
                comparison = new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
            } else if (this.sortBy === 'amount') {
                comparison = (a.totalPrice || 0) - (b.totalPrice || 0);
            }
            return this.sortOrder === 'asc' ? comparison : -comparison;
        });

        this.filteredReservations = result;
        this.currentPage = 1;
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredReservations.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedReservations = this.filteredReservations.slice(startIndex, endIndex);
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxPagesToShow = 5;

        if (this.totalPages <= maxPagesToShow) {
            for (let i = 1; i <= this.totalPages; i++) pages.push(i);
        } else {
            if (this.currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push(-1);
                pages.push(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 2) {
                pages.push(1);
                pages.push(-1);
                for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push(-1);
                pages.push(this.currentPage - 1);
                pages.push(this.currentPage);
                pages.push(this.currentPage + 1);
                pages.push(-1);
                pages.push(this.totalPages);
            }
        }

        return pages;
    }

    viewDetails(reservation: Reservation) {
        this.selectedReservation = reservation;
    }

    closeDetails() {
        this.selectedReservation = null;
    }

    downloadPDF(reservation: Reservation) {
        const content = this.generatePDFContent(reservation);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservation-${reservation.id}.txt`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    private generatePDFContent(res: Reservation): string {
        let content = `
========================================
    DÉTAILS DE LA RÉSERVATION
========================================

Client: ${res.contactInfo.firstName} ${res.contactInfo.lastName}
Email: ${res.contactInfo.email}
Téléphone: ${res.contactInfo.phone}

Tour: ${res.tourType}
Date: ${new Date(res.checkInDate).toLocaleDateString()} - ${new Date(res.checkOutDate).toLocaleDateString()}

Participants:
- Adultes: ${res.adults}
- Enfants: ${res.children}
- Total: ${res.numberOfPeople} personnes

Prix Total: ${res.totalPrice} EUR
`;

        if (res.extras && res.extras.length > 0) {
            content += '\nExtras:\n';
            res.extras.forEach(extra => {
                content += `- ${extra.name}: ${extra.quantity} x ${extra.unitPrice} EUR = ${extra.totalPrice} EUR\n`;
            });
        }

        if (res.payment) {
            content += `\nPaiement:
- Montant total: ${res.payment.totalAmount} EUR
- Montant payé: ${res.payment.paidAmount} EUR
- Statut: ${res.payment.paymentStatus}
`;
        }

        content += `
Statut de la réservation: ${res.status.toUpperCase()}
Date de création: ${new Date(res.createdAt).toLocaleDateString()}

========================================
`;
        return content;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'confirmed': return 'status-confirmed';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            case 'cancelled': return 'status-cancelled';
            case 'completed': return 'status-completed';
            default: return '';
        }
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'confirmed': 'Confirmée',
            'pending': 'En attente',
            'rejected': 'Rejetée',
            'cancelled': 'Annulée',
            'completed': 'Terminée'
        };
        return labels[status] || status;
    }

    getGroupInfo(reservation: Reservation): string {
        return `${reservation.adults} adultes, ${reservation.children} enfants`;
    }
}