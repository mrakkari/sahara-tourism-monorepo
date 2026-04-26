// camping-app/src/app/core/pages/group-detail/group-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { forkJoin } from 'rxjs';

import { ResCampingService } from '../../services/res-camping.service';
import { NotificationService, ToastService } from '../../../../../shared/src/public-api';

import { Reservation, Extra, ExtraCatalog } from '../../models/reservation.model';
import { PaymentMethod, PAYMENT_METHOD_LABELS, Currency } from '../../../../../shared/src/models/transaction.model';

import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, StatusBadgeComponent, GlassCardComponent],
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

  reservation: Reservation | null = null;

  extraForm!: FormGroup;
  extraTotal = 0;
  showExtraForm = false;
  extrasCatalog: ExtraCatalog[] = [];
  selectedExtraId: string | null = null;
  pendingExtras:   { catalog: ExtraCatalog; quantity: number }[] = [];

  paymentForm!:       FormGroup;
  isRecordingPayment = false;
  paymentError: string | null = null;

  paymentMethods: { value: PaymentMethod; label: string }[] =
    Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => ({ value: v as PaymentMethod, label: l }));

  prevId?: string;
  nextId?: string;

  constructor(
    private route:               ActivatedRoute,
    private router:              Router,
    private resCampingService:   ResCampingService,
    private notificationService: NotificationService,
    private toastService:        ToastService,
    private fb:                  FormBuilder
  ) {}

  ngOnInit(): void {
    this.extraForm   = this.fb.group({ quantity: [1, [Validators.required, Validators.min(1)]] });
    this.paymentForm = this.fb.group({
      amount:        [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['CASH', Validators.required],
    });
    this.loadCatalog();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadReservation(id);
  }

  loadReservation(id: string): void {
    this.resCampingService.fetchReservationById(id).subscribe({
      next: res => { this.reservation = res; this.buildNavigation(id); },
      error: err => console.error('Failed to load reservation:', err)
    });
  }

  private buildNavigation(id: string): void {
    const all = (this.resCampingService as any)['reservationsSubject'].value as Reservation[];
    const sorted = [...all]
      .filter(r => r.status === 'confirmed' || r.status === 'checked_in')
      .sort((a, b) => {
        if (a.status === 'checked_in' && b.status !== 'checked_in') return -1;
        if (b.status === 'checked_in' && a.status !== 'checked_in') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    const idx   = sorted.findIndex(r => r.id === id);
    this.prevId = idx > 0               ? sorted[idx - 1].id : undefined;
    this.nextId = idx < sorted.length-1 ? sorted[idx + 1].id : undefined;
  }

  navigateTo(id?: string): void { if (id) this.router.navigate(['/group', id]); }

  get isFullyPaid(): boolean { return this.reservation?.payment?.paymentStatus === 'completed'; }

  recordPayment(): void {
    if (!this.reservation || this.paymentForm.invalid) return;
    const { amount, paymentMethod } = this.paymentForm.value;
    this.isRecordingPayment = true;
    this.paymentError       = null;
    this.resCampingService.recordPayment(this.reservation.id, {
      amount,
      paymentMethod,
      currency: this.reservation.currency as Currency,
    }).subscribe({
      next: () => {
        this.isRecordingPayment = false;
        this.toastService.showSuccess(`✅ Paiement de ${amount} TND enregistré.`);
        this.paymentForm.reset({ amount: null, paymentMethod: 'CASH' });
        this.loadReservation(this.reservation!.id);
      },
      error: err => {
        this.isRecordingPayment = false;
        this.paymentError = err?.error?.message ?? 'Erreur lors du paiement.';
        this.toastService.showError('❌ ' + this.paymentError);
      }
    });
  }

  markArrived(): void {
    if (!this.reservation || !confirm("Enregistrer l'arrivée effective du groupe ?")) return;
    this.resCampingService.markAsArrived(this.reservation.id).subscribe({
      next: updated => { this.reservation = updated; this.toastService.showSuccess('✅ Arrivée confirmée !'); },
      error: err    => console.error('Check-in failed:', err)
    });
  }

  checkOut(): void {
    if (!this.reservation || !confirm('Confirmer le départ du groupe et archiver ?')) return;
    this.resCampingService.checkOutReservation(this.reservation.id).subscribe({
      next: () => { this.toastService.showSuccess('👋 Départ enregistré.'); this.router.navigate(['/']); },
      error: err => console.error('Checkout failed:', err)
    });
  }

  loadCatalog(): void {
    this.resCampingService.fetchExtrasCatalog().subscribe({
      next: catalog => this.extrasCatalog = catalog.filter(e => e.isActive),
      error: err    => console.error('Failed to load catalog:', err)
    });
  }

  get selectedExtra(): ExtraCatalog | null {
    return this.extrasCatalog.find(e => e.extraId === this.selectedExtraId) ?? null;
  }

  get totalGroupSize(): number { return (this.reservation?.adults ?? 0) + (this.reservation?.children ?? 0); }
  get cartTotal(): number { return this.pendingExtras.reduce((s, e) => s + e.catalog.unitPrice * e.quantity, 0); }

  onExtraSelected(extraId: string): void {
    if (this.isExtraInCart(extraId)) return;
    this.selectedExtraId = extraId;
    this.extraForm.patchValue({ quantity: 1 });
    this.calculateExtraTotal();
  }

  isExtraInCart(extraId: string): boolean { return this.pendingExtras.some(e => e.catalog.extraId === extraId); }
  selectAllGroup(): void { this.extraForm.patchValue({ quantity: this.totalGroupSize }); this.calculateExtraTotal(); }

  calculateExtraTotal(): void {
    this.extraTotal = (this.extraForm.get('quantity')?.value || 0) * (this.selectedExtra?.unitPrice || 0);
  }

  addToCart(): void {
    if (!this.selectedExtra || this.extraForm.invalid) return;
    const quantity = this.extraForm.get('quantity')?.value || 1;
    const existing = this.pendingExtras.find(e => e.catalog.extraId === this.selectedExtra!.extraId);
    if (existing) { existing.quantity = quantity; }
    else          { this.pendingExtras.push({ catalog: this.selectedExtra, quantity }); }
    this.selectedExtraId = null;
    this.extraForm.patchValue({ quantity: 1 });
    this.extraTotal = 0;
  }

  removeFromCart(extraId: string): void {
    this.pendingExtras = this.pendingExtras.filter(e => e.catalog.extraId !== extraId);
  }

  submitExtras(): void {
    if (!this.reservation || this.pendingExtras.length === 0) return;
    forkJoin(this.pendingExtras.map(e =>
      this.resCampingService.addExtraToReservation(this.reservation!.id, e.catalog.extraId, e.quantity)
    )).subscribe({
      next: () => {
        const count = this.pendingExtras.length;
        this.pendingExtras = []; this.showExtraForm = false;
        this.toastService.showSuccess(`✅ ${count} extra(s) ajouté(s).`);
        this.loadReservation(this.reservation!.id);
      },
      error: err => { console.error(err); this.toastService.showError('❌ Erreur.'); this.loadReservation(this.reservation!.id); }
    });
  }

  removeExtra(extra: Extra): void {
    if (!this.reservation || !confirm('Retirer cet extra ?')) return;
    this.resCampingService.deleteExtra(extra.reservationExtraId ?? extra.id).subscribe({
      next: () => { this.toastService.showSuccess('✅ Extra retiré.'); this.loadReservation(this.reservation!.id); },
      error: err => { console.error(err); this.toastService.showError('❌ Erreur.'); }
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  }

  formatDateTime(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  getRemainingAmount(): number {
    if (!this.reservation) return 0;
    return Math.max(0, (this.reservation.payment.totalAmount || 0) - (this.reservation.payment.paidAmount || 0));
  }

  getPaymentProgress(): number {
    if (!this.reservation) return 0;
    const total = this.reservation.payment.totalAmount || 0;
    return total === 0 ? 0 : Math.min(100, (this.reservation.payment.paidAmount / total) * 100);
  }

  getExtrasTotal(): number {
    return (this.reservation?.extras ?? []).reduce((s: number, e: Extra) => s + e.totalPrice, 0);
  }

  getExtraIcon(type: string): string {
    const icons: Record<string, string> = {
      quad: '🏍️', '4x4': '🚙', meal: '🍽️', dromedary: '🐪',
      other: '🎯', activity: '🎯', transport: '🚌', accommodation: '🏕️',
    };
    return icons[type] ?? '🎯';
  }

  getTourLabel(r: Reservation): string {
    if (r.reservationType === 'TOURS' && r.tours?.length) return r.tours.map(t => t.name).join(', ');
    if (r.tourTypes?.length) return r.tourTypes.map(t => t.name).join(', ');
    return r.groupInfo?.tourType ?? 'N/A';
  }
  
}