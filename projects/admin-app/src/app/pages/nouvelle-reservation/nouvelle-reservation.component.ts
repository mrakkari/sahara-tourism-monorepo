import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { NewClientDialogComponent } from '../../components/new-client-dialog/new-client-dialog.component';
import { ReservationService } from '../../../../../shared/src/services/reservation.service';
import { UserResponse } from '../../../../../shared/src/models/user.model';

// ── Interfaces (inline until shared models are wired up) ──────────────────────

export interface TourTypeSelectionRequest {
  tourTypeId: string;
  numberOfAdults: number;
  numberOfChildren: number;
}

export interface ParticipantRequest {
  fullName: string;
  age: number;
  isAdult: boolean;
}

export interface ReservationExtraRequest {
  extraId: string;
  quantity: number;
}

export interface ReservationRequest {
  userId?: string;
  source?: string;            // always 'ADMIN-APP' from this component
  checkInDate: string;
  checkOutDate: string;
  groupName?: string;
  groupLeaderName?: string;
  demandeSpecial?: string;
  numberOfAdults: number;
  numberOfChildren: number;
  currency?: string;
  promoCode?: string;
  tourTypes: TourTypeSelectionRequest[];
  participants?: ParticipantRequest[];
  extras?: ReservationExtraRequest[];
}

// ── Placeholder models — replace with real shared imports once services wired ─
export interface TourType {
  tourTypeId: string;
  name: string;
  description?: string;
  image?: string;
  partnerAdultPrice: number;
  partnerChildPrice: number;
}

export interface ExtraResponse {
  extraId: string;
  name: string;
  description?: string;
  duration?: string;
  unitPrice: number;
}

@Component({
  selector: 'app-nouvelle-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './nouvelle-reservation.component.html',
  styleUrls: ['./nouvelle-reservation.component.scss'],
  animations: [
    trigger('stepAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(14px)' }),
        animate('0.3s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ position: 'absolute', width: '100%', opacity: 1 }),
        animate('0.18s ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class NouvelleReservationComponent implements OnInit {

  reservationForm!: FormGroup;
  isSubmitting = false;
  currentStep = 0;   // 0 = Réservation  |  1 = Voyageurs & Confirmation

  // ── Data ─────────────────────────────────────────────────────────────────
  partenaireClients: UserResponse[] = [];
  tourTypes: TourType[] = [];
  availableExtras: ExtraResponse[] = [];
  selectedExtras: Record<string, number> = {};
  isLoadingTourTypes = false;
  isLoadingExtras = false;

  steps = [
    { label: 'Réservation' },
    { label: 'Voyageurs & Confirmation' },
  ];

  // ── Promo ─────────────────────────────────────────────────────────────────
  appliedPromoCode = '';
  discountAmount = 0;
  promoApplied = false;
  promoError = false;
  promoMessage = '';

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadPartenaireClients();
    this.loadTourTypes();
    this.loadExtras();
    this.addParticipant();
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  private buildForm(): void {
    this.reservationForm = this.fb.group({
      // ── Step 0 ──
      clientId:        ['', Validators.required],
      checkInDate:     ['', Validators.required],
      checkOutDate:    ['', Validators.required],
      adults:          [2, [Validators.required, Validators.min(1)]],
      children:        [0, Validators.min(0)],
      tourTypes:       this.fb.array([], Validators.required),
      paiement:        [''],     // admin-only, not required
      montant:         [null],   // admin-only, not required
      // ── Step 1 ──
      groupLeaderName: ['', Validators.required],
      groupName:       [''],
      specialRequests: [''],
      promoCode:       [''],
      participants:    this.fb.array([]),
    });
  }

  // ─── FormArray getters ────────────────────────────────────────────────────

  get tourTypesArray(): FormArray {
    return this.reservationForm.get('tourTypes') as FormArray;
  }

  get participants(): FormArray {
    return this.reservationForm.get('participants') as FormArray;
  }

  // ─── Loaders — TODO: replace stubs with real service calls ───────────────

  loadPartenaireClients(): void {
    this.reservationService.getClientsAndPartenaires().subscribe({
      next: (users) => (this.partenaireClients = users),
      error: (err) => console.error('Failed to load clients/partenaires', err),
    });
  }

  loadTourTypes(): void {
    this.isLoadingTourTypes = true;
    this.reservationService.getAllTourTypes().subscribe({
      next: (data) => {
        this.tourTypes = data;
        this.isLoadingTourTypes = false;
      },
      error: (err) => {
        console.error('Failed to load tour types', err);
        this.isLoadingTourTypes = false;
      }
    });
  }

  loadExtras(): void {
    this.isLoadingExtras = true;
    this.reservationService.getActiveExtras().subscribe({
      next: (extras) => {
        this.availableExtras = extras;
        // initialise every extra quantity to 0
        extras.forEach(e => this.selectedExtras[e.extraId] = 0);
        this.isLoadingExtras = false;
      },
      error: (err) => {
        console.error('Failed to load extras', err);
        this.isLoadingExtras = false;
      }
    });
  }

  // ─── Client dialog ────────────────────────────────────────────────────────

  openNewClientDialog(): void {
    const dialogRef = this.dialog.open(NewClientDialogComponent, {
      width: '600px',
      disableClose: false,
    });
    // NewClientDialogComponent returns the newly created user — adjust the
    // cast type once the dialog is also migrated to return UserResponse.
    // For now we cast to any so both old (Client) and new (UserResponse) shapes work.
    dialogRef.afterClosed().subscribe((newClient: any | undefined) => {
      if (newClient) {
        this.loadPartenaireClients();
        // Support both old Client shape (id/nom) and new UserResponse shape (userId/name)
        const id   = newClient.userId ?? newClient.id;
        const name = newClient.name   ?? newClient.nom;
        this.reservationForm.patchValue({ clientId: id });
        this.snackBar.open(`Client "${name}" ajouté et sélectionné!`, 'Fermer', {
          duration: 3000, horizontalPosition: 'end', verticalPosition: 'top',
        });
      }
    });
  }

  getSelectedClientName(): string {
    const id = this.reservationForm.get('clientId')?.value;
    return this.partenaireClients.find(c => c.userId === id)?.name || '';
  }

  // ─── Tour type helpers ────────────────────────────────────────────────────

  isTourSelected(tourTypeId: string): boolean {
    return this.tourTypesArray.controls.some(c => c.get('tourTypeId')?.value === tourTypeId);
  }

  toggleTourType(tourTypeId: string): void {
    const index = this.tourTypesArray.controls.findIndex(
      c => c.get('tourTypeId')?.value === tourTypeId
    );
    if (index >= 0) {
      this.tourTypesArray.removeAt(index);
    } else {
      this.tourTypesArray.push(this.fb.group({
        tourTypeId:       [tourTypeId],
        numberOfAdults:   [0],
        numberOfChildren: [0],
      }));
    }
  }

  getTourFormGroup(tourTypeId: string): FormGroup | null {
    const ctrl = this.tourTypesArray.controls.find(
      c => c.get('tourTypeId')?.value === tourTypeId
    );
    return ctrl ? (ctrl as FormGroup) : null;
  }

  getTourNameById(id: string): string {
    return this.tourTypes.find(t => t.tourTypeId === id)?.name || '';
  }

  getTourById(id: string): TourType | undefined {
    return this.tourTypes.find(t => t.tourTypeId === id);
  }

  incrementAlloc(tourTypeId: string, field: 'numberOfAdults' | 'numberOfChildren'): void {
    const fg = this.getTourFormGroup(tourTypeId);
    if (!fg) return;
    const max = field === 'numberOfAdults' ? this.getCount('adults') : this.getCount('children');
    const val = fg.get(field)?.value || 0;
    if (val < max) fg.get(field)?.setValue(val + 1);
  }

  decrementAlloc(tourTypeId: string, field: 'numberOfAdults' | 'numberOfChildren'): void {
    const fg = this.getTourFormGroup(tourTypeId);
    if (!fg) return;
    const val = fg.get(field)?.value || 0;
    if (val > 0) fg.get(field)?.setValue(val - 1);
  }

  isAllocationValid(): boolean {
    if (this.tourTypesArray.length <= 1) return true;
    const assignedA = this.tourTypesArray.controls.reduce((s, c) => s + (c.get('numberOfAdults')?.value   || 0), 0);
    const assignedC = this.tourTypesArray.controls.reduce((s, c) => s + (c.get('numberOfChildren')?.value || 0), 0);
    return assignedA === this.getCount('adults') && assignedC === this.getCount('children');
  }

  getTourAllocationMessage(): string {
    if (this.tourTypesArray.length <= 1) return '';
    const diffA = this.getCount('adults')   - this.tourTypesArray.controls.reduce((s, c) => s + (c.get('numberOfAdults')?.value   || 0), 0);
    const diffC = this.getCount('children') - this.tourTypesArray.controls.reduce((s, c) => s + (c.get('numberOfChildren')?.value || 0), 0);
    const msgs: string[] = [];
    if (diffA > 0) msgs.push(`${diffA} adulte(s) non assigné(s)`);
    if (diffA < 0) msgs.push(`Trop d'adultes assignés (+${-diffA})`);
    if (diffC > 0) msgs.push(`${diffC} enfant(s) non assigné(s)`);
    if (diffC < 0) msgs.push(`Trop d'enfants assignés (+${-diffC})`);
    return msgs.join(' · ');
  }

  // ─── Extras ───────────────────────────────────────────────────────────────

  toggleExtra(extraId: string): void {
    this.selectedExtras[extraId] = this.selectedExtras[extraId] > 0 ? 0 : 1;
  }

  adjustExtraQty(extraId: string, delta: number): void {
    const current = this.selectedExtras[extraId] || 0;
    const max = this.getCount('adults') + this.getCount('children');
    const next = current + delta;
    if (next >= 1 && next <= max) this.selectedExtras[extraId] = next;
  }

  setExtraForAll(extraId: string, event: Event): void {
    event.stopPropagation();
    this.selectedExtras[extraId] = this.getCount('adults') + this.getCount('children');
  }

  isExtraSelected(extraId: string): boolean { return (this.selectedExtras[extraId] || 0) > 0; }
  getExtraQuantity(extraId: string): number  { return this.selectedExtras[extraId] || 0; }
  hasExtras(): boolean { return Object.values(this.selectedExtras).some(q => q > 0); }

  calculateExtrasPrice(): number {
    return this.availableExtras.reduce(
      (t, e) => t + ((this.selectedExtras[e.extraId] || 0) * e.unitPrice), 0
    );
  }

  getSelectedExtrasList(): { name: string; qty: number; subtotal: number }[] {
    return this.availableExtras
      .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
      .map(e => ({ name: e.name, qty: this.selectedExtras[e.extraId], subtotal: this.selectedExtras[e.extraId] * e.unitPrice }));
  }

  // ─── Participants ─────────────────────────────────────────────────────────

  addParticipant(): void {
    this.participants.push(this.fb.group({ fullName: [''], age: [18], isAdult: [true] }));
  }

  removeParticipant(index: number): void {
    if (this.participants.length > 1) this.participants.removeAt(index);
  }

  // ─── Counters & dates ─────────────────────────────────────────────────────

  getCount(field: 'adults' | 'children'): number {
    return this.reservationForm.get(field)?.value || 0;
  }

  updateCount(field: 'adults' | 'children', delta: number): void {
    const min = field === 'adults' ? 1 : 0;
    this.reservationForm.get(field)?.setValue(Math.max(min, this.getCount(field) + delta));
  }

  getNights(): number {
    const ci = this.reservationForm.get('checkInDate')?.value;
    const co = this.reservationForm.get('checkOutDate')?.value;
    if (!ci || !co) return 0;
    return Math.max(0, Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000));
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // ─── Pricing ──────────────────────────────────────────────────────────────

  calculateAdultPrice(): number {
    const nights = Math.max(1, this.getNights());
    return this.tourTypesArray.controls.reduce((total, ctrl) => {
      const tour = this.getTourById(ctrl.get('tourTypeId')?.value);
      if (!tour) return total;
      const adults = this.tourTypesArray.length === 1 ? this.getCount('adults') : (ctrl.get('numberOfAdults')?.value || 0);
      return total + adults * tour.partnerAdultPrice * nights;
    }, 0);
  }

  calculateChildPrice(): number {
    const nights = Math.max(1, this.getNights());
    return this.tourTypesArray.controls.reduce((total, ctrl) => {
      const tour = this.getTourById(ctrl.get('tourTypeId')?.value);
      if (!tour) return total;
      const children = this.tourTypesArray.length === 1 ? this.getCount('children') : (ctrl.get('numberOfChildren')?.value || 0);
      return total + children * tour.partnerChildPrice * nights;
    }, 0);
  }

  calculateBasePrice(): number {
    return this.calculateAdultPrice() + this.calculateChildPrice() + this.calculateExtrasPrice();
  }

  calculateFinalPrice(): number {
    return Math.max(0, this.calculateBasePrice() - this.discountAmount);
  }

  calcTourAdultLine(ctrl: any): number {
    const tour = this.getTourById(ctrl.get('tourTypeId')?.value);
    if (!tour) return 0;
    const adults = this.tourTypesArray.length === 1 ? this.getCount('adults') : (ctrl.get('numberOfAdults')?.value || 0);
    return adults * tour.partnerAdultPrice * Math.max(1, this.getNights());
  }

  calcTourChildLine(ctrl: any): number {
    const tour = this.getTourById(ctrl.get('tourTypeId')?.value);
    if (!tour) return 0;
    const children = this.tourTypesArray.length === 1 ? this.getCount('children') : (ctrl.get('numberOfChildren')?.value || 0);
    return children * tour.partnerChildPrice * Math.max(1, this.getNights());
  }

  // ─── Promo ────────────────────────────────────────────────────────────────

  applyPromoCode(): void {
    const code = this.reservationForm.get('promoCode')?.value?.toUpperCase();
    if (!code) { this.promoApplied = false; this.discountAmount = 0; this.promoMessage = ''; return; }
    // TODO: replace with real API call
    if (code === 'SAHARA10') {
      this.discountAmount = this.calculateBasePrice() * 0.10;
      this.appliedPromoCode = 'SAHARA10';
      this.promoApplied = true; this.promoError = false;
      this.promoMessage = 'Code valide — 10 % de réduction appliqué';
    } else {
      this.discountAmount = 0; this.appliedPromoCode = '';
      this.promoApplied = false; this.promoError = true;
      this.promoMessage = 'Code promo invalide ou expiré';
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  canProceed(): boolean {
    if (this.currentStep === 0) {
      const f = this.reservationForm;
      return !!f.get('clientId')?.value
        && !!f.get('checkInDate')?.value
        && !!f.get('checkOutDate')?.value
        && this.getNights() > 0
        && this.getCount('adults') >= 1
        && this.tourTypesArray.length > 0
        && this.isAllocationValid();
    }
    return true;
  }

  nextStep(): void     { if (this.currentStep < 1 && this.canProceed()) this.currentStep++; }
  previousStep(): void { if (this.currentStep > 0) this.currentStep--; }

  // ─── Submit — TODO: replace stub with real service call ──────────────────

  onSubmit(): void {
    if (!this.reservationForm.get('groupLeaderName')?.value?.trim()) {
      this.snackBar.open('Le nom du responsable est requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const fv = this.reservationForm.value;

    const tourTypes: TourTypeSelectionRequest[] = this.tourTypesArray.controls.map(ctrl => ({
      tourTypeId:       ctrl.get('tourTypeId')?.value,
      numberOfAdults:   ctrl.get('numberOfAdults')?.value ?? fv.adults,
      numberOfChildren: ctrl.get('numberOfChildren')?.value ?? fv.children,
    }));

    const participants: ParticipantRequest[] = (fv.participants || [])
      .filter((p: any) => p.fullName?.trim())
      .map((p: any) => ({ fullName: p.fullName.trim(), age: p.age ?? 18, isAdult: p.isAdult ?? true }));

    const extras: ReservationExtraRequest[] = this.availableExtras
      .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
      .map(e => ({ extraId: e.extraId, quantity: this.selectedExtras[e.extraId] }));

    const request: ReservationRequest = {
      // clientId from the dropdown IS the userId sent to the backend
      userId:           fv.clientId || undefined,
      // source is hardcoded per-app — shared service uses whatever the caller passes
      source:           'ADMIN-APP',
      checkInDate:      fv.checkInDate,
      checkOutDate:     fv.checkOutDate,
      groupLeaderName:  fv.groupLeaderName,
      groupName:        fv.groupName || fv.groupLeaderName,
      // total headcount (not per-tour — per-tour allocation is inside tourTypes array)
      numberOfAdults:   fv.adults,
      numberOfChildren: fv.children,
      currency:         'TND',
      demandeSpecial:   fv.specialRequests || undefined,
      promoCode:        this.appliedPromoCode || undefined,
      tourTypes,
      participants:     participants.length > 0 ? participants : undefined,
      extras:           extras.length > 0 ? extras : undefined,
    };

    this.reservationService.createReservation(request).subscribe({
      next: () => {
        this.snackBar.open('Réservation créée avec succès!', 'Fermer', {
          duration: 3000, horizontalPosition: 'end', verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        });
        this.isSubmitting = false;
        this.router.navigate(['/reservations']);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.error || 'Erreur lors de la création';
        this.snackBar.open(msg, 'Fermer', {
          duration: 4000, horizontalPosition: 'end', verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
        this.isSubmitting = false;
      }
    });
  }
}