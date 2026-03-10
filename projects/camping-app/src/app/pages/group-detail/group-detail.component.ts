import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { Reservation, Extra, ExtraCatalog } from '../../models/reservation.model';
import { NotificationService } from '../../services/notification.service';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    GlassCardComponent
  ],
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class GroupDetailComponent implements OnInit {
  reservation?: Reservation;
  extraForm: FormGroup;
  paymentForm: FormGroup;
  extraTotal = 0;
  showExtraForm = false;
  extrasCatalog: ExtraCatalog[] = [];
  selectedExtraId = '';
  selectedExtra?: ExtraCatalog;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.extraForm = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [100, [Validators.required, Validators.min(0)]]
    });

    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      description: ['Paiement espèces / sur place']
    });
  }

  ngOnInit(): void {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
          this.loadReservation(id);
      }
      this.loadExtrasCatalog();
  }
  loadExtrasCatalog(): void {
    this.reservationService.fetchExtrasCatalog().subscribe({
        next: (catalog) => {
            this.extrasCatalog = catalog.filter(e => e.isActive);
        },
        error: (err) => console.error('Failed to load catalog:', err)
    });
  }

  onExtraSelected(): void {
      this.selectedExtra = this.extrasCatalog.find(e => e.extraId === this.selectedExtraId);
      // Reset quantity when selection changes
      this.extraForm.patchValue({ quantity: 1 });
      this.calculateExtraTotal();
  }

  calculateExtraTotal(): void {
      const quantity  = this.extraForm.get('quantity')?.value || 0;
      const unitPrice = this.selectedExtra?.unitPrice || 0;
      this.extraTotal = quantity * unitPrice;
  }

  prevId?: string;
  nextId?: string;

  loadReservation(id: string): void {
      this.reservationService.fetchReservationById(id).subscribe({
          next: (reservation) => {
              this.reservation = reservation;
          },
          error: (err) => console.error('Failed to load reservation:', err)
      });
  }

  navigateTo(targetId: string | undefined): void {
    if (targetId) {
      this.router.navigate(['/group', targetId]);
    }
  }

  updateExtraName(): void {
    const type = this.extraForm.get('type')?.value;
    const names: Record<string, string> = {
      quad: 'Sortie Quad 1h',
      '4x4': 'Excursion 4x4 Sahara',
      meal: 'Pack Repas Royal',
      dromedary: 'Balade Chameau (Coucher Soleil)',
      other: ''
    };
    const prices: Record<string, number> = {
      quad: 120,
      '4x4': 250,
      meal: 80,
      dromedary: 60,
      other: 0
    };

    if (names[type] !== undefined) {
      this.extraForm.patchValue({
        name: names[type] || '',
        unitPrice: prices[type] || 0
      });
      this.calculateExtraTotal();
    }
  }



  addExtra(): void {
      if (!this.reservation || !this.selectedExtraId || this.extraForm.invalid) return;

      const quantity = this.extraForm.get('quantity')?.value;

      this.reservationService.addExtraToReservation(
          this.reservation.id,
          this.selectedExtraId,
          quantity
      ).subscribe({
          next: (updated) => {
              this.reservation = updated;
              this.notificationService.showSuccess('✅ Extra ajouté au groupe.');
              this.selectedExtraId = '';
              this.selectedExtra = undefined;
              this.extraForm.reset({ quantity: 1 });
              this.extraTotal = 0;
              this.showExtraForm = false;
          },
          error: (err) => {
              console.error('Failed to add extra:', err);
              this.notificationService.showError('❌ Erreur lors de l\'ajout de l\'extra.');
          }
      });
  }

  removeExtra(extraId: string): void {
    if (!this.reservation || !confirm('Retirer cet extra de la facturation ?')) return;

    this.reservationService.removeExtra(this.reservation.id, extraId);
    this.notificationService.showInfo('Extra retiré');
    this.loadReservation(this.reservation.id);
  }

  addOnsitePayment(): void {
    if (!this.reservation || this.paymentForm.invalid) return;

    const value = this.paymentForm.value;
    this.reservationService.addPayment(this.reservation.id, {
      amount: value.amount,
      date: new Date().toISOString(),
      method: 'onsite',
      description: value.description
    });

    this.notificationService.showSuccess(`✅ Paiement enregistré (+${value.amount} TND)`);
    this.loadReservation(this.reservation.id);
    this.paymentForm.reset({ amount: 0, description: 'Paiement espèces' });
  }

  markArrived(): void {
      if (!this.reservation || !confirm("Enregistrer l'arrivée effective du groupe ?")) return;
      this.reservationService.markAsArrived(this.reservation.id).subscribe({
          next: (updated) => {
              this.reservation = updated;
              this.notificationService.showSuccess('✅ Arrivée confirmée !');
          },
          error: (err) => console.error('Check-in failed:', err)
      });
  }

  checkOut(): void {
      if (!this.reservation || !confirm('Confirmer le départ du groupe et archiver ?')) return;
      this.reservationService.checkOutReservation(this.reservation.id).subscribe({
          next: () => {
              this.notificationService.showSuccess('👋 Départ enregistré. Dossier archivé.');
              this.router.navigate(['/']);
          },
          error: (err) => console.error('Checkout failed:', err)
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getTourLabel(type: string | undefined): string {
    // With real data, tour type names are already meaningful
    // Just return the name directly with a fallback
    return type || 'Aventure Personnalisée';
  }

  getRemainingAmount(): number {
    return this.reservation ? this.reservation.payment.totalAmount - this.reservation.payment.paidAmount : 0;
  }

  getPaymentProgress(): number {
    if (!this.reservation) return 0;
    return (this.reservation.payment.paidAmount / this.reservation.payment.totalAmount) * 100;
  }

  getExtrasTotal(): number {
    return this.reservation ? this.reservation.extras.reduce((sum: number, e: Extra) => sum + e.totalPrice, 0) : 0;
  }

  getExtraIcon(type: string): string {
    const icons: Record<string, string> = {
      quad: '🏍️',
      '4x4': '🚙',
      meal: '🍽️',
      dromedary: '🐪',
      other: '🎯'
    };
    return icons[type] || '🎯';
  }

  
}