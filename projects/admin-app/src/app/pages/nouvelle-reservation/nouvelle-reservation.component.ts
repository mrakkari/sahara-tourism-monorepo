import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/admin.models';
import { NewClientDialogComponent } from '../../components/new-client-dialog/new-client-dialog.component';
import { PARTNER_NAMES, TOUR_TYPES, RESERVATION_SOURCES } from '../../core/constants/business-data.constants';

@Component({
  selector: 'app-nouvelle-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="reservation-page">
      <h1 class="page-title">Nouvelle Réservation</h1>

      <form [formGroup]="reservationForm" (ngSubmit)="onSubmit()" class="reservation-form">
        <!-- Partenaire Selection -->
        <div class="form-field">
          <label class="field-label">Partenaire *</label>
          <select class="field-select" formControlName="partenaire">
            <option value="">-- Sélectionner un partenaire --</option>
            <option *ngFor="let partner of partnerNames" [value]="partner">
              {{ partner }}
            </option>
          </select>
        </div>

        <!-- Tour Type Selection -->
        <div class="form-field">
          <label class="field-label">Type de Tour *</label>
          <select class="field-select" formControlName="tourType">
            <option value="">-- Sélectionner un type de tour --</option>
            <option *ngFor="let tour of tourTypes" [value]="tour">
              {{ tour }}
            </option>
          </select>
        </div>

        <!-- Client Selection Row -->
        <div class="client-row">
          <div class="form-field client-field">
            <label class="field-label">Client *</label>
            <select
              class="field-select"
              formControlName="clientId"
              [class.error]="reservationForm.get('clientId')?.invalid && reservationForm.get('clientId')?.touched">
              <option value="">-- Sélectionner un client --</option>
              <option *ngFor="let client of partenaireClients" [value]="client.id">
                {{ client.nom }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="new-client-btn"
            (click)="openNewClientDialog()">
            Nouveau Client ➕
          </button>
        </div>

        <!-- Date Range -->
        <div class="date-row">
          <div class="form-field">
            <label class="field-label">Date d'arrivée *</label>
            <input
              type="date"
              class="field-input"
              formControlName="checkInDate">
          </div>

          <div class="form-field">
            <label class="field-label">Date de départ *</label>
            <input
              type="date"
              class="field-input"
              formControlName="checkOutDate">
          </div>
        </div>

        <!-- Statut -->
        <div class="form-field">
          <label class="field-label">Statut *</label>
          <select class="field-select" formControlName="status">
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="arrived">Arrivé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        <!-- Source -->
        <div class="form-field">
          <label class="field-label">Source *</label>
          <select class="field-select" formControlName="source">
            <option value="">-- Sélectionner une source --</option>
            <option *ngFor="let source of sources" [value]="source">
              {{ source }}
            </option>
          </select>
        </div>

        <!-- Paiement -->
        <div class="form-field">
          <label class="field-label">Méthode de paiement *</label>
          <select class="field-select" formControlName="paiement">
            <option value="">-- Sélectionner --</option>
            <option value="cash">Espèces</option>
            <option value="card">Carte bancaire</option>
            <option value="transfer">Virement</option>
            <option value="flouci">Flouci</option>
            <option value="onsite">Sur place</option>
          </select>
        </div>

        <!-- Montant -->
        <div class="form-field">
          <label class="field-label">Montant total (TND) *</label>
          <input
            type="number"
            class="field-input"
            formControlName="montant"
            min="0"
            step="0.01"
            placeholder="0.00">
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-btn"
          [disabled]="reservationForm.invalid || isSubmitting">
          <span *ngIf="!isSubmitting">Enregistrer la réservation</span>
          <span *ngIf="isSubmitting">Enregistrement en cours...</span>
        </button>
      </form>
    </div>
  `,
  styles: [`
    .reservation-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    .page-title {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 40px 0;
    }

    .reservation-form {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Client Row */
    .client-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: end;
    }

    .client-field {
      margin: 0 !important;
    }

    .new-client-btn {
      padding: 14px 24px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      height: fit-content;
    }

    .new-client-btn:hover {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    /* Date Row */
    .date-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .date-row .form-field {
      margin: 0 !important;
    }

    /* Form Fields */
    .form-field {
      display: flex;
      flex-direction: column;
    }

    .field-label {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .field-input,
    .field-select {
      padding: 12px 16px;
      font-size: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      transition: all 0.2s;
      font-family: inherit;
    }

    .field-input:focus,
    .field-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .field-select {
      background: white;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      padding-right: 40px;
    }

    .field-select.error {
      border-color: #ef4444;
    }

    /* Submit Button */
    .submit-btn {
      width: 100%;
      padding: 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 16px;
    }

    .submit-btn:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .client-row {
        grid-template-columns: 1fr;
      }

      .date-row {
        grid-template-columns: 1fr;
      }

      .reservation-form {
        padding: 20px;
      }
    }
  `]
})
export class NouvelleReservationComponent implements OnInit {
  reservationForm: FormGroup;
  partenaireClients: Client[] = [];
  isSubmitting = false;

  // Business data from constants
  partnerNames = Array.from(PARTNER_NAMES);
  tourTypes = Array.from(TOUR_TYPES);
  sources = Array.from(RESERVATION_SOURCES);

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.reservationForm = this.fb.group({
      partenaire: ['', Validators.required],
      tourType: ['', Validators.required],
      clientId: ['', Validators.required],
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      status: ['pending', Validators.required],
      source: ['', Validators.required],
      paiement: ['', Validators.required],
      montant: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadPartenaireClients();
  }

  loadPartenaireClients(): void {
    this.clientService.getPartenaireClients().subscribe(clients => {
      this.partenaireClients = clients;
    });
  }

  openNewClientDialog(): void {
    const dialogRef = this.dialog.open(NewClientDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((newClient: Client | undefined) => {
      if (newClient) {
        // Reload partenaire clients
        this.loadPartenaireClients();

        // Auto-select the newly created client
        this.reservationForm.patchValue({
          clientId: newClient.id
        });

        this.snackBar.open(`Client "${newClient.nom}" ajouté et sélectionné!`, 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.reservationForm.valid) {
      this.isSubmitting = true;
      const formValue = this.reservationForm.value;

      console.log('Creating reservation:', formValue);

      // Simulate API call
      setTimeout(() => {
        this.snackBar.open('Réservation créée avec succès!', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        this.isSubmitting = false;
        this.router.navigate(['/reservations']);
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.reservationForm.controls).forEach(key => {
        this.reservationForm.get(key)?.markAsTouched();
      });
    }
  }
}
