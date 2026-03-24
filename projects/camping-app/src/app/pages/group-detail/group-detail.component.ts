import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { Reservation, Extra, ExtraCatalog } from '../../models/reservation.model';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { forkJoin } from 'rxjs';
import { NotificationService, ToastService } from '../../../../../shared/src/public-api';
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
 // selectedExtraId = '';
  //selectedExtra?: ExtraCatalog;
  selectedExtraId: string | null = null;
  pendingExtras: { catalog: ExtraCatalog; quantity: number }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.extraForm = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1)]],
    //  unitPrice: [100, [Validators.required, Validators.min(0)]]
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
      this.loadCatalog();  // ← only this one
  }


 /* onExtraSelected(): void {
      this.selectedExtra = this.extrasCatalog.find(e => e.extraId === this.selectedExtraId);
      // Reset quantity when selection changes
      this.extraForm.patchValue({ quantity: 1 });
      this.calculateExtraTotal();
  }*/



  prevId?: string;
  nextId?: string;

  loadReservation(id: string): void {
      this.reservationService.fetchReservationById(id).subscribe({
          next: (reservation) => {
              this.reservation = reservation;
              // Rebuild prev/next navigation from cached list
              const all = this.reservationService['reservationsSubject'].value;
              const sorted = [...all]
                  .filter(r => r.status === 'confirmed' || r.status === 'checked_in')
                  .sort((a, b) => {
                      if (a.status === 'checked_in' && b.status !== 'checked_in') return -1;
                      if (b.status === 'checked_in' && a.status !== 'checked_in') return 1;
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  });
              const idx = sorted.findIndex(r => r.id === id);
              this.prevId = idx > 0 ? sorted[idx - 1].id : undefined;
              this.nextId = idx < sorted.length - 1 ? sorted[idx + 1].id : undefined;
          },
          error: (err) => console.error('Failed to load reservation:', err)
      });
  }

  navigateTo(targetId: string | undefined): void {
    if (targetId) {
      this.router.navigate(['/group', targetId]);
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
              this.toastService.showSuccess('✅ Extra ajouté au groupe.');
              this.selectedExtraId = null;
              this.extraForm.reset({ quantity: 1 });
              this.extraTotal = 0;
              this.showExtraForm = false;
          },
          error: (err) => {
              console.error('Failed to add extra:', err);
              this.toastService.showError('❌ Erreur lors de l\'ajout de l\'extra.');
          }
      });
  }

  removeExtra(extra: Extra): void {
      if (!this.reservation || !confirm('Retirer cet extra de la facturation ?')) return;

      const extraId = extra.reservationExtraId ?? extra.id;

      this.reservationService.deleteExtra(extraId).subscribe({
          next: () => {
              this.toastService.showSuccess('✅ Extra retiré avec succès');
              this.loadReservation(this.reservation!.id);
          },
          error: (err: unknown) => {
              console.error('Failed to delete extra:', err);
              this.toastService.showError('❌ Erreur lors de la suppression.');
          }
      });
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

    this.toastService.showSuccess(`✅ Paiement enregistré (+${value.amount} TND)`);
    this.loadReservation(this.reservation.id);
    this.paymentForm.reset({ amount: 0, description: 'Paiement espèces' });
  }

  markArrived(): void {
      if (!this.reservation || !confirm("Enregistrer l'arrivée effective du groupe ?")) return;
      this.reservationService.markAsArrived(this.reservation.id).subscribe({
          next: (updated) => {
              this.reservation = updated;
              this.toastService.showSuccess('✅ Arrivée confirmée !');
          },
          error: (err) => console.error('Check-in failed:', err)
      });
  }

  checkOut(): void {
      if (!this.reservation || !confirm('Confirmer le départ du groupe et archiver ?')) return;
      this.reservationService.checkOutReservation(this.reservation.id).subscribe({
          next: () => {
              this.toastService.showSuccess('👋 Départ enregistré. Dossier archivé.');
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
    // ── Catalog ───────────────────────────────────────────────────
  loadCatalog(): void {
      this.reservationService.fetchExtrasCatalog().subscribe({
          next: (catalog) => this.extrasCatalog = catalog.filter(e => e.isActive),
          error: (err) => console.error('Failed to load catalog:', err)
      });
  }

  // ── Computed ──────────────────────────────────────────────────
  get selectedExtra(): ExtraCatalog | null {
      return this.extrasCatalog.find(e => e.extraId === this.selectedExtraId) ?? null;
  }

  get totalGroupSize(): number {
      return (this.reservation?.adults ?? 0) + (this.reservation?.children ?? 0);
  }

  get cartTotal(): number {
      return this.pendingExtras.reduce(
          (sum, e) => sum + e.catalog.unitPrice * e.quantity, 0
      );
  }

  // ── Selection ─────────────────────────────────────────────────
  onExtraSelected(extraId: string): void {
      // If already in cart, don't re-select
      if (this.isExtraInCart(extraId)) return;
      this.selectedExtraId = extraId;
      this.extraForm.patchValue({ quantity: 1 });
      this.calculateExtraTotal();
  }

  isExtraInCart(extraId: string): boolean {
      return this.pendingExtras.some(e => e.catalog.extraId === extraId);
  }

  selectAllGroup(): void {
      this.extraForm.patchValue({ quantity: this.totalGroupSize });
      this.calculateExtraTotal();
  }

  calculateExtraTotal(): void {
      const quantity  = this.extraForm.get('quantity')?.value || 0;
      const unitPrice = this.selectedExtra?.unitPrice || 0;
      this.extraTotal = quantity * unitPrice;
  }

  // ── Cart ──────────────────────────────────────────────────────
  addToCart(): void {
      if (!this.selectedExtra || this.extraForm.invalid) return;

      const quantity = this.extraForm.get('quantity')?.value || 1;
      const existing = this.pendingExtras.find(
          e => e.catalog.extraId === this.selectedExtra!.extraId
      );

      if (existing) {
          existing.quantity = quantity;
      } else {
          this.pendingExtras.push({ catalog: this.selectedExtra, quantity });
      }

      // Reset selection for next pick
      this.selectedExtraId = null;
      this.extraForm.patchValue({ quantity: 1 });
      this.extraTotal = 0;
  }

  removeFromCart(extraId: string): void {
      this.pendingExtras = this.pendingExtras.filter(
          e => e.catalog.extraId !== extraId
      );
  }

  // ── Submit all cart items ─────────────────────────────────────
  submitExtras(): void {
      if (!this.reservation || this.pendingExtras.length === 0) return;

      const calls = this.pendingExtras.map(e =>
          this.reservationService.addExtraToReservation(
              this.reservation!.id,
              e.catalog.extraId,
              e.quantity
          )
      );

      forkJoin(calls).subscribe({
          next: () => {
              const count = this.pendingExtras.length;
              this.pendingExtras = [];
              this.showExtraForm = false;
              this.toastService.showSuccess(
                  `✅ ${count} extra(s) ajouté(s) avec succès !`
              );
              this.loadReservation(this.reservation!.id);
          },
          error: (err: unknown) => {
              console.error('Failed to submit extras:', err);
              this.toastService.showError('❌ Erreur lors de l\'ajout.');
              this.loadReservation(this.reservation!.id);
          }
      });
  }  
}