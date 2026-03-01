import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { NotificationService } from '../../services/notification.service';
import { StepperComponent } from '../../shared/components/stepper/stepper.component';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { IMAGES } from '../../core/constants/images';
import { TourType } from '../../models/tour.model';
import { ExtraResponse } from '../../models/reservation.model';

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    StepperComponent,
    GlassCardComponent
  ],
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
        const tourId = params['tour'];
        const selectedTour = this.tourTypes.find(t => t.tourTypeId === tourId);
        if (selectedTour) {
          this.reservationForm.patchValue({ tourType: tourId });
        }
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

  toggleExtra(extraId: string): void {
    if (this.selectedExtras[extraId] > 0) {
      this.selectedExtras[extraId] = 0;
    } else {
      this.selectedExtras[extraId] = 1;
    }
  }

  setExtraForAll(extraId: string, event: Event): void {
    event.stopPropagation();
    const total = this.getCount('adults') + this.getCount('children');
    this.selectedExtras[extraId] = total;
  }

  updateExtraQuantity(extraId: string, value: string, event: Event): void {
    event.stopPropagation();
    const qty = parseInt(value, 10);
    const max = this.getCount('adults') + this.getCount('children');
    if (!isNaN(qty) && qty >= 0) {
      this.selectedExtras[extraId] = Math.min(qty, max);
    }
  }

  isExtraSelected(extraId: string): boolean {
    return (this.selectedExtras[extraId] || 0) > 0;
  }

  getExtraQuantity(extraId: string): number {
    return this.selectedExtras[extraId] || 0;
  }

  calculateExtrasPrice(): number {
    return this.availableExtras.reduce((total, extra) => {
      const qty = this.selectedExtras[extra.extraId] || 0;
      return total + (qty * extra.unitPrice);
    }, 0);
  }

  hasExtras(): boolean {
    return Object.values(this.selectedExtras).some(qty => qty > 0);
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

  private buildSelectedExtras() {
    return this.availableExtras
      .filter(e => (this.selectedExtras[e.extraId] || 0) > 0)
      .map(e => ({
        extraId: e.extraId,
        name: e.name,
        description: e.description,
        quantity: this.selectedExtras[e.extraId],
        unitPrice: e.unitPrice,
        totalPrice: this.selectedExtras[e.extraId] * e.unitPrice
      }));
  }

  createForm(): FormGroup {
    return this.fb.group({
      partnerName: ['', Validators.required],
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
    const p = this.fb.group({ name: [''], ageGroup: ['adult'] });
    this.participants.push(p);
  }

  removeParticipant(index: number): void {
    if (this.participants.length > 1) {
      this.participants.removeAt(index);
    }
  }

  getCount(field: 'adults' | 'children'): number {
    return this.reservationForm.get(field)?.value || 0;
  }

  updateCount(field: 'adults' | 'children', delta: number): void {
    const current = this.getCount(field);
    const newValue = Math.max(field === 'adults' ? 1 : 0, current + delta);
    this.reservationForm.get(field)?.setValue(newValue);
  }

  getNights(): number {
    const checkIn = this.reservationForm.get('checkInDate')?.value;
    const checkOut = this.reservationForm.get('checkOutDate')?.value;
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getTourLabel(): string {
    const type = this.reservationForm.get('tourType')?.value;
    const tour = this.tourTypes.find(t => t.tourTypeId === type);
    return tour ? tour.name : 'Tour';
  }

  getTourImage(): string {
    const type = this.reservationForm.get('tourType')?.value;
    const tour = this.tourTypes.find(t => t.tourTypeId === type);
    return tour?.image || IMAGES.BIVOUAC_SAFARI;
  }

  getSelectedTourBasePrice(): number {
    const type = this.reservationForm.get('tourType')?.value;
    const tour = this.tourTypes.find(t => t.tourTypeId === type);
    return tour?.partnerAdultPrice || 0;
  }

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
      this.promoApplied = false;
      this.discountAmount = 0;
      this.promoMessage = '';
      return;
    }
    const basePrice = this.calculateBasePrice();
    if (code === 'SAHARA10') {
      this.discountAmount = basePrice * 0.10;
      this.appliedPromoCode = 'SAHARA10';
      this.promoApplied = true;
      this.promoError = false;
      this.promoMessage = '✅ 10% de réduction appliqué!';
    } else {
      this.discountAmount = 0;
      this.appliedPromoCode = '';
      this.promoApplied = false;
      this.promoError = true;
      this.promoMessage = '❌ Code promo invalide';
    }
  }

  canProceed(): boolean {
    if (this.currentStep === 0) return this.getCount('adults') >= 1 && !!this.reservationForm.get('tourType')?.value;
    if (this.currentStep === 1) return !!this.reservationForm.get('checkInDate')?.value && !!this.reservationForm.get('checkOutDate')?.value && this.getNights() > 0;
    if (this.currentStep === 2) return !!this.reservationForm.get('partnerName')?.value;
    return true;
  }

  nextStep(): void {
    if (this.currentStep < 3 && this.canProceed()) this.currentStep++;
  }

  previousStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      this.notificationService.showError('Veuillez remplir tous les champs requis');
      return;
    }
    this.isSubmitting = true;
    const formValue = this.reservationForm.value;
    const reservation = {
      partnerName: formValue.partnerName,
      numberOfPeople: formValue.adults + formValue.children,
      adults: formValue.adults,
      children: formValue.children,
      checkInDate: new Date(formValue.checkInDate).toISOString(),
      checkOutDate: new Date(formValue.checkOutDate).toISOString(),
      status: 'pending' as const,
      groupInfo: {
        participants: formValue.participants,
        specialRequests: formValue.specialRequests,
        tourType: formValue.tourType,
      },
      payment: {
        totalAmount: this.calculateFinalPrice(),
        paidAmount: 0,
        paymentStatus: 'pending' as const,
        transactions: [],
        currency: 'TND' as const
      },
      extras: this.buildSelectedExtras(),
      promoCode: this.appliedPromoCode,
      discountAmount: this.discountAmount,
      partnerId: 'p1',
      createdAt: new Date().toISOString()
    };
    try {
      // @ts-ignore
      this.reservationService.createReservation(reservation);
      this.notificationService.showSuccess('✅ Réservation créée avec succès!');
      setTimeout(() => this.router.navigate(['/']), 1500);
    } catch (error) {
      this.notificationService.showError('Erreur lors de la création');
      this.isSubmitting = false;
    }
  }
} 