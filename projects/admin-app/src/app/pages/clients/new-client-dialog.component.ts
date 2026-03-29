import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../../../shared/src/lib/auth/auth.service';
import { RegisterRequest } from '../../../../../shared/src/lib/auth/auth.models';
import { UserResponse } from '../../../../../shared/src/models/user.model';

// Default password sent for all admin-created accounts.
// TODO: replace with random generation + email delivery.
const DEFAULT_PASSWORD = 'Camping2025!';

@Component({
  selector: 'app-new-client-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './new-client-dialog.component.html',
  styleUrls: ['./new-client-dialog.component.scss'],
})
export class NewClientDialogComponent implements OnInit {

  form!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  // Controls whether the taxId field is shown (PARTENAIRE only)
  get isPartenaire(): boolean {
    return this.form?.get('role')?.value === 'PARTENAIRE';
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<NewClientDialogComponent>
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:   ['', [Validators.required, Validators.minLength(2)]],
      email:  ['', [Validators.required, Validators.email]],
      phone:  ['', Validators.required],
      role:   ['CLIENT', Validators.required],  // CLIENT | PARTENAIRE
      taxId:  [''],                              // only relevant when role = PARTENAIRE
    });

    // Clear taxId when role switches away from PARTENAIRE
    this.form.get('role')!.valueChanges.subscribe(role => {
      if (role !== 'PARTENAIRE') {
        this.form.get('taxId')!.setValue('');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const fv = this.form.value;

    const request: RegisterRequest = {
      name:     fv.name.trim(),
      email:    fv.email.trim().toLowerCase(),
      password: DEFAULT_PASSWORD,          // hardcoded for now
      phone:    fv.phone.trim(),
      role:     fv.role,                   // 'CLIENT' or 'PARTENAIRE'
      taxId:    fv.role === 'PARTENAIRE' && fv.taxId?.trim()
                  ? fv.taxId.trim()
                  : undefined,
    };

    this.authService.register(request).subscribe({
      next: (createdUser: any) => {
        // Backend returns the User entity — shape: { userId, name, email, ... }
        // We return a UserResponse-compatible object to the parent so it can
        // immediately set clientId = userId without waiting for the dropdown reload.
        const result: UserResponse = {
          userId: createdUser.userId,
          name:   createdUser.name,
          email:  createdUser.email,
          phone:  createdUser.phone,
          role:   createdUser.role,
        };
        this.isSubmitting = false;
        this.dialogRef.close(result);   // ← parent receives UserResponse
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error?.error   ||
          'Erreur lors de la création du compte. Vérifiez les informations.';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  // ── Field-level error helpers used by the template ──────────────────────────

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required'])   return 'Ce champ est obligatoire.';
    if (ctrl.errors['email'])      return 'Adresse e-mail invalide.';
    if (ctrl.errors['minlength'])  return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }
}