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

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reservation-detail.component.html',
  styleUrls: ['./reservation-detail.component.scss']
})
export class ReservationDetailComponent implements OnInit {

  reservation?: ReservationResponse;
  isLoading = true;
  error: string | null = null;

  // Rejection modal state
  showRejectModal = false;
  rejectionReason = '';

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.reservationService.getReservationById(id).subscribe({
        next: res => {
          this.reservation = res;
          this.isLoading = false;
        },
        error: err => {
          console.error('Failed to load reservation:', err);
          this.error = 'Impossible de charger la réservation.';
          this.isLoading = false;
        }
      });
    }
  }

  // ─── Type helpers ──────────────────────────────────────────────

  get reservationType(): ReservationType | undefined {
    return this.reservation?.reservationType;
  }

  isHebergement(): boolean { return this.reservation?.reservationType === 'HEBERGEMENT'; }
  isTours():       boolean { return this.reservation?.reservationType === 'TOURS'; }
  isExtras():      boolean { return this.reservation?.reservationType === 'EXTRAS'; }

  // ─── Status helpers ────────────────────────────────────────────

  get statusLabel(): string {
    const map: Record<string, string> = {
      PENDING:    'En attente',
      CONFIRMED:  'Confirmée',
      CHECKED_IN: 'Arrivée',
      CANCELLED:  'Annulée',
      REJECTED:   'Rejetée',
      COMPLETED:  'Terminée',
    };
    return map[this.reservation?.status ?? ''] ?? this.reservation?.status ?? '';
  }

  get statusClass(): string {
    return (this.reservation?.status ?? '').toLowerCase();
  }

  isPending():    boolean { return this.reservation?.status === 'PENDING'; }
  isConfirmed():  boolean { return this.reservation?.status === 'CONFIRMED'; }
  isCheckedIn():  boolean { return this.reservation?.status === 'CHECKED_IN'; }
  isCancelled():  boolean { return this.reservation?.status === 'CANCELLED'; }
  isRejected():   boolean { return this.reservation?.status === 'REJECTED'; }
  isCompleted():  boolean { return this.reservation?.status === 'COMPLETED'; }

  // ─── Date / duration helpers ───────────────────────────────────

  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  formatDateTime(d?: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getNights(): number {
    if (!this.reservation?.checkInDate || !this.reservation?.checkOutDate) return 0;
    const diff = new Date(this.reservation.checkOutDate).getTime()
               - new Date(this.reservation.checkInDate).getTime();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  // ─── Financial helpers ─────────────────────────────────────────

  get totalAmount(): number  { return this.reservation?.totalAmount  ?? 0; }
  get extrasAmount(): number { return this.reservation?.totalExtrasAmount ?? 0; }
  get baseAmount(): number   { return this.totalAmount; }
  get grandTotal(): number   { return this.totalAmount + this.extrasAmount; }

  // Placeholders — will be replaced when payment endpoint is ready
  get paidAmount(): number   { return 0; }
  get remaining(): number    { return this.grandTotal - this.paidAmount; }
  get paymentProgress(): number {
    if (this.grandTotal === 0) return 0;
    return (this.paidAmount / this.grandTotal) * 100;
  }
  get paymentStatus(): string { return 'UNPAID'; }

  // ─── Data accessors ────────────────────────────────────────────

  get tourTypes(): ReservationTourTypeResponse[] {
    return this.reservation?.tourTypes ?? [];
  }

  get tours(): ReservationTourResponse[] {
    return this.reservation?.tours ?? [];
  }

  get extras(): ReservationExtraResponse[] {
    return this.reservation?.extras ?? [];
  }

  get participants(): ParticipantResponse[] {
    return this.reservation?.participants ?? [];
  }

  // ─── Short ID for display ──────────────────────────────────────

  getShortId(): string {
    return (this.reservation?.reservationId ?? '').slice(0, 8).toUpperCase();
  }

  // ─── Actions ───────────────────────────────────────────────────

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
}