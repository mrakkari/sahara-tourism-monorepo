import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TourType } from '../../../../../../shared/src/models/tour-type.model';
import { ProduitService, TourTypeRequest } from '../../../core/services/produit.service';

@Component({
  selector: 'app-hebergement-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './hebergement-list.component.html',
  styleUrls: ['./hebergement-list.component.scss']
})
export class HebergementListComponent implements OnInit {

  items: TourType[] = [];
  filteredItems: TourType[] = [];
  paginatedItems: TourType[] = [];
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

  form: TourTypeRequest = this.emptyForm();

  constructor(private produitService: ProduitService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.items = data;
        this.filterItems();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les hébergements. Veuillez réessayer.';
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

  openEditModal(item: TourType): void {
    this.editingId = item.tourTypeId;
    this.form = {
      name: item.name,
      description: item.description ?? '',
      duration: item.duration ?? '',
      passengerAdultPrice: item.passengerAdultPrice,
      passengerChildPrice: item.passengerChildPrice,
      partnerAdultPrice: item.partnerAdultPrice,
      partnerChildPrice: item.partnerChildPrice,
    };
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
    if (
      this.form.passengerAdultPrice == null || this.form.passengerAdultPrice < 0 ||
      this.form.passengerChildPrice == null || this.form.passengerChildPrice < 0 ||
      this.form.partnerAdultPrice   == null || this.form.partnerAdultPrice   < 0 ||
      this.form.partnerChildPrice   == null || this.form.partnerChildPrice   < 0
    ) {
      this.formError = 'Tous les prix sont obligatoires et doivent être positifs.';
      return;
    }

    this.saving = true;
    this.formError = '';

    const request$ = this.editingId
      ? this.produitService.update(this.editingId, this.form)
      : this.produitService.create(this.form);

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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hébergement ?')) return;
    this.produitService.delete(id).subscribe({
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

  private emptyForm(): TourTypeRequest {
    return {
      name: '',
      description: '',
      duration: '',
      passengerAdultPrice: 0,
      passengerChildPrice: 0,
      partnerAdultPrice: 0,
      partnerChildPrice: 0,
    };
  }
}