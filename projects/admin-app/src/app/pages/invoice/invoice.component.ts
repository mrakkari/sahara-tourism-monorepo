import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReservationService } from '../../core/services/reservation.service';
import { Reservation, Invoice } from '../../core/models/reservation.model';
import { InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
  reservation?: Reservation;
  invoice?: Invoice;

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private invoiceService: InvoiceService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.reservationService.getAllReservations().subscribe(() => {
        this.reservation = this.reservationService.getReservationById(id);
        if (this.reservation) {
          this.invoice = this.invoiceService.generateInvoice(this.reservation);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTourLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      dunes: 'Desert Dunes Tour',
      oases: 'Oases Discovery Tour',
      mixed: 'Mixed Desert & Oases Tour',
      custom: 'Custom Tour Package'
    };
    return labels[type || 'custom'] || type || 'Tour Package';
  }

  calculateDuration(): number {
    if (!this.reservation) return 1;
    const checkIn = new Date(this.reservation.checkInDate);
    const checkOut = new Date(this.reservation.checkOutDate);
    return Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  }

  printInvoice(): void {
    window.print();
  }
}