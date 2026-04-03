// admin/src/app/pages/clients/clients.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { CreateUserRequest, UpdateUserRequest, UserResponse, UserRole } from '../../../../../shared/src/models/user.model';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'],
})
export class ClientsComponent implements OnInit {

  // ── Data ─────────────────────────────────────────────────────────────────
  allUsers:        UserResponse[] = [];
  filteredUsers:   UserResponse[] = [];
  pagedUsers:      UserResponse[] = [];

  // ── UI state ─────────────────────────────────────────────────────────────
  isLoading    = true;
  searchTerm   = '';
  typeFilter: 'all' | 'CLIENT' | 'PARTENAIRE' = 'all';

  // ── Pagination ───────────────────────────────────────────────────────────
  currentPage  = 1;
  itemsPerPage = 10;
  totalPages   = 1;

  // ── Modal ─────────────────────────────────────────────────────────────────
  showModal      = false;
  isEditMode     = false;
  editingUserId  = '';
  isSubmitting   = false;
  errorMessage   = '';
  form!: FormGroup;

  get isPartenaire(): boolean {
    return this.form?.get('role')?.value === 'PARTENAIRE';
  }

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadUsers();
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      name:           ['', [Validators.required, Validators.minLength(2)]],
      email:          ['', [Validators.required, Validators.email]],
      phone:          ['', Validators.required],
      role:           ['CLIENT', Validators.required],
      matriculeFiscal:[''],
      agencyAddress:  [''],
    });

    // Clear partner fields when role switches away from PARTENAIRE
    this.form.get('role')!.valueChanges.subscribe(role => {
      if (role !== 'PARTENAIRE') {
        this.form.patchValue({ matriculeFiscal: '', agencyAddress: '' });
      }
    });
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadUsers(): void {
    this.isLoading = true;
    this.userService.fetchAllUsers();
    this.userService.getAllUsers().subscribe(users => {
      // Show only CLIENT and PARTENAIRE roles on this page
      this.allUsers      = users.filter(u => u.role === 'CLIENT' || u.role === 'PARTENAIRE');
      this.isLoading     = false;
      this.applyFilters();
    });
  }

  // ── Filtering & pagination ────────────────────────────────────────────────
  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(u => {
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phone ?? '').includes(term);

      const matchesType =
        this.typeFilter === 'all' ||
        u.role === this.typeFilter;

      return matchesSearch && matchesType;
    });

    this.currentPage = 1;
    this.updatePage();
  }

  updatePage(): void {
    this.totalPages  = Math.max(1, Math.ceil(this.filteredUsers.length / this.itemsPerPage));
    const start      = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedUsers  = this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePage();
    }
  }

  setTypeFilter(type: 'all' | 'CLIENT' | 'PARTENAIRE'): void {
    this.typeFilter = type;
    this.applyFilters();
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  openAddModal(): void {
    this.isEditMode    = false;
    this.editingUserId = '';
    this.errorMessage  = '';
    this.form.reset({ role: 'CLIENT' });
    this.showModal     = true;
  }

  openEditModal(user: UserResponse): void {
    this.isEditMode    = true;
    this.editingUserId = user.userId;
    this.errorMessage  = '';
    this.form.patchValue({
      name:            user.name,
      email:           user.email,
      phone:           user.phone ?? '',
      role:            user.role,
      matriculeFiscal: user.matriculeFiscal ?? '',
      agencyAddress:   user.agencyAddress   ?? '',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal    = false;
    this.errorMessage = '';
  }

  // ── Submit: create or update ──────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSubmitting = true;
    this.errorMessage = '';
    const fv = this.form.value;

    if (this.isEditMode) {
      const request: UpdateUserRequest = {
        name:            fv.name.trim(),
        email:           fv.email.trim().toLowerCase(),
        phone:           fv.phone.trim(),
        role:            fv.role,
        matriculeFiscal: fv.role === 'PARTENAIRE' ? (fv.matriculeFiscal?.trim() || undefined) : undefined,
        agencyAddress:   fv.role === 'PARTENAIRE' ? (fv.agencyAddress?.trim()   || undefined) : undefined,
      };
      this.userService.updateUser(this.editingUserId, request).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); },
        error: err => {
          this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.';
          this.isSubmitting = false;
        },
      });
    } else {
      const request: CreateUserRequest = {
        name:            fv.name.trim(),
        email:           fv.email.trim().toLowerCase(),
        phone:           fv.phone.trim(),
        role:            fv.role,
        matriculeFiscal: fv.role === 'PARTENAIRE' ? (fv.matriculeFiscal?.trim() || undefined) : undefined,
        agencyAddress:   fv.role === 'PARTENAIRE' ? (fv.agencyAddress?.trim()   || undefined) : undefined,
      };
      this.userService.addUser(request).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); },
        error: err => {
          this.errorMessage = err?.error?.message || 'Erreur lors de la création du compte.';
          this.isSubmitting = false;
        },
      });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteUser(user: UserResponse): void {
    const label = user.role === 'PARTENAIRE' ? `le partenaire "${user.name}"` : `le client "${user.name}"`;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${label} ? Cette action est irréversible.`)) return;

    this.userService.deleteUser(user.userId).subscribe({
      error: err => alert(err?.error?.message || 'Erreur lors de la suppression.'),
    });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  getRoleLabel(role: UserRole): string {
    return role === 'PARTENAIRE' ? 'Partenaire' : 'Passagère';
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])  return 'Ce champ est obligatoire.';
    if (c.errors['email'])     return 'Adresse e-mail invalide.';
    if (c.errors['minlength']) return `Minimum ${c.errors['minlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }
}