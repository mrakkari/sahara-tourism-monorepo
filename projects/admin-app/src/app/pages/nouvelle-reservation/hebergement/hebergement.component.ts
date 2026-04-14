import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../../../../../shared/src/services/reservation.service';
import { TourType } from '../../../../../../shared/src/models/tour-type.model';
import { ExtraResponse } from '../../../../../../shared/src/models/extra.model';
import { UserResponse } from '../../../../../../shared/src/models/user.model';
import { ReservationRequest } from '../../../../../../shared/src/models/reservation-api.model';
import { PaymentModalComponent } from '../../../../../../shared/src/lib/components/payment-modal/payment-modal.component';
import { PaymentRequest } from '../../../../../../shared/src/models/transaction.model';

@Component({
  selector: 'app-hebergement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,PaymentModalComponent],
  templateUrl: './hebergement.component.html',
  styleUrls: ['./hebergement.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('0.3s ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HebergementComponent implements OnInit {

  readonly SOURCE = 'ADMIN-APP';

  form!: FormGroup;
  isSubmitting = false;

  users: UserResponse[]    = [];
  tourTypes: TourType[]    = [];
  extras: ExtraResponse[]  = [];

  isLoadingUsers     = false;
  isLoadingTourTypes = false;
  isLoadingExtras    = false;

  selectedExtras: Record<string, number> = {};

  // pricing preview
  discountAmount  = 0;
  appliedPromo    = '';
  promoApplied    = false;
  promoError      = false;
  promoMessage    = '';

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
    this.loadTourTypes();
    this.loadExtras();
  }

  // ─── Form ──────────────────────────────────────────────────────

  private buildForm(): void {
    const today    = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86_400_000 * 2).toISOString().split('T')[0];

    this.form = this.fb.group({
      userId:          ['', Validators.required],
      checkInDate:     [today,    Validators.required],
      checkOutDate:    [tomorrow, Validators.required],
      numberOfAdults:  [2, [Validators.required, Validators.min(1)]],
      numberOfChildren:[0, Validators.min(0)],
      groupLeaderName: [''],
      groupName:       [''],
      demandeSpecial:  [''],
      promoCode:       [''],
      currency:        ['TND'],
      tourTypes:       this.fb.array([]),
    });
  }
  max(a: number, b: number): number {
    return Math.max(a, b);
    }

  get tourTypesArray(): FormArray { return this.form.get('tourTypes') as FormArray; }
  get isMulti(): boolean { return this.tourTypesArray.length > 1; }

  // ─── Loaders ───────────────────────────────────────────────────

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.reservationService.getClientsAndPartenaires().subscribe({
      next: u => { this.users = u; this.isLoadingUsers = false; },
      error: () => this.isLoadingUsers = false
    });
  }

  loadTourTypes(): void {
    this.isLoadingTourTypes = true;
    this.reservationService.getAllTourTypes().subscribe({
      next: t => { this.tourTypes = t; this.isLoadingTourTypes = false; },
      error: () => this.isLoadingTourTypes = false
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

  // ─── User helpers ──────────────────────────────────────────────

  getSelectedUser(): UserResponse | undefined {
    return this.users.find(u => u.userId === this.form.get('userId')?.value);
  }

  isPartner(): boolean {
    return this.getSelectedUser()?.role === 'PARTENAIRE';
  }

  adultPrice(tt: TourType): number {
    return this.isPartner() ? tt.partnerAdultPrice : tt.passengerAdultPrice;
  }

  childPrice(tt: TourType): number {
    return this.isPartner() ? tt.partnerChildPrice : tt.passengerChildPrice;
  }

  // ─── Tour type selection ────────────────────────────────────────

  isTourSelected(id: string): boolean {
    return this.tourTypesArray.controls.some(c => c.get('tourTypeId')?.value === id);
  }

  toggleTourType(tt: TourType): void {
    const idx = this.tourTypesArray.controls.findIndex(c => c.get('tourTypeId')?.value === tt.tourTypeId);
    if (idx >= 0) {
      this.tourTypesArray.removeAt(idx);
    } else {
      this.tourTypesArray.push(this.fb.group({
        tourTypeId:       [tt.tourTypeId],
        name:             [tt.name],
        numberOfAdults:   [this.form.get('numberOfAdults')?.value ?? 2],
        numberOfChildren: [this.form.get('numberOfChildren')?.value ?? 0],
      }));
    }
  }

  getTourFG(id: string): FormGroup | null {
    const c = this.tourTypesArray.controls.find(c => c.get('tourTypeId')?.value === id);
    return c ? (c as FormGroup) : null;
  }

  getTourByTypeId(id: string): TourType | undefined {
    return this.tourTypes.find(t => t.tourTypeId === id);
  }

  isAllocationValid(): boolean {
    if (!this.isMulti) return true;
    const sumA = this.tourTypesArray.controls.reduce((s,c) => s + (+(c.get('numberOfAdults')?.value)||0), 0);
    const sumC = this.tourTypesArray.controls.reduce((s,c) => s + (+(c.get('numberOfChildren')?.value)||0), 0);
    return sumA === this.adults && sumC === this.children;
  }

  allocationMessage(): string {
    if (!this.isMulti) return '';
    const diffA = this.adults   - this.tourTypesArray.controls.reduce((s,c)=>s+(+(c.get('numberOfAdults')?.value)||0),0);
    const diffC = this.children - this.tourTypesArray.controls.reduce((s,c)=>s+(+(c.get('numberOfChildren')?.value)||0),0);
    const msgs: string[] = [];
    if (diffA > 0) msgs.push(`${diffA} adulte(s) non assigné(s)`);
    if (diffA < 0) msgs.push(`Trop d'adultes (+${-diffA})`);
    if (diffC > 0) msgs.push(`${diffC} enfant(s) non assigné(s)`);
    if (diffC < 0) msgs.push(`Trop d'enfants (+${-diffC})`);
    return msgs.join(' · ');
  }

  // ─── Counters ──────────────────────────────────────────────────

  get adults():   number { return +(this.form.get('numberOfAdults')?.value)   || 0; }
  get children(): number { return +(this.form.get('numberOfChildren')?.value) || 0; }
  get nights():   number {
    const ci = this.form.get('checkInDate')?.value;
    const co = this.form.get('checkOutDate')?.value;
    if (!ci || !co) return 0;
    return Math.max(0, Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000));
  }

  updateCount(field: 'numberOfAdults' | 'numberOfChildren', delta: number): void {
    const min = field === 'numberOfAdults' ? 1 : 0;
    this.form.get(field)?.setValue(Math.max(min, (+(this.form.get(field)?.value)||0) + delta));
  }

  // ─── Extras ────────────────────────────────────────────────────

  toggleExtra(id: string): void { this.selectedExtras[id] = this.selectedExtras[id] > 0 ? 0 : 1; }
  adjustExtra(id: string, d: number): void {
    const n = (this.selectedExtras[id]||0) + d;
    if (n >= 1 && n <= this.adults + this.children) this.selectedExtras[id] = n;
  }
  isExtraSelected(id: string): boolean { return (this.selectedExtras[id]||0) > 0; }
  extraQty(id: string): number { return this.selectedExtras[id]||0; }

  // ─── Pricing ───────────────────────────────────────────────────

  tourTypesTotal(): number {
    const n = Math.max(1, this.nights);
    return this.tourTypesArray.controls.reduce((sum, ctrl) => {
      const tt = this.getTourByTypeId(ctrl.get('tourTypeId')?.value);
      if (!tt) return sum;
      const a = this.isMulti ? (+(ctrl.get('numberOfAdults')?.value)||0)   : this.adults;
      const c = this.isMulti ? (+(ctrl.get('numberOfChildren')?.value)||0) : this.children;
      return sum + (a * this.adultPrice(tt) + c * this.childPrice(tt)) * n;
    }, 0);
  }

  extrasTotal(): number {
    return this.extras.reduce((s, e) => s + (this.selectedExtras[e.extraId]||0) * e.unitPrice, 0);
  }

  baseTotal():  number { return this.tourTypesTotal() + this.extrasTotal(); }
  finalTotal(): number { return Math.max(0, this.baseTotal() - this.discountAmount); }

  applyPromo(): void {
    const code = (this.form.get('promoCode')?.value || '').toUpperCase();
    if (!code) { this.promoApplied = false; this.discountAmount = 0; this.promoMessage = ''; return; }
    if (code === 'SAHARA10') {
      this.discountAmount = this.baseTotal() * 0.1;
      this.appliedPromo = code; this.promoApplied = true; this.promoError = false;
      this.promoMessage = 'Code valide — 10 % de réduction appliqué';
    } else {
      this.discountAmount = 0; this.promoApplied = false; this.promoError = true;
      this.promoMessage = 'Code promo invalide ou expiré';
    }
  }

  // ─── Validation ────────────────────────────────────────────────

  canSubmit(): boolean {
    return !!this.form.get('userId')?.value
      && !!this.form.get('checkInDate')?.value
      && !!this.form.get('checkOutDate')?.value
      && this.nights > 0
      && this.adults >= 1
      && this.tourTypesArray.length > 0
      && this.isAllocationValid();
  }

  showGroupName(): boolean { return this.adults + this.children > 2; }

  // ─── Submit ────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.isSubmitting = true;

    const fv = this.form.value;

    const tourTypesPayload = this.tourTypesArray.controls.map(c => ({
      tourTypeId:       c.get('tourTypeId')?.value as string,
      numberOfAdults:   this.isMulti ? (+(c.get('numberOfAdults')?.value)||0)   : this.adults,
      numberOfChildren: this.isMulti ? (+(c.get('numberOfChildren')?.value)||0) : this.children,
    }));

    const extrasPayload = this.extras
      .filter(e => (this.selectedExtras[e.extraId]||0) > 0)
      .map(e => ({ extraId: e.extraId, quantity: this.selectedExtras[e.extraId] }));

    const request: ReservationRequest = {
      userId:          fv.userId,
      source:          this.SOURCE,
      reservationType: 'HEBERGEMENT',
      checkInDate:     fv.checkInDate,
      checkOutDate:    fv.checkOutDate,
      numberOfAdults:  this.adults,
      numberOfChildren:this.children,
      groupLeaderName: fv.groupLeaderName || undefined,
      groupName:       fv.groupName       || undefined,
      demandeSpecial:  fv.demandeSpecial  || undefined,
      promoCode:       this.appliedPromo  || undefined,
      currency:        fv.currency        || 'TND',
      tourTypes:       tourTypesPayload,
      extras:          extrasPayload.length > 0 ? extrasPayload : undefined,
      initialPayment: this.initialPayment ?? undefined,
    };

    this.reservationService.createReservation(request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/reservations']);
      },
      error: err => {
        console.error(err);
        this.isSubmitting = false;
      }
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
}