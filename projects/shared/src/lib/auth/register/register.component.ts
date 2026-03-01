import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { RegisterRequest } from '../auth.models';

@Component({
    selector: 'lib-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    registerForm!: FormGroup;
    isLoading = false;
    errorMessage = '';
    successMessage = '';
    showPassword = false;
    showConfirmPassword = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
            phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s\-().]{7,20}$/)]],
            taxId: [''],
            commissionRate: [null, [Validators.min(0), Validators.max(100)]]
        }, { validators: this._passwordMatchValidator });
    }

    get name() { return this.registerForm.get('name'); }
    get email() { return this.registerForm.get('email'); }
    get password() { return this.registerForm.get('password'); }
    get confirmPassword() { return this.registerForm.get('confirmPassword'); }
    get phone() { return this.registerForm.get('phone'); }
    get taxId() { return this.registerForm.get('taxId'); }
    get commissionRate() { return this.registerForm.get('commissionRate'); }

    togglePassword(): void { this.showPassword = !this.showPassword; }
    toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

    private _passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
        const pw = group.get('password')?.value;
        const cpw = group.get('confirmPassword')?.value;
        return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
    }

    onSubmit(): void {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const formValue = this.registerForm.value;

        const payload: RegisterRequest = {
            name: formValue.name,
            email: formValue.email,
            password: formValue.password,
            phone: formValue.phone,
            role: 'PARTENAIRE',   // Always hardcoded — user cannot change this
            taxId: formValue.taxId || undefined,
            commissionRate: formValue.commissionRate ?? undefined
        };

        this.authService.register(payload).subscribe({
            next: () => {
                this.isLoading = false;
                this.successMessage = 'Account created! Redirecting to login…';
                setTimeout(() => this.router.navigate(['/login']), 1500);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err?.error?.message ?? 'Registration failed. Please try again.';
            }
        });
    }
}
