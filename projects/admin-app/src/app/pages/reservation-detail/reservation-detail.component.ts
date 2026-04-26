import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ReservationService } from '../../../../../shared/src/services/reservation.service';
import { AdminReservationService } from '../../core/services/admin-reservation.service';
import {
  ReservationResponse,
  ReservationTourTypeResponse,
  ReservationTourResponse,
  ReservationExtraResponse,
  ParticipantResponse,
  GuideResponse,
  ChauffeurResponse
} from '../../../../../shared/src/models/reservation-api.model';
import { PaymentModalComponent } from '../../../../../shared/src/lib/components/payment-modal/payment-modal.component';
import { PAYMENT_METHOD_LABELS, PaymentRequest, PaymentSummary, TransactionResponse } from '../../../../../shared/src/models/transaction.model';

interface StaffInputRow {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

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

  // ── Rejection modal ───────────────────────────────────────────
  showRejectModal = false;
  rejectionReason = '';

  // ── Payment modal ─────────────────────────────────────────────
  showPaymentModal = false;
  paymentError: string | null = null;

  // ── Staff state ───────────────────────────────────────────────
  newGuides:     StaffInputRow[] = [];
  newChauffeurs: StaffInputRow[] = [];
  isSavingStaff = false;
  staffError: string | null = null;

  // Edit mode — tracks which guide/chauffeur is being edited
  editingGuideId:     string | null = null;
  editingChauffeurId: string | null = null;
  editGuideForm:     StaffInputRow = { firstName: '', lastName: '', phoneNumber: '' };
  editChauffeurForm: StaffInputRow = { firstName: '', lastName: '', phoneNumber: '' };

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private adminService: AdminReservationService,
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

  // ── Type helpers ──────────────────────────────────────────────
  isHebergement(): boolean { return this.reservation?.reservationType === 'HEBERGEMENT'; }
  isTours():       boolean { return this.reservation?.reservationType === 'TOURS'; }
  isExtras():      boolean { return this.reservation?.reservationType === 'EXTRAS'; }

  // ── Status helpers ────────────────────────────────────────────
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

  // ── Date helpers ──────────────────────────────────────────────
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

  // ── Financial helpers ─────────────────────────────────────────
  get summary(): PaymentSummary | undefined { return this.reservation?.paymentSummary; }
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

  get paymentStatusClass(): string { return (this.summary?.paymentStatus ?? 'UNPAID').toLowerCase(); }
  get isFullyPaid(): boolean { return this.summary?.paymentStatus === 'PAID'; }

  // ── Transactions ──────────────────────────────────────────────
  get transactions(): TransactionResponse[] { return this.reservation?.transactions ?? []; }

  formatTransactionMethod(method: string): string {
    return PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method;
  }

  // ── Data accessors ────────────────────────────────────────────
  get tourTypes():    ReservationTourTypeResponse[] { return this.reservation?.tourTypes    ?? []; }
  get tours():        ReservationTourResponse[]     { return this.reservation?.tours        ?? []; }
  get extras():       ReservationExtraResponse[]    { return this.reservation?.extras       ?? []; }
  get participants(): ParticipantResponse[]         { return this.reservation?.participants ?? []; }
  get guides():       GuideResponse[]               { return this.reservation?.guides       ?? []; }
  get chauffeurs():   ChauffeurResponse[]           { return this.reservation?.chauffeurs   ?? []; }

  getShortId(): string {
    return (this.reservation?.reservationId ?? '').slice(0, 8).toUpperCase();
  }

  // ── Staff — new row management ────────────────────────────────

  addGuideRow(): void {
    this.newGuides.push({ firstName: '', lastName: '', phoneNumber: '' });
  }

  removeGuideRow(index: number): void {
    this.newGuides.splice(index, 1);
  }

  addChauffeurRow(): void {
    this.newChauffeurs.push({ firstName: '', lastName: '', phoneNumber: '' });
  }

  removeChauffeurRow(index: number): void {
    this.newChauffeurs.splice(index, 1);
  }

  get hasNewStaff(): boolean {
    return this.newGuides.length > 0 || this.newChauffeurs.length > 0;
  }

  saveStaff(): void {
    if (!this.reservation) return;

    // Validate all new rows have firstName and lastName
    const invalidGuide = this.newGuides.some(g => !g.firstName.trim() || !g.lastName.trim());
    const invalidChauffeur = this.newChauffeurs.some(c => !c.firstName.trim() || !c.lastName.trim());

    if (invalidGuide || invalidChauffeur) {
      this.staffError = 'Le prénom et le nom sont obligatoires pour chaque membre du personnel.';
      return;
    }

    this.isSavingStaff = true;
    this.staffError = null;

    const request = {
      guides: this.newGuides.length > 0 ? this.newGuides.map(g => ({
        firstName:   g.firstName.trim(),
        lastName:    g.lastName.trim(),
        phoneNumber: g.phoneNumber.trim() || undefined
      })) : undefined,
      chauffeurs: this.newChauffeurs.length > 0 ? this.newChauffeurs.map(c => ({
        firstName:   c.firstName.trim(),
        lastName:    c.lastName.trim(),
        phoneNumber: c.phoneNumber.trim() || undefined
      })) : undefined,
    };

    this.adminService.addStaff(this.reservation.reservationId, request).subscribe({
      next: res => {
        this.reservation = res;
        this.newGuides = [];
        this.newChauffeurs = [];
        this.isSavingStaff = false;
      },
      error: err => {
        this.staffError = err?.error?.message ?? 'Erreur lors de l\'enregistrement du personnel.';
        this.isSavingStaff = false;
      }
    });
  }

  // ── Staff — edit existing ─────────────────────────────────────

  startEditGuide(guide: GuideResponse): void {
    this.editingGuideId = guide.guideId;
    this.editGuideForm = {
      firstName:   guide.firstName,
      lastName:    guide.lastName,
      phoneNumber: guide.phoneNumber ?? ''
    };
  }

  cancelEditGuide(): void {
    this.editingGuideId = null;
  }

  saveEditGuide(guideId: string): void {
    if (!this.reservation) return;
    this.adminService.updateGuide(
      this.reservation.reservationId,
      guideId,
      {
        firstName:   this.editGuideForm.firstName.trim() || undefined,
        lastName:    this.editGuideForm.lastName.trim()  || undefined,
        phoneNumber: this.editGuideForm.phoneNumber.trim() || undefined
      }
    ).subscribe({
      next: res => {
        this.reservation = res;
        this.editingGuideId = null;
      },
      error: err => {
        this.staffError = err?.error?.message ?? 'Erreur lors de la modification du guide.';
      }
    });
  }

  deleteGuide(guideId: string): void {
    if (!this.reservation || !confirm('Supprimer ce guide ?')) return;
    this.adminService.deleteGuide(this.reservation.reservationId, guideId).subscribe({
      next: () => this.refreshReservation(),
      error: err => {
        this.staffError = err?.error?.message ?? 'Erreur lors de la suppression du guide.';
      }
    });
  }

  startEditChauffeur(chauffeur: ChauffeurResponse): void {
    this.editingChauffeurId = chauffeur.chauffeurId;
    this.editChauffeurForm = {
      firstName:   chauffeur.firstName,
      lastName:    chauffeur.lastName,
      phoneNumber: chauffeur.phoneNumber ?? ''
    };
  }

  cancelEditChauffeur(): void {
    this.editingChauffeurId = null;
  }

  saveEditChauffeur(chauffeurId: string): void {
    if (!this.reservation) return;
    this.adminService.updateChauffeur(
      this.reservation.reservationId,
      chauffeurId,
      {
        firstName:   this.editChauffeurForm.firstName.trim()   || undefined,
        lastName:    this.editChauffeurForm.lastName.trim()    || undefined,
        phoneNumber: this.editChauffeurForm.phoneNumber.trim() || undefined
      }
    ).subscribe({
      next: res => {
        this.reservation = res;
        this.editingChauffeurId = null;
      },
      error: err => {
        this.staffError = err?.error?.message ?? 'Erreur lors de la modification du chauffeur.';
      }
    });
  }

  deleteChauffeur(chauffeurId: string): void {
    if (!this.reservation || !confirm('Supprimer ce chauffeur ?')) return;
    this.adminService.deleteChauffeur(this.reservation.reservationId, chauffeurId).subscribe({
      next: () => this.refreshReservation(),
      error: err => {
        this.staffError = err?.error?.message ?? 'Erreur lors de la suppression du chauffeur.';
      }
    });
  }

  // ── Refresh helper ────────────────────────────────────────────
  private refreshReservation(): void {
    if (!this.reservation) return;
    this.reservationService.getReservationById(this.reservation.reservationId).subscribe({
      next: res => this.reservation = res
    });
  }

  // ── Payment modal ─────────────────────────────────────────────
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
      next: () => {
        this.showPaymentModal = false;
        this.refreshReservation();
      },
      error: err => {
        this.paymentError = err.error?.message ?? 'Erreur lors de l\'enregistrement du paiement.';
        this.showPaymentModal = false;
      }
    });
  }

  // ── Status actions ────────────────────────────────────────────
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
  get isStaffManageable(): boolean {
    const status = this.reservation?.status;
    return status !== 'CANCELLED'
        && status !== 'REJECTED'
        && status !== 'COMPLETED';
  }
}