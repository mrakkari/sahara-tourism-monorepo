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
      this.reservationService.getAllReservations().subscribe(() => {
        this.reservation = this.reservationService.getReservationById(id);
        if (this.reservation) {
          this.generateGuestList();
        }
      });
    }
  }

  generateGuestList(): void {
    if (!this.reservation) return;

    const numberOfPeople = this.reservation.numberOfPeople;
    const passengerNames = Array.from(SAMPLE_PASSENGER_NAMES);
    
    // Shuffle the names to get random selection
    const shuffled = passengerNames.sort(() => 0.5 - Math.random());
    
    this.guestList = [];
    for (let i = 0; i < numberOfPeople; i++) {
      // Use modulo to cycle through names if we need more than available
      const name = shuffled[i % shuffled.length];
      
      // Generate realistic ages: first guest is adult, others can vary
      const isAdult = i === 0 ? true : Math.random() > 0.3; // 70% adults, 30% children
      const age = isAdult 
        ? Math.floor(Math.random() * (65 - 25) + 25) // Adults: 25-65
        : Math.floor(Math.random() * (17 - 5) + 5);   // Children: 5-17
      
      this.guestList.push({
        name,
        age,
        isAdult
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

  getTourLabel(): string {
    // Use tourType from reservation root level if available, otherwise from groupInfo
    const tourType = this.reservation?.tourType || this.reservation?.groupInfo.tourType;
    return tourType || 'Type de tour non spécifié';
  }

  confirmReservation(): void {
    if (this.reservation && confirm('Confirm this reservation?')) {
      this.reservationService.confirmReservation(this.reservation.id);
      this.reservation = this.reservationService.getReservationById(this.reservation.id);
    }
  }

  rejectReservation(): void {
    if (this.reservation && confirm('Reject this reservation?')) {
      this.reservationService.rejectReservation(this.reservation.id);
      this.reservation = this.reservationService.getReservationById(this.reservation.id);
    }
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