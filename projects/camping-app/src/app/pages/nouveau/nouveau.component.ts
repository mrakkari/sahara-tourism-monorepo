import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { NotificationService } from '../../services/notification.service';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';

@Component({
    selector: 'app-nouveau',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        GlassCardComponent
    ],
    templateUrl: './nouveau.component.html',
    styleUrls: ['./nouveau.component.scss']
})
export class NouveauComponent implements OnInit {
    reservationForm: FormGroup;
    isSubmitting = false;

    tourTypes = [
        { value: 'dunes', label: 'Tour des Dunes' },
        { value: 'oases', label: 'Oasis Search' },
        { value: 'mixed', label: 'Mixte Sahara' },
        { value: 'custom', label: 'Sur Mesure' },
        { value: 'quad', label: 'Quad Adventure' }
    ];

    constructor(
        private fb: FormBuilder,
        private reservationService: ReservationService,
        private notificationService: NotificationService,
        private router: Router
    ) {
        this.reservationForm = this.fb.group({
            // Partner Info
            partnerName: ['', [Validators.required, Validators.minLength(2)]],

            // Group Info
            adults: [2, [Validators.required, Validators.min(1)]],
            children: [0, [Validators.min(0)]],
            tourType: ['mixed', Validators.required],
            specialRequests: [''],

            // Dates
            checkInDate: ['', Validators.required],
            checkOutDate: ['', Validators.required],

            // Payment
            pricePerPerson: [400, [Validators.required, Validators.min(0)]],
            depositAmount: [0, [Validators.min(0)]]
        });
    }

    ngOnInit(): void {
        // Set default check-in date to today
        const today = new Date().toISOString().split('T')[0];
        this.reservationForm.patchValue({ checkInDate: today });

        // Set default check-out to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        this.reservationForm.patchValue({ checkOutDate: tomorrow.toISOString().split('T')[0] });
    }

    get totalPeople(): number {
        const adults = this.reservationForm.get('adults')?.value || 0;
        const children = this.reservationForm.get('children')?.value || 0;
        return adults + children;
    }

    get estimatedTotal(): number {
        const pricePerPerson = this.reservationForm.get('pricePerPerson')?.value || 0;
        return this.totalPeople * pricePerPerson;
    }

    get remainingAfterDeposit(): number {
        const deposit = this.reservationForm.get('depositAmount')?.value || 0;
        return Math.max(0, this.estimatedTotal - deposit);
    }

    onSubmit(): void {
        if (this.reservationForm.invalid) {
            this.notificationService.showError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        this.isSubmitting = true;
        const formValue = this.reservationForm.value;

        const newReservation = {
            partnerId: 'manual_' + Date.now(),
            partnerName: formValue.partnerName,
            numberOfPeople: this.totalPeople,
            adults: formValue.adults,
            children: formValue.children,
            checkInDate: new Date(formValue.checkInDate).toISOString(),
            checkOutDate: new Date(formValue.checkOutDate).toISOString(),
            status: 'confirmed' as const,
            groupInfo: {
                participants: [],
                specialRequests: formValue.specialRequests || '',
                tourType: formValue.tourType
            },
            payment: {
                totalAmount: this.estimatedTotal,
                paidAmount: formValue.depositAmount || 0,
                currency: 'TND' as const,
                paymentStatus: (formValue.depositAmount > 0 ? 'partial' : 'pending') as 'pending' | 'partial' | 'completed',
                transactions: formValue.depositAmount > 0 ? [{
                    id: 'dep_' + Date.now(),
                    amount: formValue.depositAmount,
                    date: new Date().toISOString(),
                    method: 'transfer' as const,
                    status: 'completed' as const,
                    description: 'Acompte initial'
                }] : []
            },
            extras: []
        };

        try {
            this.reservationService.createReservation(newReservation);
            this.notificationService.showSuccess('✅ Réservation créée avec succès !');
            this.router.navigate(['/']);
        } catch (error) {
            this.notificationService.showError('Erreur lors de la création');
        } finally {
            this.isSubmitting = false;
        }
    }

    resetForm(): void {
        this.reservationForm.reset({
            adults: 2,
            children: 0,
            tourType: 'mixed',
            pricePerPerson: 400,
            depositAmount: 0
        });
        this.ngOnInit();
    }
}
