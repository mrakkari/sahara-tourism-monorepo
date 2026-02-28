import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  reservation?: Reservation;
  isProcessing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.reservation = this.reservationService.getReservationById(id);
    }
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  initiatePayment(percentage: number): void {
    if (!this.reservation || this.isProcessing) return;

    this.isProcessing = true;
    const remaining = this.reservation.payment.totalAmount - this.reservation.payment.paidAmount;
    const paymentAmount = (remaining * percentage) / 100;

    // Simulate Flouci payment processing
    setTimeout(() => {
      if (this.reservation) {
        this.reservationService.addPayment(this.reservation.id, {
          amount: paymentAmount,
          date: new Date().toISOString(),
          method: 'flouci',
          description: `${percentage}% payment via Flouci (Mock)`
        });

        this.notificationService.showSuccess(`✅ Payment of ${paymentAmount} TND processed successfully!`);

        // Refresh reservation data
        this.reservation = this.reservationService.getReservationById(this.reservation.id);
        this.isProcessing = false;

        if (this.reservation && this.reservation.payment.paymentStatus === 'completed') {
          setTimeout(() => {
            this.router.navigate(['/my-reservations']);
          }, 2000);
        }
      }
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/my-reservations']);
  }
}