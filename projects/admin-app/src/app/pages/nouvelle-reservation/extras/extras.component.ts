import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../../../../../shared/src/services/reservation.service';
import { ExtraResponse } from '../../../../../../shared/src/models/extra.model';
import { UserResponse } from '../../../../../../shared/src/models/user.model';
import { ReservationRequest } from '../../../../../../shared/src/models/reservation-api.model';
import { PaymentModalComponent } from '../../../../../../shared/src/lib/components/payment-modal/payment-modal.component';
import { PaymentRequest } from '../../../../../../shared/src/models/transaction.model';
@Component({
  selector: 'app-extras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,PaymentModalComponent],
  templateUrl: './extras.component.html',
  styleUrls: ['./extras.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('0.3s ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ExtrasComponent implements OnInit {

  readonly SOURCE = 'ADMIN-APP';

  form!: FormGroup;
  isSubmitting = false;

  users:  UserResponse[]  = [];
  extras: ExtraResponse[] = [];

  isLoadingUsers  = false;
  isLoadingExtras = false;

  selectedExtras: Record<string, number> = {};

  showPaymentModal  = false;
  initialPayment: PaymentRequest | null = null;

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadUsers();
    this.loadExtras();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      userId:          ['', Validators.required],
      serviceDate:     ['', Validators.required],
      numberOfPeople:  [1, [Validators.required, Validators.min(1)]],
      groupLeaderName: [''],
      groupName:       [''],
      demandeSpecial:  [''],
      currency:        ['TND'],
    });
  }

  // ─── Loaders ───────────────────────────────────────────────────

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.reservationService.getClientsAndPartenaires().subscribe({
      next: u => { this.users = u; this.isLoadingUsers = false; },
      error: () => this.isLoadingUsers = false
    });
  }

  loadExtras(): void {
    this.isLoadingExtras = true;
    this.reservationService.getActiveExtras().subscribe({
      next: e => {
        this.extras = e;
        e.forEach(ex => this.selectedExtras[ex.extraId] = 0);
        this.isLoadingExtras = false;
      },
      error: () => this.isLoadingExtras = false
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────

  getSelectedUser(): UserResponse | undefined {
    return this.users.find(u => u.userId === this.form.get('userId')?.value);
  }

  get numberOfPeople(): number { return +(this.form.get('numberOfPeople')?.value) || 0; }

  updatePeople(delta: number): void {
    const newValue = Math.max(1, this.numberOfPeople + delta);
    this.form.get('numberOfPeople')?.setValue(newValue);
    
    // Sync all currently selected extras to the new count
    Object.keys(this.selectedExtras).forEach(id => {
      if (this.selectedExtras[id] > 0) {
        this.selectedExtras[id] = newValue;
      }
    });
  }

  // ─── Extras ────────────────────────────────────────────────────

  /** Count how many distinct extras are currently selected */
  get selectedExtrasCount(): number {
    return Object.values(this.selectedExtras).filter(q => q > 0).length;
  }

  /**
   * Show the per-extra quantity adjuster only when MORE THAN ONE extra
   * is selected (same pattern as Hébergement component).
   * When only one extra is selected its quantity equals numberOfPeople automatically.
   */
  showQtyAdjuster(id: string): boolean {
    return this.isExtraSelected(id) && this.selectedExtrasCount > 1;
  }

  toggleExtra(id: string): void {
    if (this.selectedExtras[id] > 0) {
      this.selectedExtras[id] = 0;
    } else {
      // Default qty = numberOfPeople
      this.selectedExtras[id] = this.numberOfPeople;
    }
  }

  adjustExtra(id: string, d: number): void {
    const n = (this.selectedExtras[id] || 0) + d;
    if (n >= 1 && n <= this.numberOfPeople) this.selectedExtras[id] = n;
  }

  isExtraSelected(id: string): boolean { return (this.selectedExtras[id] || 0) > 0; }
  extraQty(id: string): number { return this.selectedExtras[id] || 0; }
  hasExtras(): boolean { return Object.values(this.selectedExtras).some(q => q > 0); }

  extrasTotal(): number {
    return this.extras.reduce((s, e) => s + (this.selectedExtras[e.extraId] || 0) * e.unitPrice, 0);
  }

  // ─── Validation ────────────────────────────────────────────────

  canSubmit(): boolean {
    return !!this.form.get('userId')?.value
      && !!this.form.get('serviceDate')?.value
      && this.numberOfPeople >= 1
      && this.hasExtras();
  }

  // ─── Submit ────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.isSubmitting = true;
    const fv = this.form.value;

    const extrasPayload = this.extras
      .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
      .map(e => ({ extraId: e.extraId, quantity: this.selectedExtras[e.extraId] }));

    const request: ReservationRequest = {
      userId:           fv.userId,
      source:           this.SOURCE,
      reservationType:  'EXTRAS',
      serviceDate:      fv.serviceDate,
      numberOfAdults:   this.numberOfPeople,
      numberOfChildren: 0,
      groupLeaderName:  fv.groupLeaderName || undefined,
      groupName:        fv.groupName       || undefined,
      demandeSpecial:   fv.demandeSpecial  || undefined,
      currency:         fv.currency        || 'TND',
      extras:           extrasPayload,
      initialPayment:   this.initialPayment ?? undefined,
    };

    this.reservationService.createReservation(request).subscribe({
      next: () => { this.isSubmitting = false; this.router.navigate(['/reservations']); },
      error: err => { console.error(err); this.isSubmitting = false; }
    });
  }

  openPaymentModal(): void  { this.showPaymentModal = true; }
  closePaymentModal(): void { this.showPaymentModal = false; }

  onPaymentConfirmed(payment: PaymentRequest): void {
    this.initialPayment = payment;
    this.showPaymentModal = false;
  }

  removeInitialPayment(): void {
    this.initialPayment = null;
  }

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: 'Espèces', CREDIT_CARD: 'Carte de crédit',
      DEBIT_CARD: 'Carte de débit', BANK_TRANSFER: 'Virement bancaire',
      ONLINE: 'En ligne', CHEQUE: 'Chèque',
    };
    return labels[method] ?? method;
  }
  onAddExtra(id: string): void {
    if (!id) return;
    this.selectedExtras[id] = this.numberOfPeople;
  }

  onRemoveExtra(id: string): void {
    this.selectedExtras[id] = 0;
  }

  getSelectedExtras(): ExtraResponse[] {
    return this.extras.filter(e => (this.selectedExtras[e.extraId] || 0) > 0);
  }
}