// admin/src/app/pages/produits/sourcesList/source-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SourceService, SourceRequest } from '../../../core/services/source.service';
import { SourceResponse } from '../../../../../../shared/src/models/reservation-api.model';

@Component({
  selector: 'app-source-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-list.component.html',
  styleUrls: ['./source-list.component.scss']
})
export class SourceListComponent implements OnInit {

  items: SourceResponse[] = [];
  filteredItems: SourceResponse[] = [];
  paginatedItems: SourceResponse[] = [];

  loading  = false;
  saving   = false;
  errorMessage = '';
  formError    = '';
  searchTerm   = '';
  showModal    = false;
  editingId: string | null = null;

  currentPage  = 1;
  itemsPerPage = 10;
  totalPages   = 1;

  form: SourceRequest = { name: '' };

  constructor(private sourceService: SourceService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.sourceService.getAll().subscribe({
      next: data => {
        this.items = data;
        this.filterItems();
        this.loading = false;
      },
      error: err => {
        this.errorMessage = 'Impossible de charger les sources. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterItems(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.items.filter(i =>
      i.name.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.itemsPerPage));
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedItems = this.filteredItems.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openAddModal(): void {
    this.editingId = null;
    this.form = { name: '' };
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(item: SourceResponse): void {
    this.editingId = item.sourceId;
    this.form = { name: item.name };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.formError = '';
  }

  saveItem(): void {
    if (!this.form.name?.trim()) {
      this.formError = 'Le nom est obligatoire.';
      return;
    }

    this.saving = true;
    this.formError = '';

    const request$ = this.editingId
      ? this.sourceService.update(this.editingId, this.form)
      : this.sourceService.create(this.form);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadItems();
      },
      error: err => {
        this.saving = false;
        this.formError = err?.error?.message ?? 'Une erreur est survenue.';
        console.error(err);
      }
    });
  }

  deleteItem(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette source ?')) return;
    this.sourceService.delete(id).subscribe({
      next: () => this.loadItems(),
      error: err => {
        this.errorMessage = 'Erreur lors de la suppression.';
        console.error(err);
      }
    });
  }
}