import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../../../../../shared/src/services/reservation.service';
import { Tour } from '../../../../../../shared/src/models/tour.model';
import { ExtraResponse } from '../../../../../../shared/src/models/extra.model';
import { UserResponse } from '../../../../../../shared/src/models/user.model';
import { ParticipantRequest, ReservationRequest } from '../../../../../../shared/src/models/reservation-api.model';
import { PaymentModalComponent } from '../../../../../../shared/src/lib/components/payment-modal/payment-modal.component';
import { PaymentRequest } from '../../../../../../shared/src/models/transaction.model';

@Component({
  selector: 'app-tours',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,PaymentModalComponent],
  templateUrl: './tours.component.html',
  styleUrls: ['./tours.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('0.3s ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ToursComponent implements OnInit {

  readonly SOURCE = 'ADMIN-APP';

  form!: FormGroup;
  isSubmitting = false;

  users:  UserResponse[] = [];
  tours:  Tour[]         = [];
  extras: ExtraResponse[] = [];
  participants: ParticipantRequest[] = [];

  isLoadingUsers  = false;
  isLoadingTours  = false;
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
    this.loadTours();
    this.loadExtras();
  }

    private buildForm(): void {
    this.form = this.fb.group({
        userId:           ['', Validators.required],
        selectedTourId:   ['', Validators.required],
        serviceDate:      ['', Validators.required],   // ← was departureDate
        numberOfAdults:   [2, [Validators.required, Validators.min(1)]],
        numberOfChildren: [0, Validators.min(0)],
        groupLeaderName:  [''],
        groupName:        [''],
        demandeSpecial:   [''],
        currency:         ['TND'],
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

  loadTours(): void {
    this.isLoadingTours = true;
    this.reservationService.getActiveTours().subscribe({
      next: t => { this.tours = t; this.isLoadingTours = false; },
      error: () => this.isLoadingTours = false
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

  isPartner(): boolean { return this.getSelectedUser()?.role === 'PARTENAIRE'; }

  getSelectedTour(): Tour | undefined {
    return this.tours.find(t => t.tourId === this.form.get('selectedTourId')?.value);
  }

  adultPrice(t: Tour): number { return this.isPartner() ? t.partnerAdultPrice : t.passengerAdultPrice; }
  childPrice(t: Tour): number { return this.isPartner() ? t.partnerChildPrice  : t.passengerChildPrice; }

  get adults():   number { return +(this.form.get('numberOfAdults')?.value)   || 0; }
  get children(): number { return +(this.form.get('numberOfChildren')?.value) || 0; }

  updateCount(field: 'numberOfAdults' | 'numberOfChildren', delta: number): void {
    const min = field === 'numberOfAdults' ? 1 : 0;
    this.form.get(field)?.setValue(Math.max(min, (+(this.form.get(field)?.value) || 0) + delta));
    if (this.participants.length > 0) {
      this.initParticipants();
    }
  }

  // ─── Extras ────────────────────────────────────────────────────

  toggleExtra(id: string): void { this.selectedExtras[id] = this.selectedExtras[id] > 0 ? 0 : 1; }
  adjustExtra(id: string, d: number): void {
    const n = (this.selectedExtras[id] || 0) + d;
    if (n >= 1 && n <= this.adults + this.children) this.selectedExtras[id] = n;
  }
  isExtraSelected(id: string): boolean { return (this.selectedExtras[id] || 0) > 0; }
  extraQty(id: string): number { return this.selectedExtras[id] || 0; }

  // ─── Pricing ───────────────────────────────────────────────────

  tourTotal(): number {
    const t = this.getSelectedTour();
    if (!t) return 0;
    return this.adults * this.adultPrice(t) + this.children * this.childPrice(t);
  }

  extrasTotal(): number {
    return this.extras.reduce((s, e) => s + (this.selectedExtras[e.extraId] || 0) * e.unitPrice, 0);
  }

  finalTotal(): number { return this.tourTotal() + this.extrasTotal(); }

  // ─── Validation ────────────────────────────────────────────────

    canSubmit(): boolean {
    return !!this.form.get('userId')?.value
        && !!this.form.get('selectedTourId')?.value
        && !!this.form.get('serviceDate')?.value    // ← was departureDate
        && this.adults >= 1;
    }

  showGroupName(): boolean { return this.adults + this.children > 2; }

  // ─── Submit ────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.isSubmitting = true;
    const fv = this.form.value;

    const extrasPayload = this.extras
      .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
      .map(e => ({ extraId: e.extraId, quantity: this.selectedExtras[e.extraId] }));

    const participantsPayload: ParticipantRequest[] = this.hasParticipants()
      ? this.participants.filter(p => p.fullName.trim() !== '')
      : [];

    const request: ReservationRequest = {
      userId:           fv.userId,
      source:           this.SOURCE,
      reservationType:  'TOURS',
      serviceDate:      fv.serviceDate as string,
      numberOfAdults:   this.adults,
      numberOfChildren: this.children,
      groupLeaderName:  fv.groupLeaderName?.trim() || undefined,
      groupName:        fv.groupName?.trim()       || undefined,
      demandeSpecial:   fv.demandeSpecial?.trim()  || undefined,
      currency:         fv.currency                || 'TND',
      tours: [{ tourId: fv.selectedTourId as string }],
      extras:           extrasPayload.length > 0 ? extrasPayload : undefined,
      participants:     participantsPayload.length > 0 ? participantsPayload : undefined,
      initialPayment:   this.initialPayment ?? undefined,
    };

    this.reservationService.createReservation(request).subscribe({
      next: () => { this.isSubmitting = false; this.router.navigate(['/reservations']); },
      error: err => { console.error('Erreur création tour:', err); this.isSubmitting = false; }
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
  onExtraQtyChange(id: string, value: string): void {
    const n = Math.max(0, Math.min(+value, this.adults + this.children));
    this.selectedExtras[id] = n;
  }

  onAddExtra(id: string): void {
    if (!id) return;
    this.selectedExtras[id] = 1;
  }

  onRemoveExtra(id: string): void {
    this.selectedExtras[id] = 0;
  }

  getSelectedExtras(): ExtraResponse[] {
    return this.extras.filter(e => (this.selectedExtras[e.extraId] || 0) > 0);
  }

  initParticipants(): void {
    this.participants = [
      ...Array(this.adults).fill(null).map(() => ({ fullName: '', age: 18, isAdult: true })),
      ...Array(this.children).fill(null).map(() => ({ fullName: '', age: 8, isAdult: false }))
    ];
  }

  updateParticipantAge(index: number, age: number): void {
    const p = this.participants[index];
    p.age = age;
    p.isAdult = age >= 12;
  }

  updateParticipantName(index: number, name: string): void {
    this.participants[index].fullName = name;
  }

  hasParticipants(): boolean {
    return this.participants.some(p => p.fullName.trim() !== '');
  }

}