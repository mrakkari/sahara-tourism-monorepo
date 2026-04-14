// admin/src/app/pages/reservation-detail/reservation-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ReservationService } from '../../../../../shared/src/services/reservation.service';
import {
  ReservationResponse,
  ReservationTourTypeResponse,
  ReservationTourResponse,
  ReservationExtraResponse,
  ParticipantResponse,
  ReservationType
} from '../../../../../shared/src/models/reservation-api.model';
import { PaymentModalComponent } from '../../../../../shared/src/lib/components/payment-modal/payment-modal.component';
import { PAYMENT_METHOD_LABELS, PaymentRequest,PaymentSummary, TransactionResponse } from '../../../../../shared/src/models/transaction.model';


@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaymentModalComponent],
  templateUrl: './reservation-detail.component.html',
  styleUrls: ['./reservation-detail.component.scss']
})
export class ReservationDetailComponent implements OnInit {

  reservation?: ReservationResponse;
  isLoading = true;
  error: string | null = null;

  // Rejection modal
  showRejectModal  = false;
  rejectionReason  = '';

  // Payment modal
  showPaymentModal = false;
  paymentError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.reservationService.getReservationById(id).subscribe({
        next: res => { this.reservation = res; this.isLoading = false; },
        error: err => {
          console.error('Failed to load reservation:', err);
          this.error = 'Impossible de charger la réservation.';
          this.isLoading = false;
        }
      });
    }
  }

  // ─── Type helpers ──────────────────────────────────────────────
  isHebergement(): boolean { return this.reservation?.reservationType === 'HEBERGEMENT'; }
  isTours():       boolean { return this.reservation?.reservationType === 'TOURS'; }
  isExtras():      boolean { return this.reservation?.reservationType === 'EXTRAS'; }

  // ─── Status helpers ────────────────────────────────────────────
  get statusLabel(): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', CONFIRMED: 'Confirmée',
      CHECKED_IN: 'Arrivée', CANCELLED: 'Annulée',
      REJECTED: 'Rejetée', COMPLETED: 'Terminée',
    };
    return map[this.reservation?.status ?? ''] ?? this.reservation?.status ?? '';
  }

  get statusClass(): string { return (this.reservation?.status ?? '').toLowerCase(); }

  isPending():   boolean { return this.reservation?.status === 'PENDING'; }
  isConfirmed(): boolean { return this.reservation?.status === 'CONFIRMED'; }
  isCheckedIn(): boolean { return this.reservation?.status === 'CHECKED_IN'; }
  isCancelled(): boolean { return this.reservation?.status === 'CANCELLED'; }
  isRejected():  boolean { return this.reservation?.status === 'REJECTED'; }
  isCompleted(): boolean { return this.reservation?.status === 'COMPLETED'; }

  // ─── Date helpers ──────────────────────────────────────────────
  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  formatDateTime(d?: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  getNights(): number {
    if (!this.reservation?.checkInDate || !this.reservation?.checkOutDate) return 0;
    const diff = new Date(this.reservation.checkOutDate).getTime()
               - new Date(this.reservation.checkInDate).getTime();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  // ─── Financial helpers — now from paymentSummary ───────────────
  get summary(): PaymentSummary | undefined {
    return this.reservation?.paymentSummary;
  }

  get totalAmount(): number  { return this.reservation?.totalAmount ?? 0; }
  get extrasAmount(): number { return this.reservation?.totalExtrasAmount ?? 0; }
  get grandTotal(): number   { return this.summary?.originalTotalAmount ?? (this.totalAmount + this.extrasAmount); }
  get paidAmount(): number   { return this.summary?.totalPaid ?? 0; }
  get remaining(): number    { return this.summary?.remainingTotal ?? this.grandTotal; }

  get paymentProgress(): number {
    if (this.grandTotal === 0) return 0;
    return Math.min(100, (this.paidAmount / this.grandTotal) * 100);
  }

  get paymentStatusLabel(): string {
    const map: Record<string, string> = {
      UNPAID: 'Non payé', PARTIALLY_PAID: 'Partiellement payé', PAID: 'Payé',
    };
    return map[this.summary?.paymentStatus ?? 'UNPAID'] ?? 'Non payé';
  }

  get paymentStatusClass(): string {
    return (this.summary?.paymentStatus ?? 'UNPAID').toLowerCase();
  }

  get isFullyPaid(): boolean {
    return this.summary?.paymentStatus === 'PAID';
  }

  // ─── Transactions history ──────────────────────────────────────
  get transactions(): TransactionResponse[] {
    return this.reservation?.transactions ?? [];
  }

  formatTransactionMethod(method: string): string {
    return PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method;
  }

  // ─── Data accessors ────────────────────────────────────────────
  get tourTypes():    ReservationTourTypeResponse[] { return this.reservation?.tourTypes    ?? []; }
  get tours():        ReservationTourResponse[]     { return this.reservation?.tours        ?? []; }
  get extras():       ReservationExtraResponse[]    { return this.reservation?.extras       ?? []; }
  get participants(): ParticipantResponse[]         { return this.reservation?.participants ?? []; }

  getShortId(): string {
    return (this.reservation?.reservationId ?? '').slice(0, 8).toUpperCase();
  }

  // ─── Payment modal ─────────────────────────────────────────────
  openPaymentModal(): void {
    this.paymentError = null;
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  onPaymentConfirmed(request: PaymentRequest): void {
    if (!this.reservation) return;

    this.reservationService.recordPayment(this.reservation.reservationId, request).subscribe({
      next: paymentResponse => {
        this.showPaymentModal = false;
        // Refresh the full reservation to get updated paymentSummary + transactions
        this.reservationService.getReservationById(this.reservation!.reservationId).subscribe({
          next: res => this.reservation = res
        });
      },
      error: err => {
        const message = err.error?.message ?? 'Erreur lors de l\'enregistrement du paiement.';
        this.paymentError = message;
        // Pass error to modal to display it inline
        this.showPaymentModal = false;
      }
    });
  }

  // ─── Status actions ────────────────────────────────────────────
  confirm(): void {
    if (!this.reservation) return;
    this.reservationService.confirmReservation(this.reservation.reservationId).subscribe({
      next: res => this.reservation = res,
      error: err => console.error('Erreur confirmation:', err)
    });
  }

  openRejectModal(): void  { this.showRejectModal = true; this.rejectionReason = ''; }
  closeRejectModal(): void { this.showRejectModal = false; }

  submitRejection(): void {
    if (!this.reservation) return;
    this.reservationService.rejectReservation(
      this.reservation.reservationId,
      this.rejectionReason.trim() || undefined
    ).subscribe({
      next: res => { this.reservation = res; this.closeRejectModal(); },
      error: err => console.error('Erreur rejet:', err)
    });
  }

  checkIn(): void {
    if (!this.reservation) return;
    this.reservationService.checkInReservation(this.reservation.reservationId).subscribe({
      next: res => this.reservation = res,
      error: err => console.error('Erreur check-in:', err)
    });
  }

  complete(): void {
    if (!this.reservation) return;
    this.reservationService.completeReservation(this.reservation.reservationId).subscribe({
      next: res => this.reservation = res,
      error: err => console.error('Erreur completion:', err)
    });
  }

  cancel(): void {
    if (!this.reservation) return;
    this.reservationService.cancelReservation(this.reservation.reservationId).subscribe({
      next: res => this.reservation = res,
      error: err => console.error('Erreur annulation:', err)
    });
  }
}