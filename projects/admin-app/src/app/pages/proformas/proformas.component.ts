// admin/src/app/pages/proformas/proformas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../../../../shared/src/services/reservation.service';
import { ProformaResponse } from '../../../../../shared/src/models/proforma.model';

@Component({
  selector: 'app-proformas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1 class="page-title">📋 Liste des Proformas</h1>
    <span class="total-badge">{{ filteredProformas.length }} proforma(s)</span>
  </div>

  <!-- Loading -->
  <div class="loading-state" *ngIf="isLoading">
    <div class="spinner"></div>
    <p>Chargement des proformas...</p>
  </div>

  <!-- Error -->
  <div class="error-state" *ngIf="error && !isLoading">
    <p>⚠️ {{ error }}</p>
    <button (click)="loadProformas()" class="btn-retry">Réessayer</button>
  </div>

  <ng-container *ngIf="!isLoading && !error">

    <!-- Filters -->
    <div class="filters-section">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher par client ou numéro..."
          [(ngModel)]="searchTerm"
          (input)="applyFilters()"
          class="search-input"
        />
      </div>

      <select class="select-input" [(ngModel)]="statusFilter" (change)="applyFilters()">
        <option value="">Tous les statuts</option>
        <option value="UNPAID">Non payé</option>
        <option value="PARTIALLY_PAID">Partiellement payé</option>
        <option value="PAID">Payé</option>
      </select>

      <input type="date" [(ngModel)]="startDate" (change)="applyFilters()" class="date-input" placeholder="Date début"/>
      <input type="date" [(ngModel)]="endDate"   (change)="applyFilters()" class="date-input" placeholder="Date fin"/>
    </div>

    <!-- Table -->
    <div class="content-card">
      <table class="proformas-table">
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Date</th>
            <th>Client</th>
            <th>Total TTC</th>
            <th>Payé</th>
            <th>Reste</th>
            <th>Statut paiement</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of paginatedProformas">
            <td class="mono">{{ p.invoiceNumber }}</td>
            <td>{{ formatDate(p.invoiceDate) }}</td>
            <td>{{ getUserName(p) }}</td>
            <td>{{ p.totalAmount | number:'1.2-2' }} TND</td>
            <td class="paid-cell">{{ p.paidAmount | number:'1.2-2' }} TND</td>
            <td class="remaining-cell" [class.zero]="p.remainingAmount <= 0">
              {{ p.remainingAmount | number:'1.2-2' }} TND
            </td>
            <td>
              <span class="pay-badge" [ngClass]="p.paymentStatus.toLowerCase()">
                {{ paymentStatusLabel(p.paymentStatus) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-voir" (click)="viewProforma(p)">Voir</button>
                <a class="btn-resa" [routerLink]="['/reservation', p.reservationId]">
                  Réservation
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="no-results" *ngIf="filteredProformas.length === 0">
        <p>Aucune proforma trouvée.</p>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredProformas.length > 0">
        <button class="pagination-btn" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">
          ← Précédent
        </button>
        <div class="pagination-info">
          <span>Page {{ currentPage }} sur {{ totalPages }}</span>
          <span class="separator">|</span>
          <span>{{ filteredProformas.length }} résultats</span>
        </div>
        <button class="pagination-btn" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">
          Suivant →
        </button>
      </div>
    </div>

  </ng-container>

  <!-- ── Proforma Detail Modal ─────────────────────────────────── -->
  <div *ngIf="selectedProforma" class="modal-overlay" (click)="closeModal()">
    <div class="modal-content" (click)="$event.stopPropagation()">
      <button class="close-btn" (click)="closeModal()">✕</button>

      <div class="invoice-preview">
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <div class="logo-circle">🏕️</div>
            <div class="logo-text">Les Dunes Insolites</div>
          </div>
          <div class="company-details">
            <h3>Campement Dunes Insolites</h3>
            <p>Sabria, El Faouar – Kébili</p>
            <p>M.F : 1710104/R</p>
            <p>Tél : 75 461 016 – GSM : 27 391 501</p>
            <p>✉ dunesinsolites&#64;gmail.com</p>
          </div>
          <div class="invoice-date">
            <strong>Date :</strong> {{ formatDate(selectedProforma.invoiceDate) }}
          </div>
        </div>

        <h1 class="invoice-title">{{ selectedProforma.invoiceNumber.toUpperCase() }}</h1>

        <!-- Line items -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th>DÉSIGNATION</th>
              <th>QTÉ</th>
              <th>PRIX UNITAIRE</th>
              <th>MONTANT TTC</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of selectedProforma.items">
              <td>{{ item.description }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | number:'1.2-2' }} TND</td>
              <td>{{ item.totalPrice | number:'1.2-2' }} TND</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td><strong>Total TTC</strong></td>
              <td>{{ selectedProforma.totalAmount | number:'1.2-2' }} TND</td>
            </tr>
            <tr>
              <td><strong>Payé</strong></td>
              <td class="paid-cell">{{ selectedProforma.paidAmount | number:'1.2-2' }} TND</td>
            </tr>
            <tr class="total-row">
              <td><strong>Reste à payer</strong></td>
              <td><strong>{{ selectedProforma.remainingAmount | number:'1.2-2' }} TND</strong></td>
            </tr>
          </table>
        </div>

        <!-- Payment status -->
        <div class="proforma-status-row">
          <span>Statut paiement :</span>
          <span class="pay-badge" [ngClass]="selectedProforma.paymentStatus.toLowerCase()">
            {{ paymentStatusLabel(selectedProforma.paymentStatus) }}
          </span>
        </div>

        <!-- Footer -->
        <div class="invoice-footer">
          DUNES INSOLITES - EL FAOUAR 4264 KEBILI TUNISIE - TEL/FAX : 75 461 016
        </div>
      </div>

      <!-- Modal actions -->
      <div class="modal-actions">
        <button class="btn-print" (click)="printInvoice()">🖨️ Imprimer</button>
        <a class="btn-resa-link" [routerLink]="['/reservation', selectedProforma.reservationId]" (click)="closeModal()">
          🔗 Voir la réservation
        </a>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 600; color: #1e293b; margin: 0; }
    .total-badge {
      background: #f1f5f9; color: #475569; padding: 4px 12px;
      border-radius: 20px; font-size: 0.85rem; font-weight: 500;
    }

    .loading-state, .error-state {
      text-align: center; padding: 60px; color: #64748b;
    }
    .spinner {
      width: 40px; height: 40px; border: 4px solid #e2e8f0;
      border-top-color: #3b82f6; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-retry {
      padding: 8px 20px; background: #3b82f6; color: white;
      border: none; border-radius: 8px; cursor: pointer; margin-top: 12px;
    }

    .filters-section { display: flex; gap: 12px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; }
    .search-box { position: relative; flex: 1; min-width: 200px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); }
    .search-input {
      width: 100%; padding: 10px 12px 10px 36px;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
      outline: none; box-sizing: border-box;
    }
    .search-input:focus { border-color: #3b82f6; }
    .select-input, .date-input {
      padding: 10px 12px; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 0.9rem; outline: none;
    }
    .select-input:focus, .date-input:focus { border-color: #3b82f6; }

    .content-card {
      background: white; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;
    }
    .proformas-table { width: 100%; border-collapse: collapse; }
    .proformas-table thead { background: #fef3c7; }
    .proformas-table th {
      padding: 14px 16px; text-align: left;
      font-weight: 600; color: #1e293b; font-size: 0.875rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .proformas-table td {
      padding: 12px 16px; color: #475569;
      font-size: 0.875rem; border-bottom: 1px solid #f1f5f9;
    }
    .proformas-table tbody tr:hover { background: #f8fafc; }
    .mono { font-family: monospace; font-size: 0.8rem; }
    .paid-cell { color: #10b981; font-weight: 500; }
    .remaining-cell { color: #ef4444; font-weight: 500; }
    .remaining-cell.zero { color: #10b981; }

    .pay-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .pay-badge.unpaid          { background: #fee2e2; color: #dc2626; }
    .pay-badge.partially_paid  { background: #fef9c3; color: #ca8a04; }
    .pay-badge.paid            { background: #dcfce7; color: #16a34a; }

    .action-buttons { display: flex; gap: 8px; }
    .btn-voir, .btn-resa {
      padding: 5px 12px; border-radius: 6px; font-size: 0.8rem;
      font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none;
    }
    .btn-voir {
      background: white; color: #3b82f6; border: 1px solid #3b82f6;
    }
    .btn-voir:hover { background: #3b82f6; color: white; }
    .btn-resa {
      background: white; color: #8b5cf6; border: 1px solid #8b5cf6;
      display: flex; align-items: center;
    }
    .btn-resa:hover { background: #8b5cf6; color: white; }

    .no-results { padding: 48px; text-align: center; color: #64748b; }
    .pagination {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-top: 1px solid #e2e8f0;
    }
    .pagination-btn {
      padding: 8px 16px; background: white; color: #3b82f6;
      border: 1px solid #3b82f6; border-radius: 6px; cursor: pointer;
    }
    .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; border-color: #e2e8f0; color: #94a3b8; }
    .pagination-info { display: flex; gap: 12px; color: #64748b; font-size: 0.875rem; }
    .separator { color: #cbd5e1; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
    }
    .modal-content {
      background: white; border-radius: 12px;
      max-width: 800px; width: 100%; max-height: 90vh;
      overflow-y: auto; position: relative;
    }
    .close-btn {
      position: absolute; top: 16px; right: 16px;
      background: #f1f5f9; border: none; width: 32px; height: 32px;
      border-radius: 50%; cursor: pointer; font-size: 1rem; z-index: 10;
    }
    .invoice-preview { padding: 40px; }
    .invoice-header {
      display: grid; grid-template-columns: 1fr 2fr 1fr;
      gap: 20px; margin-bottom: 30px; align-items: start;
    }
    .logo-circle {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 1.75rem;
    }
    .logo-text { font-size: 0.85rem; font-weight: 600; color: #1e293b; margin-top: 8px; }
    .company-details { text-align: center; }
    .company-details h3 { margin: 0 0 6px; font-size: 1rem; }
    .company-details p { margin: 3px 0; font-size: 0.8rem; color: #475569; }
    .invoice-date { text-align: right; font-size: 0.875rem; }
    .invoice-title { text-align: center; font-size: 1.75rem; font-weight: 700; margin: 24px 0; }
    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .invoice-table th, .invoice-table td {
      padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 0.875rem;
    }
    .invoice-table thead { background: #fef3c7; }
    .invoice-table th { font-weight: 600; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .totals-table { width: 320px; border-collapse: collapse; }
    .totals-table td { padding: 8px 14px; border: 1px solid #e5e7eb; font-size: 0.875rem; }
    .totals-table .total-row { background: #f9fafb; }
    .proforma-status-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 24px;
      font-size: 0.875rem; color: #475569;
    }
    .invoice-footer {
      text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;
      font-size: 0.75rem; color: #64748b; margin-top: 24px;
    }
    .modal-actions {
      display: flex; gap: 12px; justify-content: center;
      padding: 16px 40px; border-top: 2px solid #e5e7eb;
      background: #f9fafb; position: sticky; bottom: 0;
    }
    .btn-print {
      padding: 10px 24px; background: #3b82f6; color: white;
      border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer;
    }
    .btn-resa-link {
      padding: 10px 24px; background: #8b5cf6; color: white;
      border-radius: 8px; font-size: 0.9rem; text-decoration: none;
      display: flex; align-items: center; gap: 6px;
    }
  `]
})
export class ProformasComponent implements OnInit {

  proformas: ProformaResponse[]         = [];
  filteredProformas: ProformaResponse[] = [];
  paginatedProformas: ProformaResponse[] = [];

  selectedProforma: ProformaResponse | null = null;

  searchTerm   = '';
  statusFilter = '';
  startDate    = '';
  endDate      = '';

  isLoading = true;
  error: string | null = null;

  currentPage  = 1;
  itemsPerPage = 10;
  totalPages   = 1;

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.loadProformas();
  }

  loadProformas(): void {
    this.isLoading = true;
    this.error = null;
    this.reservationService.getAllProformas().subscribe({
      next: data => {
        // Sort newest first
        this.proformas = data.sort((a, b) =>
          new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: err => {
        console.error('Failed to load proformas:', err);
        this.error = 'Impossible de charger les proformas.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const term   = this.searchTerm.toLowerCase();
    const start  = this.startDate ? new Date(this.startDate) : null;
    const end    = this.endDate   ? new Date(this.endDate)   : null;

    this.filteredProformas = this.proformas.filter(p => {
      const matchesTerm = !term
        || p.invoiceNumber.toLowerCase().includes(term);

      const matchesStatus = !this.statusFilter
        || p.paymentStatus === this.statusFilter;

      const date = new Date(p.invoiceDate);
      const matchesDate = (!start || date >= start) && (!end || date <= end);

      return matchesTerm && matchesStatus && matchesDate;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredProformas.length / this.itemsPerPage));
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedProformas = this.filteredProformas.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  viewProforma(p: ProformaResponse): void { this.selectedProforma = p; }
  closeModal(): void { this.selectedProforma = null; }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  paymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      UNPAID: 'Non payé', PARTIALLY_PAID: 'Part. payé', PAID: 'Payé',
      OVERDUE: 'En retard', REFUNDED: 'Remboursé',
    };
    return map[status] ?? status;
  }

  // Backend doesn't return userName in invoice — show invoiceNumber as fallback
  // When you add user info to InvoiceResponse on backend, map it here
  getUserName(p: ProformaResponse): string {
    return `Client #${p.userId.slice(0, 8).toUpperCase()}`;
  }

  printInvoice(): void {
    window.print();
  }
}