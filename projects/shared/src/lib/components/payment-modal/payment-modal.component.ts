// shared/src/components/payment-modal/payment-modal.component.ts

import {
  Component, Input, Output, EventEmitter, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PAYMENT_METHOD_LABELS, PaymentMethod, PaymentRequest, PaymentSummary } from '../../../models/transaction.model';


@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="modal-overlay" (click)="onClose()">
  <div class="modal-box" (click)="$event.stopPropagation()">

    <div class="modal-header">
      <h3>💳 Enregistrer un paiement</h3>
      <button class="modal-close" (click)="onClose()">✕</button>
    </div>

    <div class="modal-body" [formGroup]="form">

      <!-- Summary if provided (detail page mode) -->
      <div class="payment-summary" *ngIf="summary">
        <div class="sum-row">
          <span>Total général</span>
          <strong>{{ summary.originalTotalAmount | number:'1.2-2' }} {{ currency }}</strong>
        </div>
        <div class="sum-row paid">
          <span>Déjà payé</span>
          <strong>{{ summary.totalPaid | number:'1.2-2' }} {{ currency }}</strong>
        </div>
        <div class="sum-row remaining">
          <span>Reste à payer</span>
          <strong>{{ summary.remainingTotal | number:'1.2-2' }} {{ currency }}</strong>
        </div>
      </div>

      <!-- Amount -->
      <div class="field">
        <label>Montant <span class="req">*</span></label>
        <div class="amount-input-wrap">
          <input
            type="number"
            class="input"
            formControlName="amount"
            placeholder="0.00"
            min="0.01"
            step="0.01"
          />
          <span class="currency-tag">{{ currency }}</span>
        </div>
        <p class="field-error"
          *ngIf="form.get('amount')?.invalid && form.get('amount')?.touched">
          Montant invalide
        </p>
      </div>

      <!-- Payment method -->
      <div class="field">
        <label>Méthode de paiement <span class="req">*</span></label>
        <select class="input" formControlName="paymentMethod">
          <option value="">— Choisir —</option>
          <option *ngFor="let m of paymentMethods" [value]="m.value">
            {{ m.label }}
          </option>
        </select>
        <p class="field-error"
          *ngIf="form.get('paymentMethod')?.invalid && form.get('paymentMethod')?.touched">
          Méthode requise
        </p>
      </div>

      <!-- Error from server -->
      <div class="server-error" *ngIf="serverError">
        ⚠️ {{ serverError }}
      </div>

    </div>

    <div class="modal-footer">
      <button class="btn-secondary" (click)="onClose()" [disabled]="isSubmitting">
        Annuler
      </button>
      <button
        class="btn-primary"
        (click)="onSubmit()"
        [disabled]="form.invalid || isSubmitting">
        <ng-container *ngIf="!isSubmitting">✅ Confirmer le paiement</ng-container>
        <ng-container *ngIf="isSubmitting">⏳ Traitement…</ng-container>
      </button>
    </div>

  </div>
</div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px;
    }
    .modal-box {
      background: white; border-radius: 12px;
      width: 100%; max-width: 480px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .modal-close {
      background: #f1f5f9; border: none; border-radius: 50%;
      width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer {
      display: flex; gap: 12px; justify-content: flex-end;
      padding: 16px 24px; border-top: 1px solid #e2e8f0;
    }

    .payment-summary {
      background: #f8fafc; border-radius: 8px; padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .sum-row {
      display: flex; justify-content: space-between;
      font-size: 0.9rem; color: #475569;
    }
    .sum-row.paid strong { color: #10b981; }
    .sum-row.remaining strong { color: #ef4444; font-size: 1rem; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .req { color: #ef4444; }

    .amount-input-wrap {
      position: relative; display: flex; align-items: center;
    }
    .amount-input-wrap .input { padding-right: 56px; width: 100%; }
    .currency-tag {
      position: absolute; right: 12px;
      font-size: 0.85rem; font-weight: 600; color: #64748b;
    }

    .input {
      padding: 10px 12px; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 0.95rem; width: 100%;
      outline: none; transition: border-color 0.2s; box-sizing: border-box;
    }
    .input:focus { border-color: #3b82f6; }

    .field-error { font-size: 0.8rem; color: #ef4444; margin: 0; }
    .server-error {
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; padding: 12px; font-size: 0.875rem; color: #dc2626;
    }

    .btn-primary {
      padding: 10px 20px; background: #3b82f6; color: white;
      border: none; border-radius: 8px; font-size: 0.9rem;
      font-weight: 500; cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      padding: 10px 20px; background: white; color: #64748b;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary:hover:not(:disabled) { background: #f8fafc; }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class PaymentModalComponent implements OnInit {

  // When used inline in forms (no reservationId yet — payment sent with request)
  @Input() inlineMode = false;

  // When used in detail page (payment recorded against existing reservation)
  @Input() summary?: PaymentSummary;
  @Input() currency = 'TND';

  @Output() closed = new EventEmitter<void>();

  // Inline mode: emits the PaymentRequest to include in ReservationRequest
  @Output() paymentConfirmed = new EventEmitter<PaymentRequest>();

  form!: FormGroup;
  isSubmitting = false;
  serverError: string | null = null;

  paymentMethods: { value: PaymentMethod; label: string }[] = Object.entries(PAYMENT_METHOD_LABELS)
    .map(([value, label]) => ({ value: value as PaymentMethod, label }));

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      amount:        [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['',   Validators.required],
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: PaymentRequest = {
      amount:        this.form.value.amount,
      paymentMethod: this.form.value.paymentMethod,
      currency:      this.currency,
    };

    // Always emit — parent decides what to do with it
    // In inline mode: parent adds it to ReservationRequest.initialPayment
    // In detail mode: parent calls reservationService.recordPayment()
    this.paymentConfirmed.emit(request);
  }

  // Called by parent to show server error without closing modal
  setError(message: string): void {
    this.serverError = message;
    this.isSubmitting = false;
  }

  // Called by parent to set loading state
  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }
}