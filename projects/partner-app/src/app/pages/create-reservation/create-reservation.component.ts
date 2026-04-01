import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../../../../shared/src/services/reservation.service';
import { StepperComponent } from '../../shared/components/stepper/stepper.component';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { IMAGES } from '../../../../../shared/src/models/constants/images';
import { TourType } from '../../../../../shared/src/models/tour-type.model';
import { ExtraResponse } from '../../../../../shared/src/models/extra.model';
import { ReservationRequest, ReservationResponse } from '../../../../../shared/src/models/reservation-api.model';
import { ToastService } from '../../../../../shared/src/lib/auth/toast.service';
import { AuthService } from '../../../../../shared/src/public-api';
@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, StepperComponent, GlassCardComponent],
  templateUrl: './create-reservation.component.html',
  styleUrls: ['./create-reservation.component.scss'],
  animations: [
    trigger('stepAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('0.35s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ position: 'absolute', width: '100%', opacity: 1 }),
        animate('0.2s ease-in', style({ opacity: 0, transform: 'translateY(-12px)' }))
      ])
    ])
  ]
})
export class CreateReservationComponent implements OnInit {
  reservationForm: FormGroup;
  isSubmitting = false;
  currentStep = 0;

  availableExtras: ExtraResponse[] = [];
  selectedExtras: Record<string, number> = {};
  tourTypes: TourType[] = [];
  isLoadingTourTypes = false;
  editMode = false;
  editReservationId: string | null = null;

  steps = [
    { label: 'Expérience' },
    { label: 'Dates & Options' },
    { label: 'Voyageurs' },
    { label: 'Confirmer' }
  ];

  appliedPromoCode = '';
  discountAmount = 0;
  promoApplied = false;
  promoError = false;
  promoMessage = '';

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.reservationForm = this.createForm();
  }

  ngOnInit(): void {
      this.loadTourTypes();
      this.loadExtras();
      this.addParticipant();

      // ── Edit mode: read reservation from router state ──
      const state = history.state;
      if (state?.editMode && state?.reservation) {
          this.editMode = true;
          this.editReservationId = state.reservation.reservationId;
          // prefill is called after tourTypes load (inside loadTourTypes)
      }
  }

  // ─── Loaders ──────────────────────────────────────────────

  private loadTourTypes(): void {
      this.isLoadingTourTypes = true;
      this.reservationService.getAllTourTypes().subscribe({
          next: (data) => {
              this.tourTypes = data;
              this.isLoadingTourTypes = false;
              this.handleQueryParams();

              // ── Prefill form if in edit mode ──
              const state = history.state;
              if (state?.editMode && state?.reservation) {
                  this.prefillForm(state.reservation);
              }
          },
          error: (err) => {
              console.error('Failed to load tour types', err);
              this.isLoadingTourTypes = false;
          }
      });
  }
  private prefillForm(res: ReservationResponse): void {
      // ── Simple fields ──
      this.reservationForm.patchValue({
          groupLeaderName: res.groupLeaderName || '',
          groupName:       res.groupName || '',
          checkInDate:     res.checkInDate,
          checkOutDate:    res.checkOutDate,
          adults:          res.numberOfAdults || 2,
          children:        res.numberOfChildren || 0,
          specialRequests: res.demandeSpecial || '',
          promoCode:       res.promoCode || ''
      });

      // ── Tour types ──
      // Clear the array first then rebuild from the saved snapshot
      while (this.tourTypesArray.length > 0) this.tourTypesArray.removeAt(0);
      (res.tourTypes || []).forEach(t => {
          // find the real tourTypeId from catalog by matching name
          const found = this.tourTypes.find(tt => tt.name === t.name);
          if (found) {
              this.tourTypesArray.push(this.fb.group({
                  tourTypeId:      [found.tourTypeId],
                  numberOfAdults:  [t.numberOfAdults || 0],
                  numberOfChildren:[t.numberOfChildren || 0]
              }));
          }
      });

      // ── Extras ──
      (res.extras || []).forEach(e => {
          // find the real extraId from catalog by matching name
          const found = this.availableExtras.find(ae => ae.name === e.name);
          if (found) {
              this.selectedExtras[found.extraId] = e.quantity || 1;
          }
      });

      // ── Participants ──
      while (this.participants.length > 0) this.participants.removeAt(0);
      if (res.participants && res.participants.length > 0) {
          res.participants.forEach(p => {
              this.participants.push(this.fb.group({
                  fullName: [p.fullName],
                  age:      [p.age],
                  isAdult:  [p.isAdult]
              }));
          });
      } else {
          this.addParticipant(); // add at least one empty row
      }
  }

  private handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tour']) {
        const found = this.tourTypes.find(t => t.tourTypeId === params['tour']);
        if (found) this.toggleTourType(params['tour']);
      }
    });
  }

  private loadExtras(): void {
    this.reservationService.getActiveExtras().subscribe({
      next: (extras) => {
        this.availableExtras = extras;
        extras.forEach(e => this.selectedExtras[e.extraId] = 0);
      },
      error: (err) => console.error('Failed to load extras', err)
    });
  }

  // ─── Form ─────────────────────────────────────────────────

  createForm(): FormGroup {
    return this.fb.group({
      groupLeaderName: ['', Validators.required],
      groupName: [''],
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      adults: [2, [Validators.required, Validators.min(1)]],
      children: [0, Validators.min(0)],
      tourTypes: this.fb.array([], Validators.required),
      specialRequests: [''],
      promoCode: [''],
      participants: this.fb.array([])
    });
  }

  // ─── FormArray Getters ─────────────────────────────────────

  get tourTypesArray(): FormArray {
    return this.reservationForm.get('tourTypes') as FormArray;
  }

  get participants(): FormArray {
    return this.reservationForm.get('participants') as FormArray;
  }

  // ─── Tour Type selection ───────────────────────────────────

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
        tourTypeId: [tourTypeId],
        numberOfAdults: [0],
        numberOfChildren: [0]
      }));
    }
  }

  getTourFormGroup(tourTypeId: string): FormGroup | null {
    const ctrl = this.tourTypesArray.controls.find(
      c => c.get('tourTypeId')?.value === tourTypeId
    );
    return ctrl ? (ctrl as FormGroup) : null;
  }

  // ── Counter buttons for per-tour allocation ──
  incrementAlloc(tourTypeId: string, field: 'numberOfAdults' | 'numberOfChildren'): void {
    const fg = this.getTourFormGroup(tourTypeId);
    if (!fg) return;
    const max = field === 'numberOfAdults' ? this.getCount('adults') : this.getCount('children');
    const current = fg.get(field)?.value || 0;
    if (current < max) fg.get(field)?.setValue(current + 1);
  }

  decrementAlloc(tourTypeId: string, field: 'numberOfAdults' | 'numberOfChildren'): void {
    const fg = this.getTourFormGroup(tourTypeId);
    if (!fg) return;
    const current = fg.get(field)?.value || 0;
    if (current > 0) fg.get(field)?.setValue(current - 1);
  }

  // ── Allocation validation ──
  getTourAllocationMessage(): string {
    if (this.tourTypesArray.length <= 1) return '';

    const totalAdults = this.getCount('adults');
    const totalChildren = this.getCount('children');

    const assignedAdults = this.tourTypesArray.controls.reduce(
      (sum, c) => sum + (c.get('numberOfAdults')?.value || 0), 0);
    const assignedChildren = this.tourTypesArray.controls.reduce(
      (sum, c) => sum + (c.get('numberOfChildren')?.value || 0), 0);

    const messages: string[] = [];
    if (assignedAdults < totalAdults) messages.push(`${totalAdults - assignedAdults} adulte(s) non assigné(s)`);
    if (assignedChildren < totalChildren) messages.push(`${totalChildren - assignedChildren} enfant(s) non assigné(s)`);
    if (assignedAdults > totalAdults) messages.push(`Trop d'adultes assignés (+${assignedAdults - totalAdults})`);
    if (assignedChildren > totalChildren) messages.push(`Trop d'enfants assignés (+${assignedChildren - totalChildren})`);

    return messages.join(' · ');
  }

  isAllocationValid(): boolean {
    if (this.tourTypesArray.length <= 1) return true;

    const totalAdults = this.getCount('adults');
    const totalChildren = this.getCount('children');

    const assignedAdults = this.tourTypesArray.controls.reduce(
      (sum, c) => sum + (c.get('numberOfAdults')?.value || 0), 0);
    const assignedChildren = this.tourTypesArray.controls.reduce(
      (sum, c) => sum + (c.get('numberOfChildren')?.value || 0), 0);

    return assignedAdults === totalAdults && assignedChildren === totalChildren;
  }

  // ─── Tour helpers ──────────────────────────────────────────

  getTourLabel(): string {
    if (this.tourTypesArray.length === 0) return 'Choisissez un tour';
    if (this.tourTypesArray.length === 1) {
      const id = this.tourTypesArray.at(0).get('tourTypeId')?.value;
      return this.tourTypes.find(t => t.tourTypeId === id)?.name || 'Tour';
    }
    return `${this.tourTypesArray.length} Tours combinés`;
  }

  getTourImage(): string {
    if (this.tourTypesArray.length === 0) return IMAGES.BIVOUAC_SAFARI;
    const id = this.tourTypesArray.at(0).get('tourTypeId')?.value;
    return this.tourTypes.find(t => t.tourTypeId === id)?.image || IMAGES.BIVOUAC_SAFARI;
  }

  getTourNameById(id: string): string {
    return this.tourTypes.find(t => t.tourTypeId === id)?.name || '';
  }

  // ─── Extras ────────────────────────────────────────────────

  toggleExtra(extraId: string): void {
    this.selectedExtras[extraId] = this.selectedExtras[extraId] > 0 ? 0 : 1;
  }

  // ++ / -- buttons for extra quantity (NEW — replaces raw number input)
  adjustExtraQty(extraId: string, delta: number): void {
    const current = this.selectedExtras[extraId] || 0;
    const max = this.getCount('adults') + this.getCount('children');
    const next = current + delta;
    if (next >= 1 && next <= max) {
      this.selectedExtras[extraId] = next;
    }
  }

  setExtraForAll(extraId: string, event: Event): void {
    event.stopPropagation();
    this.selectedExtras[extraId] = this.getCount('adults') + this.getCount('children');
  }

  // kept for backward compat — not used in new UI but safe to keep
  updateExtraQuantity(extraId: string, value: string, event: Event): void {
    event.stopPropagation();
    const qty = parseInt(value, 10);
    const max = this.getCount('adults') + this.getCount('children');
    if (!isNaN(qty) && qty >= 0) this.selectedExtras[extraId] = Math.min(qty, max);
  }

  isExtraSelected(extraId: string): boolean { return (this.selectedExtras[extraId] || 0) > 0; }
  getExtraQuantity(extraId: string): number { return this.selectedExtras[extraId] || 0; }
  hasExtras(): boolean { return Object.values(this.selectedExtras).some(qty => qty > 0); }

  calculateExtrasPrice(): number {
    return this.availableExtras.reduce((total, e) =>
      total + ((this.selectedExtras[e.extraId] || 0) * e.unitPrice), 0);
  }

  getSelectedExtrasList(): { name: string; qty: number; subtotal: number }[] {
    return this.availableExtras
      .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
      .map(e => ({
        name: e.name,
        qty: this.selectedExtras[e.extraId],
        subtotal: this.selectedExtras[e.extraId] * e.unitPrice
      }));
  }

  // ─── Participants ──────────────────────────────────────────

  addParticipant(): void {
    this.participants.push(this.fb.group({
      fullName: [''],
      age: [18],
      isAdult: [true]
    }));
  }

  removeParticipant(index: number): void {
    if (this.participants.length > 1) this.participants.removeAt(index);
  }

  // ─── Counters & Dates ──────────────────────────────────────

  getCount(field: 'adults' | 'children'): number {
    return this.reservationForm.get(field)?.value || 0;
  }

  updateCount(field: 'adults' | 'children', delta: number): void {
    const newValue = Math.max(field === 'adults' ? 1 : 0, this.getCount(field) + delta);
    this.reservationForm.get(field)?.setValue(newValue);
  }

  getNights(): number {
    const checkIn = this.reservationForm.get('checkInDate')?.value;
    const checkOut = this.reservationForm.get('checkOutDate')?.value;
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ));
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // ─── Pricing ───────────────────────────────────────────────

  getSelectedTourAdultPrice(): number {
    return this.tourTypesArray.controls.reduce((total, ctrl) => {
      const id = ctrl.get('tourTypeId')?.value;
      const tour = this.tourTypes.find(t => t.tourTypeId === id);
      return total + (tour?.partnerAdultPrice || 0);
    }, 0);
  }

  getSelectedTourChildPrice(): number {
    return this.tourTypesArray.controls.reduce((total, ctrl) => {
      const id = ctrl.get('tourTypeId')?.value;
      const tour = this.tourTypes.find(t => t.tourTypeId === id);
      return total + (tour?.partnerChildPrice || 0);
    }, 0);
  }

  calculateAdultPrice(): number {
    const nights = Math.max(1, this.getNights());
    return this.tourTypesArray.controls.reduce((total, ctrl) => {
      const id = ctrl.get('tourTypeId')?.value;
      const tour = this.tourTypes.find(t => t.tourTypeId === id);
      if (!tour) return total;
      // single tour → use global count; multiple tours → use per-tour count
      const adults = this.tourTypesArray.length === 1
        ? this.getCount('adults')
        : (ctrl.get('numberOfAdults')?.value || 0);
      return total + (adults * tour.partnerAdultPrice * nights);
    }, 0);
  }

  calculateChildPrice(): number {
    const nights = Math.max(1, this.getNights());
    return this.tourTypesArray.controls.reduce((total, ctrl) => {
      const id = ctrl.get('tourTypeId')?.value;
      const tour = this.tourTypes.find(t => t.tourTypeId === id);
      if (!tour) return total;
      const children = this.tourTypesArray.length === 1
        ? this.getCount('children')
        : (ctrl.get('numberOfChildren')?.value || 0);
      return total + (children * tour.partnerChildPrice * nights);
    }, 0);
  }

  calculateBasePrice(): number {
    return this.calculateAdultPrice() + this.calculateChildPrice() + this.calculateExtrasPrice();
  }

  calculateFinalPrice(): number {
    return Math.max(0, this.calculateBasePrice() - this.discountAmount);
  }
  // Helper: get TourType object by id
  getTourById(id: string): TourType | undefined {
    return this.tourTypes.find(t => t.tourTypeId === id);
  }

  // Helper: adult subtotal for one tour control (used in template)
  calcTourAdultLine(ctrl: any): number {
    const id = ctrl.get('tourTypeId')?.value;
    const tour = this.tourTypes.find(t => t.tourTypeId === id);
    if (!tour) return 0;
    const adults = this.tourTypesArray.length === 1
      ? this.getCount('adults')
      : (ctrl.get('numberOfAdults')?.value || 0);
    return adults * tour.partnerAdultPrice * Math.max(1, this.getNights());
  }

  // Helper: child subtotal for one tour control (used in template)
  calcTourChildLine(ctrl: any): number {
    const id = ctrl.get('tourTypeId')?.value;
    const tour = this.tourTypes.find(t => t.tourTypeId === id);
    if (!tour) return 0;
    const children = this.tourTypesArray.length === 1
      ? this.getCount('children')
      : (ctrl.get('numberOfChildren')?.value || 0);
    return children * tour.partnerChildPrice * Math.max(1, this.getNights());
  }

  // ─── Promo ─────────────────────────────────────────────────

  applyPromoCode(): void {
    const code = this.reservationForm.get('promoCode')?.value?.toUpperCase();
    if (!code) {
      this.promoApplied = false; this.discountAmount = 0; this.promoMessage = ''; return;
    }
    if (code === 'SAHARA10') {
      this.discountAmount = this.calculateBasePrice() * 0.10;
      this.appliedPromoCode = 'SAHARA10';
      this.promoApplied = true; this.promoError = false;
      this.promoMessage = '✅ Code valide — 10% de réduction appliqué';
    } else {
      this.discountAmount = 0; this.appliedPromoCode = '';
      this.promoApplied = false; this.promoError = true;
      this.promoMessage = '❌ Code promo invalide ou expiré';
    }
  }

  // ─── Navigation ────────────────────────────────────────────

  canProceed(): boolean {
    if (this.currentStep === 0) {
      return this.getCount('adults') >= 1
        && this.tourTypesArray.length > 0
        && this.isAllocationValid();
    }
    if (this.currentStep === 1) {
      return !!this.reservationForm.get('checkInDate')?.value
        && !!this.reservationForm.get('checkOutDate')?.value
        && this.getNights() > 0;
    }
    if (this.currentStep === 2) {
      return !!this.reservationForm.get('groupLeaderName')?.value?.trim();
    }
    return true;
  }

  nextStep(): void { if (this.currentStep < 3 && this.canProceed()) this.currentStep++; }
  previousStep(): void { if (this.currentStep > 0) this.currentStep--; }

  // ─── Submit ────────────────────────────────────────────────

  onSubmit(): void {
      if (this.reservationForm.invalid) {
          this.toastService.showError('Veuillez remplir tous les champs requis');
          return;
      }

      this.isSubmitting = true;
      const formValue = this.reservationForm.value;

      const participants = (formValue.participants || [])
          .filter((p: any) => p.fullName?.trim())
          .map((p: any) => ({
              fullName: p.fullName.trim(),
              age:      p.age ?? 18,
              isAdult:  p.isAdult ?? true
          }));

      const extras = this.availableExtras
          .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
          .map(e => ({ extraId: e.extraId, quantity: this.selectedExtras[e.extraId] }));

      const tourTypes = this.tourTypesArray.controls.map(ctrl => ({
          tourTypeId:      ctrl.get('tourTypeId')?.value,
          numberOfAdults:  ctrl.get('numberOfAdults')?.value ?? formValue.adults,
          numberOfChildren:ctrl.get('numberOfChildren')?.value ?? formValue.children
      }));

      // ── EDIT MODE → PUT ──────────────────────────────────────
      if (this.editMode && this.editReservationId) {
          const updateRequest = {
              checkInDate:      formValue.checkInDate,
              checkOutDate:     formValue.checkOutDate,
              groupName:        formValue.groupName || formValue.groupLeaderName,
              groupLeaderName:  formValue.groupLeaderName,
              numberOfAdults:   formValue.adults,
              numberOfChildren: formValue.children,
              demandeSpecial:   formValue.specialRequests || undefined,
              promoCode:        this.appliedPromoCode || undefined,
              currency:         'TND',
              tourTypes,
              participants:     participants.length > 0 ? participants : undefined,
              extras:           extras.length > 0 ? extras : undefined
          };

          this.reservationService.updateReservation(this.editReservationId, updateRequest).subscribe({
              next: () => {
                  this.toastService.showSuccess('✅ Réservation mise à jour avec succès !');
                  setTimeout(() => this.router.navigate(['/historique']), 1500);
              },
              error: (err) => {
                  const msg = err?.error?.message || 'Erreur lors de la mise à jour';
                  this.toastService.showError(msg);
                  this.isSubmitting = false;
              }
          });
          return;
      }

      // ── CREATE MODE → POST ───────────────────────────────────
      const userId = JSON.parse(localStorage.getItem('auth_user') || '{}')?.userId ?? undefined;
      const request: ReservationRequest = {
          userId,
          source:           'PARTNER_APP',
          checkInDate:      formValue.checkInDate,
          checkOutDate:     formValue.checkOutDate,
          groupLeaderName:  formValue.groupLeaderName,
          demandeSpecial:   formValue.specialRequests || undefined,
          groupName:        formValue.groupName || formValue.groupLeaderName,
          numberOfAdults:   formValue.adults,
          numberOfChildren: formValue.children,
          currency:         'TND',
          promoCode:        this.appliedPromoCode || undefined,
          tourTypes,
          participants:     participants.length > 0 ? participants : undefined,
          extras:           extras.length > 0 ? extras : undefined
      };

      this.reservationService.createReservation(request).subscribe({
          next: () => {
              this.toastService.showSuccess('✅ Réservation créée avec succès !');
              setTimeout(() => this.router.navigate(['/']), 1500);
          },
          error: (err) => {
              const msg = err?.error?.message || err?.error?.error || 'Erreur lors de la création';
              this.toastService.showError(msg);
              this.isSubmitting = false;
          }
      });
  }
}