import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'lib-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    loginForm!: FormGroup;
    isLoading = false;
    errorMessage = '';
    showPassword = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // If already logged in, redirect
        if (this.authService.isLoggedIn()) {
            this._redirectByRole(this.authService.getRole() ?? '');
            return;
        }

        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    get email() { return this.loginForm.get('email'); }
    get password() { return this.loginForm.get('password'); }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.authService.login(this.loginForm.value).subscribe({
            next: () => {
                this.isLoading = false;
                const role = this.authService.getRole() ?? '';
                this._redirectByRole(role);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err?.error?.message ?? 'Invalid credentials. Please try again.';
            }
        });
    }

    private _redirectByRole(role: string): void {
        switch (role.toUpperCase()) {
            case 'PARTENAIRE': this.router.navigate(['/partenaire-app']); break;
            case 'ADMIN': this.router.navigate(['/admin-app']); break;
            case 'CAMPING': this.router.navigate(['/camping-app']); break;
            default: this.router.navigate(['/']); break;
        }
    }
}
