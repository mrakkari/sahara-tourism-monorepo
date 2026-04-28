import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../../../../shared/src/services/reservation.service';
import { ReservationResponse } from '../../../../../shared/src/models/reservation-api.model';

@Component({
    selector: 'app-my-reservations',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-reservations.component.html',
    styleUrls: ['./my-reservations.component.scss']
})
export class MyReservationsComponent implements OnInit {
    reservations: ReservationResponse[] = [];

    constructor(private reservationService: ReservationService) {}

    ngOnInit(): void {
        this.reservationService.getMyReservations().subscribe(reservations => {
            this.reservations = reservations;
        });
    }

    // loyalty points no longer in ReservationResponse — return 0 for now
    getTotalLoyaltyPoints(): number {
        return 0;
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'CONFIRMED':  'Confirmée',
            'PENDING':    'En attente',
            'CHECKED_IN': 'En cours',
            'REJECTED':   'Rejetée',
            'CANCELLED':  'Annulée',
            'COMPLETED':  'Terminée'
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

    getTourLabel(res: ReservationResponse): string {
        if (!res.tourTypes || res.tourTypes.length === 0) return 'N/A';
        if (res.tourTypes.length === 1) return res.tourTypes[0].name;
        return `${res.tourTypes.length} Tours combinés`;
    }

    getTotalAmount(res: ReservationResponse): number {
        return (res.totalAmount || 0) + (res.totalExtrasAmount || 0);
    }
}