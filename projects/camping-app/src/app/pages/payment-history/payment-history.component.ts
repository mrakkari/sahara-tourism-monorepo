import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, GlassCardComponent],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
  animations: [
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(30, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class PaymentHistoryComponent implements OnInit {
  reservations: Reservation[] = [];
  transactionList: Array<{ partnerName: string; transaction: any }> = [];
  pagedTransactions: Array<{ partnerName: string; transaction: any }> = [];

  pageSize = 5;
  pageIndex = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.reservationService.getAllReservations().subscribe(reservations => {
      this.reservations = reservations;
      this.processTransactions();
    });
  }

  get totalPages(): number {
    return Math.ceil(this.transactionList.length / this.itemsPerPage);
  }

  processTransactions(): void {
    const transactions: Array<{ partnerName: string; transaction: any }> = [];

    this.reservations.forEach(r => {
      if (r.payment?.transactions) {
        r.payment.transactions
          .filter(t => t.method === 'onsite')
          .forEach(t => {
            transactions.push({
              partnerName: r.partnerName,
              transaction: t
            });
          });
      }
    });

    this.transactionList = transactions.sort((a, b) =>
      new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime()
    );

    this.updatePagedData();
  }

  updatePagedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedTransactions = this.transactionList.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedData();
    }
  }

  getTotalOnsitePayments(): number {
    return this.transactionList.reduce((sum, item) => sum + item.transaction.amount, 0);
  }

  getOnsiteTransactionsCount(): number {
    return this.transactionList.length;
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}