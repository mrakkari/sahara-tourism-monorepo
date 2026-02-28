import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Prestation {
  id: number;
  designation: string;
  prixPartenaire: number;
  prixPassagere: number;
}

@Component({
    selector: 'app-produits',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">⛺ Liste des Prestations</h1>
          </div>
          <button class="btn-add" (click)="openAddModal()">
            ➕ Ajouter
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher par désignation..."
            [(ngModel)]="searchTerm"
            (input)="filterPrestations()"
            class="search-input"
          />
        </div>
      </div>

      <!-- Prestations Table -->
      <div class="content-card">
        <table class="prestations-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Prix Partenaire</th>
              <th>Prix Passagère</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let prestation of paginatedPrestations">
              <td><strong>{{ prestation.designation }}</strong></td>
              <td>{{ formatPrice(prestation.prixPartenaire) }}</td>
              <td>{{ formatPrice(prestation.prixPassagere) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-edit" (click)="editPrestation(prestation)">✏️</button>
                  <button class="btn-delete" (click)="deletePrestation(prestation.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="filteredPrestations.length === 0" class="no-results">
          <p>Aucune prestation trouvée</p>
        </div>

        <!-- Pagination -->
        <div *ngIf="filteredPrestations.length > 0" class="pagination">
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
          >
            ← Précédent
          </button>
          
          <div class="pagination-info">
            <span>Page {{ currentPage }} sur {{ totalPages }}</span>
            <span class="separator">|</span>
            <span>{{ filteredPrestations.length }} prestations</span>
          </div>
          
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)"
          >
            Suivant →
          </button>
        </div>
      </div>

      <!-- Add/Edit Prestation Modal -->
      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ newPrestation.id ? '✏️ Modifier Prestation' : '➕ Nouvelle Prestation' }}</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form class="prestation-form" (ngSubmit)="savePrestation()">
            <div class="form-group">
              <label>Désignation</label>
              <input 
                type="text" 
                [(ngModel)]="newPrestation.designation"
                name="designation"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label>Prix Partenaire</label>
              <input 
                type="number" 
                [(ngModel)]="newPrestation.prixPartenaire"
                name="prixPartenaire"
                class="form-control"
                step="0.01"
                required
              />
            </div>

            <div class="form-group">
              <label>Prix Passagère</label>
              <input 
                type="number" 
                [(ngModel)]="newPrestation.prixPassagere"
                name="prixPassagere"
                class="form-control"
                step="0.01"
                required
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModal()">
                Annuler
              </button>
              <button type="submit" class="btn-submit">
                {{ newPrestation.id ? '💾 Enregistrer' : '✅ Ajouter' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .btn-add {
      padding: 12px 24px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-add:hover {
      background: #059669;
    }

    .search-section {
      margin-bottom: 24px;
    }

    .search-box {
      position: relative;
      max-width: 500px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: #3b82f6;
    }

    .content-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .prestations-table {
      width: 100%;
      border-collapse: collapse;
    }

    .prestations-table thead {
      background: #fef3c7;
    }

    .prestations-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .prestations-table td {
      padding: 16px;
      color: #475569;
      font-size: 0.95rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .prestations-table tbody tr:hover {
      background: #f8fafc;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-edit,
    .btn-delete {
      padding: 6px 10px;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-edit {
      background: #dbeafe;
      color: #1e40af;
    }

    .btn-edit:hover {
      background: #bfdbfe;
    }

    .btn-delete {
      background: #fee2e2;
      color: #991b1b;
    }

    .btn-delete:hover {
      background: #fecaca;
    }

    .no-results {
      padding: 48px;
      text-align: center;
      color: #64748b;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .pagination-btn {
      padding: 8px 16px;
      background: white;
      color: #3b82f6;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #3b82f6;
      color: white;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: #e2e8f0;
      color: #94a3b8;
    }

    .pagination-info {
      display: flex;
      gap: 12px;
      align-items: center;
      color: #64748b;
      font-size: 0.9rem;
    }

    .separator {
      color: #cbd5e1;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .close-btn {
      background: #f1f5f9;
      color: #475569;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .prestation-form {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 0.95rem;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      border-color: #3b82f6;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .btn-cancel,
    .btn-submit {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
    }

    .btn-submit {
      background: #10b981;
      color: white;
    }

    .btn-submit:hover {
      background: #059669;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .prestations-table {
        font-size: 0.85rem;
      }

      .prestations-table th,
      .prestations-table td {
        padding: 12px 8px;
      }

      .modal-content {
        margin: 0 16px;
      }
    }
  `]
})
export class ProduitsComponent {
  searchTerm: string = '';
  showModal: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // New prestation form
  newPrestation: Partial<Prestation> = {
    designation: '',
    prixPartenaire: 0,
    prixPassagere: 0
  };

  prestations: Prestation[] = [
    { id: 1, designation: '2 jours', prixPartenaire: 120000, prixPassagere: 120000 },
    { id: 2, designation: '3 jours', prixPartenaire: 120000, prixPassagere: 120000 },
    { id: 3, designation: 'Balade Dromadaire', prixPartenaire: 30000, prixPassagere: 30000 },
    { id: 4, designation: 'Bivouac', prixPartenaire: 160000, prixPassagere: 185000 },
    { id: 5, designation: 'Chauffeur', prixPartenaire: 55000, prixPassagere: 55000 },
    { id: 6, designation: 'DP Gratuité Groupe +25', prixPartenaire: -110000, prixPassagere: -110000 },
    { id: 7, designation: 'Demi Pension', prixPartenaire: 110000, prixPassagere: 160000 },
    { id: 8, designation: 'Demi Pension 1er Enf', prixPartenaire: 55000, prixPassagere: 70000 },
    { id: 9, designation: 'Excursion Ksar Ghilane', prixPartenaire: 180000, prixPassagere: 200000 },
    { id: 10, designation: 'Nuitée Camp Standard', prixPartenaire: 95000, prixPassagere: 110000 },
    { id: 11, designation: 'Nuitée Camp Deluxe', prixPartenaire: 150000, prixPassagere: 175000 },
    { id: 12, designation: 'Pension Complète', prixPartenaire: 140000, prixPassagere: 190000 },
    { id: 13, designation: 'Quad 1h', prixPartenaire: 80000, prixPassagere: 95000 },
    { id: 14, designation: 'Quad 2h', prixPartenaire: 140000, prixPassagere: 160000 },
    { id: 15, designation: 'Transfert Aéroport', prixPartenaire: 75000, prixPassagere: 85000 },
    { id: 16, designation: 'Guide Touristique', prixPartenaire: 90000, prixPassagere: 105000 },
    { id: 17, designation: 'Soirée Animation', prixPartenaire: 45000, prixPassagere: 55000 },
    { id: 18, designation: 'Déjeuner Traditionnel', prixPartenaire: 35000, prixPassagere: 40000 }
  ];

  filteredPrestations: Prestation[] = [...this.prestations];
  paginatedPrestations: Prestation[] = [];

  constructor() {
    this.updatePagination();
  }

  filterPrestations(): void {
    this.filteredPrestations = this.prestations.filter(prestation => {
      return prestation.designation.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPrestations.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPrestations = this.filteredPrestations.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openAddModal(): void {
    this.showModal = true;
    this.newPrestation = {
      designation: '',
      prixPartenaire: 0,
      prixPassagere: 0
    };
  }

  closeModal(): void {
    this.showModal = false;
  }

  savePrestation(): void {
    if (this.newPrestation.designation && this.newPrestation.prixPartenaire !== undefined && this.newPrestation.prixPassagere !== undefined) {
      if (this.newPrestation.id) {
        // Edit existing prestation
        const index = this.prestations.findIndex(p => p.id === this.newPrestation.id);
        if (index !== -1) {
          this.prestations[index] = {
            id: this.newPrestation.id,
            designation: this.newPrestation.designation!,
            prixPartenaire: this.newPrestation.prixPartenaire!,
            prixPassagere: this.newPrestation.prixPassagere!
          };
        }
      } else {
        // Add new prestation
        const prestation: Prestation = {
          id: this.prestations.length + 1,
          designation: this.newPrestation.designation!,
          prixPartenaire: this.newPrestation.prixPartenaire!,
          prixPassagere: this.newPrestation.prixPassagere!
        };
        this.prestations.unshift(prestation);
      }

      this.filterPrestations();
      this.closeModal();
    }
  }

  editPrestation(prestation: Prestation): void {
    this.newPrestation = { ...prestation };
    this.showModal = true;
  }

  deletePrestation(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette prestation?')) {
      this.prestations = this.prestations.filter(p => p.id !== id);
      this.filterPrestations();
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-TN').format(price) + ' DT';
  }
}