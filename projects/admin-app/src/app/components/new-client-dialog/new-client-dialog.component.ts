import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/admin.models';

@Component({
    selector: 'app-new-client-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatSnackBarModule
    ],
    template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">
          <span class="plus-icon">➕</span> Nouveau Client
        </h2>
        <button class="close-button" (click)="close()">✕</button>
      </div>

      <form [formGroup]="clientForm" (ngSubmit)="onSubmit()">
        <div class="form-content">
          <!-- Nom -->
          <div class="form-field">
            <label class="field-label">Nom</label>
            <input
              type="text"
              class="field-input"
              formControlName="nom"
              placeholder="Nom du client">
            <div class="error-message" *ngIf="clientForm.get('nom')?.invalid && clientForm.get('nom')?.touched">
              Le nom est requis
            </div>
          </div>

          <!-- Adresse -->
          <div class="form-field">
            <label class="field-label">Adresse</label>
            <input
              type="text"
              class="field-input"
              formControlName="adresse"
              placeholder="Adresse complète">
            <div class="error-message" *ngIf="clientForm.get('adresse')?.invalid && clientForm.get('adresse')?.touched">
              L'adresse est requise
            </div>
          </div>

          <!-- Téléphone -->
          <div class="form-field">
            <label class="field-label">Téléphone</label>
            <input
              type="tel"
              class="field-input"
              formControlName="telephone"
              placeholder="+216 XX XXX XXX">
            <div class="error-message" *ngIf="clientForm.get('telephone')?.invalid && clientForm.get('telephone')?.touched">
              Le téléphone est requis
            </div>
          </div>

          <!-- Email -->
          <div class="form-field">
            <label class="field-label">Email</label>
            <input
              type="email"
              class="field-input"
              formControlName="email"
              placeholder="email@example.com">
            <div class="error-message" *ngIf="clientForm.get('email')?.invalid && clientForm.get('email')?.touched">
              <span *ngIf="clientForm.get('email')?.hasError('required')">L'email est requis</span>
              <span *ngIf="clientForm.get('email')?.hasError('email')">Email invalide</span>
            </div>
          </div>

          <!-- Matricule Fiscale -->
          <div class="form-field">
            <label class="field-label">Matricule Fiscale</label>
            <input
              type="text"
              class="field-input"
              formControlName="matriculeFiscale"
              placeholder="Optionnel">
          </div>

          <!-- Type -->
          <div class="form-field">
            <label class="field-label">Type</label>
            <select class="field-select" formControlName="type">
              <option value="Passagère">Passagère</option>
              <option value="Partenaire">Partenaire</option>
            </select>
            <div class="error-message" *ngIf="clientForm.get('type')?.invalid && clientForm.get('type')?.touched">
              Le type est requis
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button
            type="submit"
            class="submit-button"
            [disabled]="clientForm.invalid || isSubmitting">
            <span *ngIf="!isSubmitting">Ajouter</span>
            <span *ngIf="isSubmitting">Ajout en cours...</span>
          </button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .dialog-container {
      max-width: 600px;
      width: 100%;
      background: white;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .plus-icon {
      color: #8b5cf6;
      font-size: 1.5rem;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      background: #f1f5f9;
      color: #64748b;
    }

    .form-content {
      padding: 24px;
      max-height: 500px;
      overflow-y: auto;
    }

    .form-field {
      margin-bottom: 20px;
    }

    .field-label {
      display: block;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .field-input,
    .field-select {
      width: 100%;
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

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 6px;
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
    }

    .submit-button {
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 32px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 120px;
    }

    .submit-button:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .submit-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .dialog-container {
        max-width: 100%;
      }

      .form-content {
        padding: 16px;
      }
    }
  `]
})
export class NewClientDialogComponent {
    clientForm: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private clientService: ClientService,
        private dialogRef: MatDialogRef<NewClientDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.clientForm = this.fb.group({
            nom: ['', Validators.required],
            adresse: ['', Validators.required],
            telephone: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            matriculeFiscale: [''],
            type: ['Passagère', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.clientForm.valid) {
            this.isSubmitting = true;
            const clientData = this.clientForm.value;

            this.clientService.createClient(clientData).subscribe({
                next: (newClient) => {
                    this.snackBar.open('Client ajouté avec succès!', 'Fermer', {
                        duration: 3000,
                        horizontalPosition: 'end',
                        verticalPosition: 'top',
                        panelClass: ['success-snackbar']
                    });
                    this.dialogRef.close(newClient);
                },
                error: (error) => {
                    this.snackBar.open('Erreur lors de l\'ajout du client', 'Fermer', {
                        duration: 3000,
                        horizontalPosition: 'end',
                        verticalPosition: 'top',
                        panelClass: ['error-snackbar']
                    });
                    this.isSubmitting = false;
                }
            });
        } else {
            Object.keys(this.clientForm.controls).forEach(key => {
                this.clientForm.get(key)?.markAsTouched();
            });
        }
    }

    close(): void {
        this.dialogRef.close();
    }
}
