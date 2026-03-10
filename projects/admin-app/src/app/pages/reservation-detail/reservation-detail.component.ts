import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ReservationService } from '../../core/services/reservation.service';
import { Reservation } from '../../core/models/reservation.model';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { SAMPLE_PASSENGER_NAMES } from '../../core/constants/business-data.constants';

interface GuestInfo {
  name: string;
  age: number;
  isAdult: boolean;
}

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, GlassCardComponent, StatusBadgeComponent],
  templateUrl: './reservation-detail.component.html',
  styleUrls: ['./reservation-detail.component.scss']
})
export class ReservationDetailComponent implements OnInit {
  reservation?: Reservation;
  guestList: GuestInfo[] = [];

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // ✅ Use fetchReservationById for fresh data, not the cache
      this.reservationService.fetchReservationById(id).subscribe({
        next: (reservation) => {
          this.reservation = reservation;
          this.buildGuestList();   // replaces generateGuestList()
        },
        error: (err) => console.error('Failed to load reservation:', err)
      });
    }
  }

  buildGuestList(): void {
    if (!this.reservation) return;
    this.guestList = this.reservation.groupInfo.participants.map(p => ({
      name:    p.name,
      age:     p.age,
      isAdult: p.isAdult,
    }));
  }

  confirmReservation(): void {
      if (this.reservation && confirm('Confirm this reservation?')) {
          this.reservationService.confirmReservation(this.reservation.id).subscribe({
              next: (updated) => this.reservation = updated,
              error: (err) => console.error('Erreur confirmation:', err)
          });
      }
  }

  rejectReservation(): void {
      if (!this.reservation) return;
      const reason = prompt('Rejection reason (optional):');
      if (reason === null) return; // user cancelled prompt
      this.reservationService.rejectReservation(this.reservation.id, reason || undefined).subscribe({
          next: (updated) => this.reservation = updated,
          error: (err) => console.error('Erreur rejet:', err)
      });
  }

  checkInReservation(): void {
      if (this.reservation && confirm('Mark group as checked in?')) {
          this.reservationService.checkInReservation(this.reservation.id).subscribe({
              next: (updated) => this.reservation = updated,
              error: (err) => console.error('Erreur check-in:', err)
          });
      }
  }

  completeReservation(): void {
      if (this.reservation && confirm('Mark reservation as completed?')) {
          this.reservationService.completeReservation(this.reservation.id).subscribe({
              next: (updated) => this.reservation = updated,
              error: (err) => console.error('Erreur completion:', err)
          });
      }
  }


  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateDuration(): number {
    if (!this.reservation) return 0;
    const checkIn = new Date(this.reservation.checkInDate);
    const checkOut = new Date(this.reservation.checkOutDate);
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }

  getRemaining(): number {
    if (!this.reservation) return 0;
    return this.reservation.payment.totalAmount - this.reservation.payment.paidAmount;
  }

  getPaymentProgress(): number {
    if (!this.reservation || this.reservation.payment.totalAmount === 0) return 0;
    return (this.reservation.payment.paidAmount / this.reservation.payment.totalAmount) * 100;
  }
  getTotalExtrasAmount(): number {
    if (!this.reservation) return 0;
    return this.reservation.extras.reduce((sum, e) => sum + e.totalPrice, 0);
  }

  getTourLabels(): { name: string; adults: number; children: number }[] {
    if (this.reservation?.tourTypes && this.reservation.tourTypes.length > 1) {
      return this.reservation.tourTypes.map(t => ({
        name: t.name,
        adults: t.numberOfAdults,
        children: t.numberOfChildren
      }));
    }
    // Single tour type
    const name = this.reservation?.tourTypes?.[0]?.name
      || this.reservation?.groupInfo?.tourType
      || 'Type de tour non spécifié';
    return [{ name, adults: 0, children: 0 }];
  }
  getReservationNumber(): string {
    if (!this.reservation) return '';
    // Extract just the ID part after the status prefix
    // If ID is like "pending-1", "confirmed-2", etc., get just the number
    const parts = this.reservation.id.split('-');
    
    // If there's a hyphen, return everything after the first part (status)
    if (parts.length > 1) {
      return parts.slice(1).join('-');
    }
    
    // Otherwise return first 6 chars as fallback
    return this.reservation.id.slice(0, 6);
  }
}