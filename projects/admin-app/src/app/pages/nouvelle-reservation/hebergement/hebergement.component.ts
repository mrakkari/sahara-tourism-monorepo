import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../../../../../shared/src/services/reservation.service';
import { TourType } from '../../../../../../shared/src/models/tour-type.model';
import { ExtraResponse } from '../../../../../../shared/src/models/extra.model';
import { UserResponse } from '../../../../../../shared/src/models/user.model';
import { ParticipantRequest, ReservationRequest } from '../../../../../../shared/src/models/reservation-api.model';
import { PaymentModalComponent } from '../../../../../../shared/src/lib/components/payment-modal/payment-modal.component';
import { PaymentRequest } from '../../../../../../shared/src/models/transaction.model';
import { SourceService } from '../../../core/services/source.service';
import { SourceResponse } from '../../../../../../shared/src/models/reservation-api.model';
import { TenteType } from '../../../../../../shared/src/models/reservation-api.model';

@Component({
  selector: 'app-hebergement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PaymentModalComponent],
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

  form!: FormGroup;
  isSubmitting = false;

  users: UserResponse[]   = [];
  tourTypes: TourType[]   = [];
  extras: ExtraResponse[] = [];
  participants: ParticipantRequest[] = [];

  isLoadingUsers     = false;
  isLoadingTourTypes = false;
  isLoadingExtras    = false;

  extraItems: { extraId: string; quantity: number; activityDate: string; displayDate: string }[] = [];

  // Indexed by FormArray position (parallel arrays)
  tourTypeDisplayDates: string[]  = [];
  tourRepartitions: ({ tenteType: TenteType; numberOfTentes: number }[])[] = [];
  tourTypeRepeatCounts: number[]  = [];
  tourTypeDateWarnings: string[]  = [];

  discountAmount = 0;
  appliedPromo   = '';
  promoApplied   = false;
  promoError     = false;
  promoMessage   = '';

  showPaymentModal  = false;
  initialPayment: PaymentRequest | null = null;
  submitError = '';
  sources: SourceResponse[] = [];
  isLoadingSources = false;

  repartitionError = '';

  tenteTypes: { value: TenteType; label: string; capacity: number }[] = [
    { value: 'SINGLE', label: 'Tente Simple (1 pers.)',  capacity: 1 },
    { value: 'DOUBLE', label: 'Tente Double (2 pers.)',  capacity: 2 },
    { value: 'TRIPLE', label: 'Tente Triple (3 pers.)',  capacity: 3 },
    { value: 'X4',     label: 'Tente ×4 (4 pers.)',     capacity: 4 },
    { value: 'X5',     label: 'Tente ×5 (5 pers.)',     capacity: 5 },
    { value: 'X6',     label: 'Tente ×6 (6 pers.)',     capacity: 6 },
    { value: 'X7',     label: 'Tente ×7 (7 pers.)',     capacity: 7 },
  ];

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private sourceService: SourceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadUsers();
    this.loadTourTypes();
    this.loadExtras();
    this.loadSources();
  }

  loadSources(): void {
    this.isLoadingSources = true;
    this.sourceService.getAll().subscribe({
      next: s => { this.sources = s; this.isLoadingSources = false; },
      error: () => this.isLoadingSources = false
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      userId:          ['', Validators.required],
      sourceId:        ['', Validators.required],
      groupLeaderName: [''],
      groupName:       [''],
      demandeSpecial:  [''],
      promoCode:       [''],
      tourTypes:       this.fb.array([]),
    });
  }

  get tourTypesArray(): FormArray { return this.form.get('tourTypes') as FormArray; }

  // ─── Computed dates & people ───────────────────────────────────

  get checkInDate(): string {
    const dates = this.tourTypesArray.controls
      .map(c => c.get('activityDate')?.value as string)
      .filter(d => !!d);
    if (dates.length === 0) return '';
    return dates.reduce((min, d) => d < min ? d : min);
  }

  get checkOutDate(): string {
    let maxDate = '';
    this.tourTypesArray.controls.forEach((c, i) => {
      const base = c.get('activityDate')?.value as string;
      if (!base) return;
      const repeat = this.tourTypeRepeatCounts[i] ?? 1;
      const dt = new Date(base);
      dt.setDate(dt.getDate() + repeat - 1);
      const last = dt.toISOString().split('T')[0];
      if (!maxDate || last > maxDate) maxDate = last;
    });
    if (!maxDate) return '';
    const d = new Date(maxDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  get globalAdults(): number {
    const checkIn = this.checkInDate;
    if (!checkIn) return 0;
    return this.tourTypesArray.controls
      .filter(c => c.get('activityDate')?.value === checkIn)
      .reduce((sum, c) => sum + (+(c.get('numberOfAdults')?.value) || 0), 0);
  }

  get globalChildren(): number {
    const checkIn = this.checkInDate;
    if (!checkIn) return 0;
    return this.tourTypesArray.controls
      .filter(c => c.get('activityDate')?.value === checkIn)
      .reduce((sum, c) => sum + (+(c.get('numberOfChildren')?.value) || 0), 0);
  }

  // Aliases used by participants and extras quantity limits
  get adults():   number { return this.globalAdults; }
  get children(): number { return this.globalChildren; }

  get nights(): number {
    if (!this.checkInDate || !this.checkOutDate) return 0;
    return Math.max(0, Math.ceil(
      (new Date(this.checkOutDate).getTime() - new Date(this.checkInDate).getTime()) / 86_400_000
    ));
  }

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
      next: e => { this.extras = e; this.isLoadingExtras = false; },
      error: () => this.isLoadingExtras = false
    });
  }

  // ─── User helpers ──────────────────────────────────────────────

  getSelectedUser(): UserResponse | undefined {
    return this.users.find(u => u.userId === this.form.get('userId')?.value);
  }

  isPartner(): boolean { return this.getSelectedUser()?.role === 'PARTENAIRE'; }

  adultPrice(tt: TourType): number {
    return this.isPartner() ? tt.partnerAdultPrice : tt.passengerAdultPrice;
  }

  childPrice(tt: TourType): number {
    return this.isPartner() ? tt.partnerChildPrice : tt.passengerChildPrice;
  }

  // ─── Tour type management ──────────────────────────────────────

  onAddTourType(id: string): void {
    if (!id) return;
    const tt = this.tourTypes.find(t => t.tourTypeId === id);
    if (!tt) return;
    this.tourTypesArray.push(this.fb.group({
      tourTypeId:       [tt.tourTypeId],
      name:             [tt.name],
      numberOfAdults:   [2, [Validators.required, Validators.min(1)]],
      numberOfChildren: [0, Validators.min(0)],
      activityDate:     ['', Validators.required],
    }));
    this.tourTypeDisplayDates.push('');
    this.tourRepartitions.push([]);
    this.tourTypeRepeatCounts.push(1);
    this.tourTypeDateWarnings.push('');
  }

  onRemoveTourType(index: number): void {
    this.tourTypesArray.removeAt(index);
    this.tourTypeDisplayDates.splice(index, 1);
    this.tourRepartitions.splice(index, 1);
    this.tourTypeRepeatCounts.splice(index, 1);
    this.tourTypeDateWarnings.splice(index, 1);
    this.validateRepartition();
    if (this.participants.length > 0) this.initParticipants();
  }

  setRepeatCount(index: number, count: number): void {
    this.tourTypeRepeatCounts[index] = Math.max(1, Math.min(30, count || 1));
    // Revalidate dates for all other activities when repeats change
    this.tourTypesArray.controls.forEach((ctrl, j) => {
      if (j === index) return;
      const date = ctrl.get('activityDate')?.value as string;
      if (!date) return;
      const blocked = this.getBlockedDates(j);
      this.tourTypeDateWarnings[j] = blocked.has(date)
        ? `⚠️ Cette date est occupée par la répétition d'une autre activité.`
        : '';
    });
  }

  getRepeatEndDate(index: number): string {
    const base = this.tourTypesArray.at(index)?.get('activityDate')?.value as string;
    const repeat = this.tourTypeRepeatCounts[index] ?? 1;
    if (!base || repeat <= 1) return '';
    const dt = new Date(base);
    dt.setDate(dt.getDate() + repeat - 1);
    return this.toDisplayDate(dt.toISOString().split('T')[0]);
  }

  getBlockedDates(excludeIndex: number): Set<string> {
    const blocked = new Set<string>();
    this.tourTypesArray.controls.forEach((ctrl, i) => {
      if (i === excludeIndex) return;
      const base = ctrl.get('activityDate')?.value as string;
      const repeat = this.tourTypeRepeatCounts[i] ?? 1;
      if (!base || repeat <= 1) return;
      for (let d = 0; d < repeat; d++) {
        const dt = new Date(base);
        dt.setDate(dt.getDate() + d);
        blocked.add(dt.toISOString().split('T')[0]);
      }
    });
    return blocked;
  }

  getTourByTypeId(id: string): TourType | undefined {
    return this.tourTypes.find(t => t.tourTypeId === id);
  }

  updateActivityCount(index: number, field: 'numberOfAdults' | 'numberOfChildren', delta: number): void {
    const ctrl = this.tourTypesArray.at(index);
    const min = field === 'numberOfAdults' ? 1 : 0;
    const current = +(ctrl?.get(field)?.value) || 0;
    ctrl?.get(field)?.setValue(Math.max(min, current + delta));
    this.validateRepartition();
    if (this.participants.length > 0) this.initParticipants();
  }

  // ─── Activity date handlers (indexed by FormArray position) ────

  onTourTypeDateTextInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (val.length === 10 && val[2] === '/' && val[5] === '/') {
      const [d, m, y] = val.split('/');
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const date = new Date(iso);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (!isNaN(date.getTime()) && +d <= 31 && +m <= 12 && date >= today) {
        if (this.getBlockedDates(index).has(iso)) {
          this.tourTypeDateWarnings[index] = `⚠️ Cette date est occupée par la répétition d'une autre activité.`;
          this.tourTypesArray.at(index)?.get('activityDate')?.setValue('', { emitEvent: false });
        } else {
          this.tourTypeDateWarnings[index] = '';
          this.tourTypesArray.at(index)?.get('activityDate')?.setValue(iso, { emitEvent: true });
        }
      } else {
        this.tourTypeDateWarnings[index] = '';
        this.tourTypesArray.at(index)?.get('activityDate')?.setValue('', { emitEvent: false });
      }
    } else {
      this.tourTypeDateWarnings[index] = '';
      this.tourTypesArray.at(index)?.get('activityDate')?.setValue('', { emitEvent: false });
    }
    this.tourTypeDisplayDates[index] = val;
    if (this.participants.length > 0) this.initParticipants();
  }

  onTourTypeDatePickerChange(event: Event, index: number): void {
    const iso = (event.target as HTMLInputElement).value;
    if (!iso) return;
    if (this.getBlockedDates(index).has(iso)) {
      this.tourTypeDateWarnings[index] = `⚠️ Cette date est occupée par la répétition d'une autre activité.`;
      const wrapper = (event.target as HTMLElement).closest('.date-wrapper');
      const textInput = wrapper?.querySelector('.date-display') as HTMLInputElement;
      if (textInput) textInput.value = '';
      this.tourTypeDisplayDates[index] = '';
      return;
    }
    this.tourTypeDateWarnings[index] = '';
    this.tourTypesArray.at(index)?.get('activityDate')?.setValue(iso, { emitEvent: true });
    const display = this.toDisplayDate(iso);
    this.tourTypeDisplayDates[index] = display;
    const wrapper = (event.target as HTMLElement).closest('.date-wrapper');
    const textInput = wrapper?.querySelector('.date-display') as HTMLInputElement;
    if (textInput) textInput.value = display;
    if (this.participants.length > 0) this.initParticipants();
  }

  // ─── Extras ────────────────────────────────────────────────────

  getExtraInfo(extraId: string): ExtraResponse | undefined {
    return this.extras.find(e => e.extraId === extraId);
  }

  onAddExtra(id: string): void {
    if (!id) return;
    this.extraItems.push({ extraId: id, quantity: 1, activityDate: '', displayDate: '' });
  }

  onRemoveExtra(index: number): void {
    this.extraItems.splice(index, 1);
  }

  adjustExtra(index: number, delta: number): void {
    const item = this.extraItems[index];
    const max = this.adults + this.children;
    item.quantity = Math.max(1, Math.min(item.quantity + delta, max > 0 ? max : 99));
  }

  onExtraDateTextInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (val.length === 10 && val[2] === '/' && val[5] === '/') {
      const [d, m, y] = val.split('/');
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const date = new Date(iso);
      const checkIn  = this.checkInDate  ? new Date(this.checkInDate)  : null;
      const checkOut = this.checkOutDate ? new Date(this.checkOutDate) : null;
      const valid = !isNaN(date.getTime()) && +d <= 31 && +m <= 12;
      const inRange = !checkIn || !checkOut || (date >= checkIn && date <= checkOut);
      this.extraItems[index].activityDate = (valid && inRange) ? iso : '';
    } else {
      this.extraItems[index].activityDate = '';
    }
    this.extraItems[index].displayDate = val;
  }

  onExtraDatePickerChange(event: Event, index: number): void {
    const iso = (event.target as HTMLInputElement).value;
    if (!iso) return;
    const date     = new Date(iso);
    const checkIn  = this.checkInDate  ? new Date(this.checkInDate)  : null;
    const checkOut = this.checkOutDate ? new Date(this.checkOutDate) : null;
    const inRange  = !checkIn || !checkOut || (date >= checkIn && date <= checkOut);

    const display = this.toDisplayDate(iso);
    this.extraItems[index].displayDate = display;
    const wrapper   = (event.target as HTMLElement).closest('.date-wrapper');
    const textInput = wrapper?.querySelector('.date-display') as HTMLInputElement;
    if (textInput) textInput.value = inRange ? display : '';

    this.extraItems[index].activityDate = inRange ? iso : '';
  }

  hasExtraDuplicates(): boolean {
    const seen = new Set<string>();
    for (const item of this.extraItems) {
      const key = `${item.extraId}:${item.activityDate || 'none'}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }

  // ─── Repartitions per activity ─────────────────────────────────

  getActivityRepartitions(index: number): { tenteType: TenteType; numberOfTentes: number }[] {
    return this.tourRepartitions[index] ?? [];
  }

  addRepartitionForActivity(index: number): void {
    if (!this.tourRepartitions[index]) this.tourRepartitions[index] = [];
    this.tourRepartitions[index].push({ tenteType: 'SINGLE', numberOfTentes: 1 });
    this.validateRepartition();
  }

  removeRepartitionForActivity(activityIndex: number, repIndex: number): void {
    this.tourRepartitions[activityIndex].splice(repIndex, 1);
    this.validateRepartition();
  }

  setActivityRepartitionCount(activityIndex: number, repIndex: number, count: number): void {
    this.tourRepartitions[activityIndex][repIndex].numberOfTentes = Math.max(1, count);
    this.validateRepartition();
  }

  setActivityRepartitionType(activityIndex: number, repIndex: number, tenteType: TenteType): void {
    this.tourRepartitions[activityIndex][repIndex].tenteType = tenteType;
    this.validateRepartition();
  }

  validateRepartition(): void {
    for (let i = 0; i < this.tourTypesArray.length; i++) {
      const reps = this.tourRepartitions[i] ?? [];
      if (reps.length === 0) continue;
      const ctrl = this.tourTypesArray.at(i);
      const total = (+(ctrl?.get('numberOfAdults')?.value) || 0)
                  + (+(ctrl?.get('numberOfChildren')?.value) || 0);
      const repTotal = reps.reduce((sum, r) => sum + r.numberOfTentes * this.getTenteCapacity(r.tenteType), 0);
      if (repTotal !== total) {
        const name = ctrl?.get('name')?.value ?? `activité ${i + 1}`;
        this.repartitionError = `⚠️ La répartition de "${name}" couvre ${repTotal} pers. — l'activité en a ${total}.`;
        return;
      }
    }
    this.repartitionError = '';
  }

  isRepartitionValid(): boolean {
    for (let i = 0; i < this.tourTypesArray.length; i++) {
      const reps = this.tourRepartitions[i] ?? [];
      if (reps.length === 0) continue;
      const ctrl = this.tourTypesArray.at(i);
      const total = (+(ctrl?.get('numberOfAdults')?.value) || 0)
                  + (+(ctrl?.get('numberOfChildren')?.value) || 0);
      const repTotal = reps.reduce((sum, r) => sum + r.numberOfTentes * this.getTenteCapacity(r.tenteType), 0);
      if (repTotal !== total) return false;
    }
    return true;
  }

  getTenteLabel(type: TenteType): string {
    return this.tenteTypes.find(t => t.value === type)?.label ?? type;
  }

  getTenteCapacity(type: TenteType): number {
    return this.tenteTypes.find(t => t.value === type)?.capacity ?? 0;
  }

  // ─── Pricing ───────────────────────────────────────────────────

  tourTypesTotal(): number {
    return this.tourTypesArray.controls.reduce((sum, ctrl, i) => {
      const tt = this.getTourByTypeId(ctrl.get('tourTypeId')?.value);
      if (!tt) return sum;
      const a = +(ctrl.get('numberOfAdults')?.value)   || 0;
      const c = +(ctrl.get('numberOfChildren')?.value) || 0;
      const repeat = this.tourTypeRepeatCounts[i] ?? 1;
      return sum + (a * this.adultPrice(tt) + c * this.childPrice(tt)) * repeat;
    }, 0);
  }

  extrasTotal(): number {
    return this.extraItems.reduce((s, item) => {
      const info = this.getExtraInfo(item.extraId);
      return s + (info ? item.quantity * info.unitPrice : 0);
    }, 0);
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
    const allActivitiesValid = this.tourTypesArray.controls
      .every(c => !!c.get('activityDate')?.value && (+(c.get('numberOfAdults')?.value) || 0) >= 1);
    const allExtraDates = this.extraItems.every(item => !!item.activityDate);
    const noDateWarnings = this.tourTypeDateWarnings.every(w => !w);
    return !!this.form.get('userId')?.value
      && !!this.form.get('sourceId')?.value
      && this.tourTypesArray.length > 0
      && allActivitiesValid
      && this.isRepartitionValid()
      && allExtraDates
      && !this.hasExtraDuplicates()
      && noDateWarnings;
  }

  // ─── Submit ────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.isSubmitting = true;
    this.submitError = '';
    const fv = this.form.value;

    const tourTypesPayload: {
      tourTypeId: string; numberOfAdults: number; numberOfChildren: number;
      activityDate: string; repartitions?: { tenteType: TenteType; numberOfTentes: number }[];
    }[] = [];
    this.tourTypesArray.controls.forEach((c, i) => {
      const base    = c.get('activityDate')?.value as string;
      const repeat  = this.tourTypeRepeatCounts[i] ?? 1;
      const reps    = (this.tourRepartitions[i] ?? []).length > 0 ? this.tourRepartitions[i] : undefined;
      for (let d = 0; d < repeat; d++) {
        const dt = new Date(base);
        dt.setDate(dt.getDate() + d);
        tourTypesPayload.push({
          tourTypeId:       c.get('tourTypeId')?.value as string,
          numberOfAdults:   +(c.get('numberOfAdults')?.value)   || 0,
          numberOfChildren: +(c.get('numberOfChildren')?.value) || 0,
          activityDate:     dt.toISOString().split('T')[0],
          repartitions:     reps,
        });
      }
    });

    const extrasPayload = this.extraItems.map(item => ({
      extraId:      item.extraId,
      quantity:     item.quantity,
      activityDate: item.activityDate || undefined,
    }));

    const participantsPayload: ParticipantRequest[] = this.hasParticipants()
      ? this.participants.filter(p => p.fullName.trim() !== '')
      : [];

    const request: ReservationRequest = {
      userId:           fv.userId,
      sourceId:         fv.sourceId,
      reservationType:  'HEBERGEMENT',
      checkInDate:      this.checkInDate,
      checkOutDate:     this.checkOutDate,
      numberOfAdults:   this.globalAdults,
      numberOfChildren: this.globalChildren,
      groupLeaderName:  fv.groupLeaderName || undefined,
      groupName:        fv.groupName       || undefined,
      demandeSpecial:   fv.demandeSpecial  || undefined,
      promoCode:        this.appliedPromo  || undefined,
      tourTypes:        tourTypesPayload,
      extras:           extrasPayload.length > 0 ? extrasPayload : undefined,
      participants:     participantsPayload.length > 0 ? participantsPayload : undefined,
      initialPayment:   this.initialPayment ?? undefined,
    };

    this.reservationService.createReservation(request).subscribe({
      next: () => { this.isSubmitting = false; this.router.navigate(['/reservations']); },
      error: err => {
        console.error(err);
        this.isSubmitting = false;
        const status = err?.status;
        if (status === 400) {
          const detail = err?.error?.message || err?.error?.error;
          this.submitError = detail
            ? `⚠️ ${detail}`
            : '⚠️ Données invalides — vérifiez que les dates des extras sont comprises entre l\'arrivée et le départ.';
        } else if (status === 409) {
          this.submitError = '⚠️ Conflit — une réservation similaire existe déjà pour ces dates.';
        } else if (!status || status >= 500) {
          this.submitError = '⚠️ Erreur serveur — veuillez réessayer dans quelques instants.';
        } else {
          this.submitError = `⚠️ Une erreur est survenue (code ${status}). Veuillez réessayer.`;
        }
      }
    });
  }

  // ─── Date utilities ────────────────────────────────────────────

  openPicker(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = (event.target as HTMLElement).closest('.date-wrapper');
    const picker  = wrapper?.querySelector('.date-picker') as HTMLInputElement;
    if (picker) {
      picker.style.pointerEvents = 'auto';
      const today = new Date().toISOString().split('T')[0];
      picker.min = today;
      picker.showPicker?.();
      setTimeout(() => { picker.style.pointerEvents = 'none'; }, 500);
    }
  }

  toDisplayDate(val: string): string {
    if (!val || !val.includes('-')) return val;
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }

  // ─── Participants ──────────────────────────────────────────────

  initParticipants(): void {
    const a = this.globalAdults;
    const c = this.globalChildren;
    this.participants = [
      ...Array(a).fill(null).map(() => ({ fullName: '', age: 18, isAdult: true })),
      ...Array(c).fill(null).map(() => ({ fullName: '', age: 8,  isAdult: false }))
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

  // ─── Payment ───────────────────────────────────────────────────

  openPaymentModal(): void  { this.showPaymentModal = true; }
  closePaymentModal(): void { this.showPaymentModal = false; }

  onPaymentConfirmed(payment: PaymentRequest): void {
    this.initialPayment = payment;
    this.showPaymentModal = false;
  }

  removeInitialPayment(): void { this.initialPayment = null; }

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: 'Espèces', CREDIT_CARD: 'Carte de crédit',
      DEBIT_CARD: 'Carte de débit', BANK_TRANSFER: 'Virement bancaire',
      ONLINE: 'En ligne', CHEQUE: 'Chèque',
    };
    return labels[method] ?? method;
  }

  getSelectedSourceName(): string {
    const id = this.form.get('sourceId')?.value;
    return this.sources.find(s => s.sourceId === id)?.name ?? '';
  }

  max(a: number, b: number): number { return Math.max(a, b); }
}
