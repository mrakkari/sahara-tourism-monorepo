import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { StepperComponent } from '../../shared/components/stepper/stepper.component';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { IMAGES } from '../../core/constants/images';
import { TourType } from '../../models/tour.model';
import { ExtraResponse } from '../../models/extra.model';
import { ReservationRequest } from '../../models/reservation-api.model';

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, StepperComponent, GlassCardComponent],
  templateUrl: './create-reservation.component.html',
  styleUrls: ['./create-reservation.component.scss'],
  animations: [
    trigger('stepAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ position: 'absolute', width: '100%', opacity: 1 }),
        animate('0.2s ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
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
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.reservationForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadTourTypes();
    this.loadExtras();
    this.addParticipant();
  }

  // ─── Loaders ──────────────────────────────────────────────────

  private loadTourTypes(): void {
    this.isLoadingTourTypes = true;
    this.reservationService.getAllTourTypes().subscribe({
      next: (data) => {
        this.tourTypes = data;
        this.isLoadingTourTypes = false;
        this.handleQueryParams();
      },
      error: (err) => {
        console.error('Failed to load tour types', err);
        this.isLoadingTourTypes = false;
      }
    });
  }

  private handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tour']) {
        const found = this.tourTypes.find(t => t.tourTypeId === params['tour']);
        if (found) this.reservationForm.patchValue({ tourType: params['tour'] });
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

  // ─── Extras ───────────────────────────────────────────────────

  toggleExtra(extraId: string): void {
    this.selectedExtras[extraId] = this.selectedExtras[extraId] > 0 ? 0 : 1;
  }

  setExtraForAll(extraId: string, event: Event): void {
    event.stopPropagation();
    this.selectedExtras[extraId] = this.getCount('adults') + this.getCount('children');
  }

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

  // ─── Form ─────────────────────────────────────────────────────

  createForm(): FormGroup {
    return this.fb.group({
      groupLeaderName: ['', Validators.required], // "Responsable de réservation"
      groupName: [''],
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      adults: [2, [Validators.required, Validators.min(1)]],
      children: [0, Validators.min(0)],
      tourType: ['', Validators.required],
      specialRequests: [''],
      promoCode: [''],
      participants: this.fb.array([])
    });
  }

  get participants(): FormArray {
    return this.reservationForm.get('participants') as FormArray;
  }

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

  // ─── Counters & Dates ─────────────────────────────────────────

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
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  // ─── Tour helpers ─────────────────────────────────────────────

  getTourLabel(): string {
    const tour = this.tourTypes.find(t => t.tourTypeId === this.reservationForm.get('tourType')?.value);
    return tour ? tour.name : 'Tour';
  }

  getTourImage(): string {
    const tour = this.tourTypes.find(t => t.tourTypeId === this.reservationForm.get('tourType')?.value);
    return tour?.image || IMAGES.BIVOUAC_SAFARI;
  }

  getSelectedTourBasePrice(): number {
    const tour = this.tourTypes.find(t => t.tourTypeId === this.reservationForm.get('tourType')?.value);
    return tour?.partnerAdultPrice || 0;
  }

  // ─── Pricing ──────────────────────────────────────────────────

  calculateAdultPrice(): number {
    return this.getCount('adults') * this.getSelectedTourBasePrice() * Math.max(1, this.getNights());
  }

  calculateChildPrice(): number {
    const tour = this.tourTypes.find(t => t.tourTypeId === this.reservationForm.get('tourType')?.value);
    return this.getCount('children') * (tour?.partnerChildPrice || 0) * Math.max(1, this.getNights());
  }

  calculateBasePrice(): number {
    return this.calculateAdultPrice() + this.calculateChildPrice() + this.calculateExtrasPrice();
  }

  calculateFinalPrice(): number {
    return Math.max(0, this.calculateBasePrice() - this.discountAmount);
  }

  applyPromoCode(): void {
    const code = this.reservationForm.get('promoCode')?.value?.toUpperCase();
    if (!code) {
      this.promoApplied = false; this.discountAmount = 0; this.promoMessage = ''; return;
    }
    if (code === 'SAHARA10') {
      this.discountAmount = this.calculateBasePrice() * 0.10;
      this.appliedPromoCode = 'SAHARA10';
      this.promoApplied = true; this.promoError = false;
      this.promoMessage = '✅ 10% de réduction appliqué!';
    } else {
      this.discountAmount = 0; this.appliedPromoCode = '';
      this.promoApplied = false; this.promoError = true;
      this.promoMessage = '❌ Code promo invalide';
    }
  }

  // ─── Navigation ───────────────────────────────────────────────

  canProceed(): boolean {
    if (this.currentStep === 0) return this.getCount('adults') >= 1 && !!this.reservationForm.get('tourType')?.value;
    if (this.currentStep === 1) return !!this.reservationForm.get('checkInDate')?.value
      && !!this.reservationForm.get('checkOutDate')?.value && this.getNights() > 0;
    if (this.currentStep === 2) return !!this.reservationForm.get('groupLeaderName')?.value;
    return true;
  }

  nextStep(): void { if (this.currentStep < 3 && this.canProceed()) this.currentStep++; }
  previousStep(): void { if (this.currentStep > 0) this.currentStep--; }

  // ─── Submit ───────────────────────────────────────────────────

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      this.notificationService.showError('Veuillez remplir tous les champs requis');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.reservationForm.value;

    // Get current user ID from AuthService
    //const currentUser = this.authService.getCurrentUser();
   // const userId = currentUser?.userId;
      const userId = JSON.parse(localStorage.getItem('auth_user') || '{}')?.userId ?? undefined;
      console.log('Submitting reservation for user ID:', userId);
    // Filter out empty participant rows, map to backend shape
    const participants = (formValue.participants || [])
      .filter((p: any) => p.fullName?.trim())
      .map((p: any) => ({
        fullName: p.fullName.trim(),
        age: p.age ?? 18,
        isAdult: p.isAdult ?? true
      }));

    // Only include selected extras
    const extras = this.availableExtras
      .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
      .map(e => ({
        extraId: e.extraId,
        quantity: this.selectedExtras[e.extraId]
      }));

    // Build exact request body the backend expects
    const request: ReservationRequest = {
      userId,
      source: 'PARTNER_APP',
      checkInDate: formValue.checkInDate,   
      checkOutDate: formValue.checkOutDate,
      groupLeaderName: formValue.groupLeaderName,
      demandeSpecial: formValue.specialRequests || undefined,
      groupName: formValue.groupName || formValue.groupLeaderName,
      numberOfAdults: formValue.adults,
      numberOfChildren: formValue.children,
      currency: 'TND',
      promoCode: this.appliedPromoCode || undefined,
      tourTypes: [{
        tourTypeId: formValue.tourType,       // UUID of selected tour
        numberOfAdults: formValue.adults,
        numberOfChildren: formValue.children
      }],
      participants: participants.length > 0 ? participants : undefined,
      extras: extras.length > 0 ? extras : undefined
    };

    this.reservationService.createReservation(request).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('✅ Réservation créée avec succès!');
        setTimeout(() => this.router.navigate(['/']), 1500);
      },
      error: (err) => {
        console.error('Reservation creation failed:', err);
        const msg = err?.error?.message || err?.error?.error || 'Erreur lors de la création de la réservation';
        this.notificationService.showError(msg);
        this.isSubmitting = false;
      }
    });
  }
}