import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.scss']
})
export class MyReservationsComponent implements OnInit {
  reservations: Reservation[] = [];

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.reservationService.getAllReservations().subscribe(reservations => {
      this.reservations = reservations;
    });
  }

  getTotalLoyaltyPoints(): number {
    return this.reservations.reduce((sum, r) => sum + (r.loyaltyPointsEarned || 0), 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '⏳ Pending',
      confirmed: '✅ Confirmed',
      rejected: '❌ Rejected',
      arrived: '🎉 Arrived'
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Not Paid',
      partial: 'Partially Paid',
      completed: 'Fully Paid'
    };
    return labels[status] || status;
  }

  getTourLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      dunes: '🏜️ Desert Dunes',
      oases: '🌴 Oases Discovery',
      mixed: '🌅 Mixed Tour',
      custom: '✨ Custom Tour'
    };
    return labels[type || 'custom'] || type || 'N/A';
  }

  getPaymentProgress(reservation: Reservation): number {
    return (reservation.payment.paidAmount / reservation.payment.totalAmount) * 100;
  }
}