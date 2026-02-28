import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { NotificationService } from '../../services/notification.service';
import { StepperComponent } from '../../shared/components/stepper/stepper.component';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { IMAGES } from '../../core/constants/images';

interface TourType {
  id: string;
  label: string;
  icon: string;
  image: string;
  description: string;
  basePrice: number;
}

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

  steps = [
    { label: 'Expérience' },
    { label: 'Dates & Options' },
    { label: 'Voyageurs' },
    { label: 'Confirmer' }
  ];

  // ORIGINAL 8 TOURS - Only images updated to authentic Dunes Insolites photos
  tourTypes: TourType[] = [
    {
      id: 'Bivouac',
      label: 'Bivouac',
      icon: '',
      image: 'https://www.dunes-insolites.com/wp-content/uploads/2024/05/Bivouac-desert-tunisie-prix-sahara.jpg',
      description: 'Nuit sous les étoiles dans le désert',
      basePrice: 120
    },
    {
      id: 'Demi Pension SUITE Reveillon',
      label: 'Demi Pension SUITE Reveillon',
      icon: '',
      image: 'https://www.dunes-insolites.com/wp-content/uploads/2022/05/281858432_716391999787768_2586643242991276159_n.jpg',
      description: 'Demi-pension en suite pour le réveillon',
      basePrice: 250
    },
    {
      id: 'Demi Pension Reveillon',
      label: 'Demi Pension Reveillon',
      icon: '',
      image: 'https://www.dunes-insolites.com/wp-content/uploads/2024/08/bedouin-dinner-in-desert-tunisia-7.jpg',
      description: 'Demi-pension pour le réveillon',
      basePrice: 180
    },
    {
      id: 'Nuitée Camp DP',
      label: 'Nuitée Camp DP',
      icon: '',
      image: 'https://www.dunes-insolites.com/wp-content/uploads/2024/07/WhatsApp-Image-2024-06-28-at-15.21.52.jpeg',
      description: 'Nuitée au campement avec demi-pension',
      basePrice: 85
    },
    {
      id: 'Sortie 1h30 4x4',
      label: 'Sortie 1h30 4x4',
      icon: '',
      image: IMAGES.QUAD_DJERBA,
      description: 'Excursion en 4x4 dans le désert',
      basePrice: 50
    },
    {
      id: 'Tente Suite DP',
      label: 'Tente Suite DP',
      icon: '',
      image: IMAGES.COMFORTABLE_TENTS,
      description: 'Tente suite avec demi-pension',
      basePrice: 150
    },
    {
      id: 'tente suite adulte',
      label: 'tente suite adulte',
      icon: '',
      image: 'https://www.dunes-insolites.com/wp-content/uploads/2024/05/desert-tentes-confort.jpg',
      description: 'Tente suite pour adultes',
      basePrice: 140
    },
    {
      id: 'tozeur_tataouine_matmata',
      label: 'tozeur_tataouine_matmata',
      icon: '',
      image: 'https://www.dunes-insolites.com/wp-content/uploads/2024/07/tataouine-chenini-djerba.jpg',
      description: 'Circuit Tozeur, Tataouine et Matmata',
      basePrice: 280
    }
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
    // Auto-select tour based on URL parameter
    this.route.queryParams.subscribe(params => {
      if (params['tour']) {
        const tourId = params['tour'];
        const selectedTour = this.tourTypes.find(t => t.id === tourId);

        if (selectedTour) {
          this.reservationForm.patchValue({
            tourType: tourId
          });

          // Auto-enable quad extra if it's a quad tour
          if (tourId.includes('quad')) {
            this.reservationForm.patchValue({
              extras: { quad: true }
            });
          }
        }
      }
    });

    // Initialize one participant row
    this.addParticipant();
  }

  createForm(): FormGroup {
    return this.fb.group({
      partnerName: ['', Validators.required],
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      adults: [2, [Validators.required, Validators.min(1)]],
      children: [0, Validators.min(0)],
      tourType: ['Bivouac', Validators.required],
      specialRequests: [''],
      promoCode: [''],
      participants: this.fb.array([]),
      extras: this.fb.group({
        transfer: [false],
        mealUpgrade: [false],
        quad: [false]
      })
    });
  }

  get participants(): FormArray {
    return this.reservationForm.get('participants') as FormArray;
  }

  get extrasForm(): FormGroup {
    return this.reservationForm.get('extras') as FormGroup;
  }

  getExtraControl(name: string): FormControl {
    return this.extrasForm.get(name) as FormControl;
  }

  addParticipant(): void {
    const p = this.fb.group({
      name: [''],
      ageGroup: ['adult']
    });
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
    const tour = this.tourTypes.find(t => t.id === type);
    return tour ? tour.label : 'Tour';
  }

  getTourImage(): string {
    const type = this.reservationForm.get('tourType')?.value;
    const tour = this.tourTypes.find(t => t.id === type);
    return tour?.image || IMAGES.BIVOUAC_SAFARI;
  }

  getSelectedTourBasePrice(): number {
    const type = this.reservationForm.get('tourType')?.value;
    const tour = this.tourTypes.find(t => t.id === type);
    return tour?.basePrice || 200;
  }

  hasExtras(): boolean {
    return this.extrasForm.get('transfer')?.value ||
      this.extrasForm.get('mealUpgrade')?.value ||
      this.extrasForm.get('quad')?.value;
  }

  calculateExtrasPrice(): number {
    let total = 0;
    const adults = this.getCount('adults');
    const children = this.getCount('children');
    const people = adults + children;

    if (this.extrasForm.get('transfer')?.value) total += 150;
    if (this.extrasForm.get('mealUpgrade')?.value) total += (80 * people);
    if (this.extrasForm.get('quad')?.value) total += (120 * people);

    return total;
  }

  calculateAdultPrice(): number {
    const basePrice = this.getSelectedTourBasePrice();
    return this.getCount('adults') * basePrice * Math.max(1, this.getNights());
  }

  calculateChildPrice(): number {
    const basePrice = this.getSelectedTourBasePrice();
    return this.getCount('children') * (basePrice * 0.5) * Math.max(1, this.getNights());
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
    if (this.currentStep === 0) {
      return this.getCount('adults') >= 1 && !!this.reservationForm.get('tourType')?.value;
    }
    if (this.currentStep === 1) {
      return !!this.reservationForm.get('checkInDate')?.value &&
        !!this.reservationForm.get('checkOutDate')?.value &&
        this.getNights() > 0;
    }
    if (this.currentStep === 2) {
      return !!this.reservationForm.get('partnerName')?.value;
    }
    return true;
  }

  nextStep(): void {
    if (this.currentStep < 3 && this.canProceed()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
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
        extras: formValue.extras
      },
      payment: {
        totalAmount: this.calculateFinalPrice(),
        paidAmount: 0,
        paymentStatus: 'pending' as const,
        transactions: [],
        currency: 'TND' as const
      },
      extras: [],
      promoCode: this.appliedPromoCode,
      discountAmount: this.discountAmount,
      partnerId: 'p1',
      createdAt: new Date().toISOString()
    };

    try {
      // @ts-ignore
      this.reservationService.createReservation(reservation);
      this.notificationService.showSuccess('✅ Réservation créée avec succès!');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);
    } catch (error) {
      this.notificationService.showError('Erreur lors de la création');
      this.isSubmitting = false;
    }
  }
}