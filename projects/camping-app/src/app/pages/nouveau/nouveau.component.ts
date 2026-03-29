import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ReservationService } from '../../services/reservation.service';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { ToastService } from '../../../../../shared/src/public-api';
import { TourType } from '../../../../../shared/src/models/tour.model';
import { ExtraResponse } from '../../../../../shared/src/models/extra.model';
import { UserResponse } from '../../../../../shared/src/models/user.model';
import { ReservationRequest } from '../../../../../shared/src/models/reservation-api.model';

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

    // Fixed source for this app
    readonly SOURCE = 'CAMPING_APP';

    // Expose Math to the template (fixes "Property 'Math' does not exist")
    readonly Math = Math;

    // API data
    tourTypes: TourType[] = [];
    extras: ExtraResponse[] = [];
    users: UserResponse[] = [];

    // UI state
    isLoadingTourTypes = false;
    isLoadingExtras = false;
    isLoadingUsers = false;
    showNewUserModal = false;

    newUserForm: FormGroup;
    isCreatingUser = false;

    private readonly apiUrl = 'http://localhost:8080/api';

    constructor(
        private fb: FormBuilder,
        private reservationService: ReservationService,
        private toastService: ToastService,
        private router: Router,
        private http: HttpClient
    ) {
        this.reservationForm = this.fb.group({
            userId:           ['', Validators.required],
            groupName:        ['', Validators.required],
            groupLeaderName:  ['', Validators.required],
            demandeSpecial:   [''],
            promoCode:        [''],
            currency:         ['TND'],
            checkInDate:      ['', Validators.required],
            checkOutDate:     ['', Validators.required],
            numberOfAdults:   [2, [Validators.required, Validators.min(1)]],
            numberOfChildren: [0, [Validators.min(0)]],
            tourTypes:        this.fb.array([]),
            extras:           this.fb.array([]),
        });

        this.newUserForm = this.fb.group({
            name:  ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            role:  ['CLIENT', Validators.required],
        });
    }

    ngOnInit(): void {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        this.reservationForm.patchValue({
            checkInDate:  today,
            checkOutDate: tomorrow.toISOString().split('T')[0]
        });

        this.loadTourTypes();
        this.loadExtras();
        this.loadUsers();
    }

    // ─── Loaders ──────────────────────────────────────────────────

    loadTourTypes(): void {
        this.isLoadingTourTypes = true;
        this.fetchTourTypes().subscribe({
            next: (types: TourType[]) => {
                this.tourTypes = types;
                this.isLoadingTourTypes = false;
            },
            error: () => {
                this.toastService.showError('Erreur lors du chargement des types de tour');
                this.isLoadingTourTypes = false;
            }
        });
    }

    loadExtras(): void {
        this.isLoadingExtras = true;
        this.fetchExtras().subscribe({
            next: (extras: ExtraResponse[]) => {
                this.extras = extras;
                this.extrasArray.clear();
                extras.forEach((extra: ExtraResponse) => {
                    this.extrasArray.push(this.fb.group({
                        extraId:   [extra.extraId],
                        name:      [extra.name],
                        unitPrice: [extra.unitPrice],
                        selected:  [false],
                        quantity:  [1, [Validators.min(1)]]
                    }));
                });
                this.isLoadingExtras = false;
            },
            error: () => {
                this.toastService.showError('Erreur lors du chargement des extras');
                this.isLoadingExtras = false;
            }
        });
    }

    loadUsers(): void {
        this.isLoadingUsers = true;
        this.fetchUsers().subscribe({
            next: (users: UserResponse[]) => {
                this.users = users;
                this.isLoadingUsers = false;
            },
            error: () => {
                this.toastService.showError('Erreur lors du chargement des clients');
                this.isLoadingUsers = false;
            }
        });
    }

    // ─── Private HTTP helpers ─────────────────────────────────────
    // Called directly via HttpClient to avoid depending on methods
    // that may not exist on the shared ReservationService build.

    private fetchTourTypes(): Observable<TourType[]> {
        return this.http.get<TourType[]>(`${this.apiUrl}/tour-types`);
    }

    private fetchExtras(): Observable<ExtraResponse[]> {
        return this.http.get<ExtraResponse[]>(`${this.apiUrl}/extras`).pipe(
            map((list: ExtraResponse[]) => list.filter((e: ExtraResponse) => e.isActive))
        );
    }

    private fetchUsers(): Observable<UserResponse[]> {
        return this.http.get<UserResponse[]>(`${this.apiUrl}/auth/clients-partenaires`);
    }

    // ─── FormArray accessors ──────────────────────────────────────

    get tourTypesArray(): FormArray {
        return this.reservationForm.get('tourTypes') as FormArray;
    }

    get extrasArray(): FormArray {
        return this.reservationForm.get('extras') as FormArray;
    }

    get selectedTourTypesCount(): number {
        return this.tourTypesArray.length;
    }

    get isMultiTourType(): boolean {
        return this.selectedTourTypesCount > 1;
    }

    // ─── Tour Type Selection ──────────────────────────────────────

    isTourTypeSelected(tourTypeId: string): boolean {
        return this.tourTypesArray.controls.some(
            c => c.get('tourTypeId')?.value === tourTypeId
        );
    }

    toggleTourType(tourType: TourType): void {
        const idx = this.tourTypesArray.controls.findIndex(
            c => c.get('tourTypeId')?.value === tourType.tourTypeId
        );

        if (idx >= 0) {
            this.tourTypesArray.removeAt(idx);
        } else {
            // Store prices using the CORRECT TourType field names
            this.tourTypesArray.push(this.fb.group({
                tourTypeId:       [tourType.tourTypeId],
                name:             [tourType.name],
                adultPrice:       [tourType.partnerAdultPrice  ?? 0],
                childPrice:       [tourType.partnerChildPrice  ?? 0],
                numberOfAdults:   [+(this.reservationForm.get('numberOfAdults')?.value)   || 2, [Validators.required, Validators.min(0)]],
                numberOfChildren: [+(this.reservationForm.get('numberOfChildren')?.value) || 0, [Validators.min(0)]]
            }));
        }
    }

    // ─── Computed totals ──────────────────────────────────────────

    get totalAdults(): number {
        if (this.isMultiTourType) {
            return this.tourTypesArray.controls.reduce(
                (sum, c) => sum + (+(c.get('numberOfAdults')?.value) || 0), 0
            );
        }
        return +(this.reservationForm.get('numberOfAdults')?.value) || 0;
    }

    get totalChildren(): number {
        if (this.isMultiTourType) {
            return this.tourTypesArray.controls.reduce(
                (sum, c) => sum + (+(c.get('numberOfChildren')?.value) || 0), 0
            );
        }
        return +(this.reservationForm.get('numberOfChildren')?.value) || 0;
    }

    get totalPeople(): number {
        return this.totalAdults + this.totalChildren;
    }

    get selectedExtrasTotal(): number {
        return this.extrasArray.controls
            .filter(c => c.get('selected')?.value)
            .reduce((sum, c) => {
                const qty   = +(c.get('quantity')?.value)  || 1;
                const price = +(c.get('unitPrice')?.value) || 0;
                return sum + qty * price;
            }, 0);
    }

    get tourTypesTotal(): number {
        if (this.isMultiTourType) {
            return this.tourTypesArray.controls.reduce((sum, c) => {
                const adults     = +(c.get('numberOfAdults')?.value)   || 0;
                const children   = +(c.get('numberOfChildren')?.value) || 0;
                const adultPrice = +(c.get('adultPrice')?.value)       || 0;
                const childPrice = +(c.get('childPrice')?.value)       || 0;
                return sum + adults * adultPrice + children * childPrice;
            }, 0);
        }

        if (this.tourTypesArray.length === 1) {
            const tc         = this.tourTypesArray.at(0);
            const adults     = +(this.reservationForm.get('numberOfAdults')?.value)   || 0;
            const children   = +(this.reservationForm.get('numberOfChildren')?.value) || 0;
            const adultPrice = +(tc.get('adultPrice')?.value) || 0;
            const childPrice = +(tc.get('childPrice')?.value) || 0;
            return adults * adultPrice + children * childPrice;
        }

        return 0;
    }

    get estimatedTotal(): number {
        return this.tourTypesTotal + this.selectedExtrasTotal;
    }

    // ─── Quantity stepper helpers (called from template) ──────────

    decrementQty(control: ReturnType<FormArray['at']>): void {
        const cur = +(control.get('quantity')?.value) || 1;
        control.get('quantity')?.setValue(Math.max(1, cur - 1));
    }

    incrementQty(control: ReturnType<FormArray['at']>): void {
        const cur = +(control.get('quantity')?.value) || 1;
        control.get('quantity')?.setValue(cur + 1);
    }

    // ─── New User Modal ───────────────────────────────────────────

    openNewUserModal(): void {
        this.showNewUserModal = true;
        this.newUserForm.reset({ role: 'CLIENT' });
    }

    closeNewUserModal(): void {
        this.showNewUserModal = false;
    }

    // ─── Submit ───────────────────────────────────────────────────

    onSubmit(): void {
        if (this.reservationForm.invalid) {
            this.reservationForm.markAllAsTouched();
            this.toastService.showError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (this.tourTypesArray.length === 0) {
            this.toastService.showError('Veuillez sélectionner au moins un type de tour');
            return;
        }

        this.isSubmitting = true;
        const fv = this.reservationForm.value;

        const tourTypesPayload = this.tourTypesArray.controls.map(c => ({
            tourTypeId:       c.get('tourTypeId')?.value as string,
            numberOfAdults:   this.isMultiTourType
                                ? (+(c.get('numberOfAdults')?.value)   || 0)
                                : (+(fv.numberOfAdults) || 0),
            numberOfChildren: this.isMultiTourType
                                ? (+(c.get('numberOfChildren')?.value) || 0)
                                : (+(fv.numberOfChildren) || 0),
        }));

        const extrasPayload = this.extrasArray.controls
            .filter(c => c.get('selected')?.value)
            .map(c => ({
                extraId:  c.get('extraId')?.value as string,
                quantity: +(c.get('quantity')?.value) || 1
            }));

        const request: ReservationRequest = {
            userId:           fv.userId,
            source:           this.SOURCE,
            checkInDate:      fv.checkInDate,
            checkOutDate:     fv.checkOutDate,
            groupName:        fv.groupName,
            groupLeaderName:  fv.groupLeaderName,
            numberOfAdults:   this.totalAdults,
            numberOfChildren: this.totalChildren,
            currency:         fv.currency || 'TND',
            promoCode:        fv.promoCode     || undefined,
            demandeSpecial:   fv.demandeSpecial || undefined,
            tourTypes:        tourTypesPayload,
            extras:           extrasPayload.length > 0 ? extrasPayload : undefined,
        };

        this.reservationService.createReservation(request as unknown as Record<string, unknown>).subscribe({
            next: () => {
                this.toastService.showSuccess('✅ Réservation créée avec succès !');
                this.router.navigate(['/']);
            },
            error: (err: unknown) => {
                console.error('Erreur création:', err);
                this.toastService.showError('Erreur lors de la création de la réservation');
                this.isSubmitting = false;
            }
        });
    }

    resetForm(): void {
        this.tourTypesArray.clear();
        this.extrasArray.clear();
        this.reservationForm.reset({
            numberOfAdults:   2,
            numberOfChildren: 0,
            currency:         'TND'
        });
        this.ngOnInit();
    }
}