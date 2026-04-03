import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExtraResponse } from '../../../../../../shared/src/models/extra.model';
import { ExtraRequest, ProduitService } from '../../../core/services/produit.service';


@Component({
  selector: 'app-extras-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './extras-list.component.html',
  styleUrls: ['./extras-list.component.scss']
})
export class ExtrasListComponent implements OnInit {

  items: ExtraResponse[] = [];
  filteredItems: ExtraResponse[] = [];
  paginatedItems: ExtraResponse[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  formError = '';
  searchTerm = '';
  showModal = false;
  editingId: string | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  form: ExtraRequest = this.emptyForm();

  constructor(private produitService: ProduitService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.produitService.getAllExtras().subscribe({
      next: (data) => {
        this.items = data;
        this.filterItems();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les extras. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterItems(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.items.filter(i => i.name.toLowerCase().includes(term));
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
    this.form = this.emptyForm();
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(item: ExtraResponse): void {
    this.editingId = item.extraId;
    this.form = {
      name: item.name,
      description: item.description ?? '',
      duration: item.duration ?? '',
      unitPrice: item.unitPrice,
      isActive: item.isActive,
    };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.formError = '';
  }

  toggleActive(item: ExtraResponse): void {
    const updated: ExtraRequest = {
      name: item.name,
      description: item.description ?? '',
      duration: item.duration ?? '',
      unitPrice: item.unitPrice,
      isActive: !item.isActive,
    };
    this.produitService.updateExtra(item.extraId, updated).subscribe({
      next: () => this.loadItems(),
      error: (err) => {
        this.errorMessage = 'Erreur lors du changement de statut.';
        console.error(err);
      }
    });
  }

  saveItem(): void {
    if (!this.form.name?.trim()) {
      this.formError = 'Le nom est obligatoire.';
      return;
    }
    if (this.form.unitPrice == null || this.form.unitPrice < 0) {
      this.formError = 'Le prix unitaire est obligatoire et doit être positif.';
      return;
    }

    this.saving = true;
    this.formError = '';

    const request$ = this.editingId
      ? this.produitService.updateExtra(this.editingId, this.form)
      : this.produitService.createExtra(this.form);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadItems();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
        console.error(err);
      }
    });
  }

  deleteItem(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet extra ?')) return;
    this.produitService.deleteExtra(id).subscribe({
      next: () => this.loadItems(),
      error: (err) => {
        this.errorMessage = 'Erreur lors de la suppression.';
        console.error(err);
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price) + ' TND';
  }

  private emptyForm(): ExtraRequest {
    return {
      name: '',
      description: '',
      duration: '',
      unitPrice: 0,
      isActive: true,
    };
  }
}