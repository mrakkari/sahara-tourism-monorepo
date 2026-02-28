import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Proforma {
  id: number;
  date: string;
  numero: string;
  client: string;
  montantTTC: number;
  isConverted: boolean;
}

@Component({
    selector: 'app-proformas',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">📋 Liste des Proformas</h1>
      </div>

      <div class="filters-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher client..."
            [(ngModel)]="searchTerm"
            (input)="filterProformas()"
            class="search-input"
          />
        </div>
        
        <input 
          type="date" 
          [(ngModel)]="startDate"
          placeholder="Date début"
          class="date-input"
        />
        
        <input 
          type="date" 
          [(ngModel)]="endDate"
          placeholder="Date fin"
          class="date-input"
        />
        
        <button class="filter-btn" (click)="applyDateFilter()">Filtrer</button>
      </div>

      <div class="content-card">
        <table class="proformas-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Proforma N°</th>
              <th>Client</th>
              <th>Montant TTC</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let proforma of paginatedProformas">
              <td>{{ proforma.date }}</td>
              <td>{{ proforma.numero }}</td>
              <td>{{ proforma.client }}</td>
              <td>{{ formatMontant(proforma.montantTTC) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-voir" (click)="viewProforma(proforma)">Voir</button>
                  <button 
                    *ngIf="!proforma.isConverted" 
                    class="btn-convertir"
                    (click)="convertToFacture(proforma)"
                  >
                    Convertir
                  </button>
                  <button 
                    *ngIf="proforma.isConverted" 
                    class="btn-converted"
                  >
                    Déjà facturé
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="filteredProformas.length === 0" class="no-results">
          <p>Aucune proforma trouvée pour les critères sélectionnés</p>
        </div>

        <!-- Pagination -->
        <div *ngIf="filteredProformas.length > 0" class="pagination">
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
            <span>{{ filteredProformas.length }} résultats</span>
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

      <!-- Modal pour afficher le détail de la proforma -->
      <div *ngIf="selectedProforma" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="closeModal()">✕</button>
          
          <div class="invoice-preview" #invoiceContent>
            <!-- En-tête -->
            <div class="invoice-header">
              <div class="company-info">
                <div class="logo">
                  <div class="logo-circle">🏕️</div>
                  <div class="logo-text">Les Dunes Insolites</div>
                </div>
              </div>
              <div class="company-details">
                <h3>Campement Dunes Insolites</h3>
                <p>Sabria, El Faouar – Kébili</p>
                <p>M.F : 1710104/R – RIB : 1234 5678 9101</p>
                <p>Tél : 75 461 016 – GSM : 27 391 501</p>
                <p>✉ dunesinsolitesgmail.com</p>
              </div>
              <div class="invoice-date">
                <strong>Date :</strong> {{ getCurrentDate() }}
              </div>
            </div>

            <!-- Titre -->
            <h1 class="invoice-title">{{ selectedProforma.numero.toUpperCase() }}</h1>

            <!-- Info client -->
            <div class="client-info">
              <div><strong>Client :</strong> {{ selectedProforma.client }}</div>
              <div><strong>Adresse :</strong> Djerba</div>
              <div><strong>M.F :</strong> ................ | <strong>Tél :</strong> 23334733</div>
              <div><strong>Email :</strong> {{ getClientEmail(selectedProforma.client) }}</div>
            </div>

            <!-- Tableau des services -->
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>DÉSIGNATION</th>
                  <th>QTÉ</th>
                  <th>PRIX PAX TTC</th>
                  <th>MONTANT TTC</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ selectedProforma.date }}</td>
                  <td>Nuitée Camp DP</td>
                  <td>{{ getQuantity(selectedProforma.montantTTC) }}</td>
                  <td>110.000</td>
                  <td>{{ formatMontant(selectedProforma.montantTTC) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Totaux -->
            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td><strong>Total HT</strong></td>
                  <td>{{ formatMontant(calculateHT(selectedProforma.montantTTC)) }}</td>
                </tr>
                <tr>
                  <td><strong>TVA 7%</strong></td>
                  <td>{{ formatMontant(calculateTVA(selectedProforma.montantTTC)) }}</td>
                </tr>
                <tr>
                  <td><strong>Timbre fiscal</strong></td>
                  <td>1.000 DT</td>
                </tr>
                <tr class="total-row">
                  <td><strong>TOTAL TTC</strong></td>
                  <td><strong>{{ formatMontant(selectedProforma.montantTTC) }}</strong></td>
                </tr>
              </table>
            </div>

            <!-- Texte de clôture -->
            <div class="closing-text">
              <strong>ARRÊTÉ LA PRÉSENTE FACTURE À LA SOMME DE : {{ convertToWords(selectedProforma.montantTTC) }}</strong>
            </div>

            <!-- Signature -->
            <div class="signature-section">
              <p>Signature & Cachet</p>
              <div class="signature-box">
                <p>Campement Dunes Insolites</p>
                <p>M/F: 1710104R</p>
                <p>Sabria / Elfaouar</p>
                <p>Tel: 21 57 54 36</p>
              </div>
            </div>

            <!-- Pied de page -->
            <div class="invoice-footer">
              DUNES INSOLITES - EL FAOUAR 4264 KEBILI TUNISIE - TEL/FAX : 75 461 016 - GSM: 27 391 501 - EMAIL : dunesinsolitesgmail.com
            </div>
          </div>

          <!-- Boutons d'action (fixés en bas) -->
          <div class="modal-actions">
            <button class="btn-print" (click)="printInvoice()">🖨️ Imprimer</button>
            <button class="btn-download" (click)="downloadPDF()">📥 Télécharger PDF</button>
          </div>
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

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filters-section {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: center;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
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

    .date-input {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .date-input:focus {
      border-color: #3b82f6;
    }

    .filter-btn {
      padding: 10px 32px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .filter-btn:hover {
      background: #2563eb;
    }

    .content-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .proformas-table {
      width: 100%;
      border-collapse: collapse;
    }

    .proformas-table thead {
      background: #fef3c7;
    }

    .proformas-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .proformas-table td {
      padding: 16px;
      color: #475569;
      font-size: 0.95rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .proformas-table tbody tr:hover {
      background: #f8fafc;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-voir {
      padding: 6px 16px;
      background: white;
      color: #3b82f6;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-voir:hover {
      background: #3b82f6;
      color: white;
    }

    .btn-convertir {
      padding: 6px 16px;
      background: white;
      color: #10b981;
      border: 1px solid #10b981;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-convertir:hover {
      background: #10b981;
      color: white;
    }

    .btn-converted {
      padding: 6px 16px;
      background: #10b981;
      color: white;
      border: 1px solid #10b981;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: default;
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
      overflow-y: auto;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
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
      z-index: 10;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    /* Invoice Preview Styles */
    .invoice-preview {
      padding: 40px;
      background: white;
    }

    .invoice-header {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      align-items: start;
    }

    .logo-circle {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 10px;
    }

    .logo-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
      text-align: center;
    }

    .company-details {
      text-align: center;
    }

    .company-details h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      color: #1e293b;
    }

    .company-details p {
      margin: 4px 0;
      font-size: 0.85rem;
      color: #475569;
    }

    .invoice-date {
      text-align: right;
      font-size: 0.9rem;
    }

    .invoice-title {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      margin: 30px 0;
      color: #1e293b;
    }

    .client-info {
      text-align: right;
      margin-bottom: 30px;
      font-size: 0.9rem;
      line-height: 1.8;
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .invoice-table thead {
      background: #fef3c7;
    }

    .invoice-table th,
    .invoice-table td {
      padding: 12px;
      text-align: left;
      border: 1px solid #e5e7eb;
    }

    .invoice-table th {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }

    .totals-table {
      width: 350px;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 10px 16px;
      border: 1px solid #e5e7eb;
    }

    .totals-table .total-row {
      background: #f9fafb;
      font-size: 1.1rem;
    }

    .closing-text {
      text-align: center;
      margin: 30px 0;
      font-size: 0.9rem;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .signature-section {
      text-align: right;
      margin: 40px 0;
    }

    .signature-box {
      display: inline-block;
      border: 2px solid #1e293b;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: center;
    }

    .signature-box p {
      margin: 4px 0;
      font-size: 0.85rem;
    }

    .invoice-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 30px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      padding: 20px 40px;
      border-top: 2px solid #e5e7eb;
      background: #f9fafb;
      position: sticky;
      bottom: 0;
    }

    .btn-print,
    .btn-download,
    .btn-close-bottom {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-print {
      background: #3b82f6;
      color: white;
    }

    .btn-print:hover {
      background: #2563eb;
    }

    .btn-download {
      background: #10b981;
      color: white;
    }

    .btn-download:hover {
      background: #059669;
    }

    .btn-close-bottom {
      background: #64748b;
      color: white;
    }

    .btn-close-bottom:hover {
      background: #475569;
    }
  `]
})
export class ProformasComponent {
  searchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  selectedProforma: Proforma | null = null;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  proformas: Proforma[] = [
    { id: 1, date: '12/08/2025', numero: 'Proforma 12/2025', client: 'Depart Travel', montantTTC: 700000, isConverted: false },
    { id: 2, date: '14/08/2025', numero: 'Proforma 13/2025', client: 'Depart Travel', montantTTC: 1000000, isConverted: true },
    { id: 3, date: '18/08/2025', numero: 'Proforma 14/2025', client: 'Tours Sans Soucis', montantTTC: 500000, isConverted: false },
    { id: 4, date: '18/08/2025', numero: 'Proforma 15/2025', client: 'Tours Sans Soucis', montantTTC: 350000, isConverted: false },
    { id: 5, date: '18/08/2025', numero: 'Proforma 16/2025', client: 'Depart Travel', montantTTC: 600000, isConverted: false },
    { id: 6, date: '18/08/2025', numero: 'Proforma 17/2025', client: 'Depart Travel', montantTTC: 400000, isConverted: false },
    { id: 7, date: '20/08/2025', numero: 'Proforma 18/2025', client: 'Voyage Plus', montantTTC: 850000, isConverted: false },
    { id: 8, date: '22/08/2025', numero: 'Proforma 19/2025', client: 'Travel Express', montantTTC: 920000, isConverted: true },
    { id: 9, date: '25/08/2025', numero: 'Proforma 20/2025', client: 'Tours Sans Soucis', montantTTC: 450000, isConverted: false },
    { id: 10, date: '27/08/2025', numero: 'Proforma 21/2025', client: 'Depart Travel', montantTTC: 780000, isConverted: false },
    { id: 11, date: '28/08/2025', numero: 'Proforma 22/2025', client: 'Voyage Plus', montantTTC: 550000, isConverted: false },
    { id: 12, date: '30/08/2025', numero: 'Proforma 23/2025', client: 'Travel Express', montantTTC: 670000, isConverted: true },
    { id: 13, date: '01/09/2025', numero: 'Proforma 24/2025', client: 'Tours Sans Soucis', montantTTC: 390000, isConverted: false },
    { id: 14, date: '03/09/2025', numero: 'Proforma 25/2025', client: 'Depart Travel', montantTTC: 820000, isConverted: false },
    { id: 15, date: '05/09/2025', numero: 'Proforma 26/2025', client: 'Voyage Plus', montantTTC: 710000, isConverted: true },
    { id: 16, date: '08/09/2025', numero: 'Proforma 27/2025', client: 'Travel Express', montantTTC: 640000, isConverted: false },
    { id: 17, date: '10/09/2025', numero: 'Proforma 28/2025', client: 'Tours Sans Soucis', montantTTC: 480000, isConverted: false },
    { id: 18, date: '12/09/2025', numero: 'Proforma 29/2025', client: 'Depart Travel', montantTTC: 890000, isConverted: true },
    { id: 19, date: '15/09/2025', numero: 'Proforma 30/2025', client: 'Voyage Plus', montantTTC: 530000, isConverted: false },
    { id: 20, date: '18/09/2025', numero: 'Proforma 31/2025', client: 'Travel Express', montantTTC: 760000, isConverted: false },
    { id: 21, date: '20/09/2025', numero: 'Proforma 32/2025', client: 'Tours Sans Soucis', montantTTC: 420000, isConverted: false },
    { id: 22, date: '22/09/2025', numero: 'Proforma 33/2025', client: 'Depart Travel', montantTTC: 950000, isConverted: true },
    { id: 23, date: '25/09/2025', numero: 'Proforma 34/2025', client: 'Voyage Plus', montantTTC: 680000, isConverted: false },
    { id: 24, date: '28/09/2025', numero: 'Proforma 35/2025', client: 'Travel Express', montantTTC: 590000, isConverted: false },
    { id: 25, date: '30/09/2025', numero: 'Proforma 36/2025', client: 'Tours Sans Soucis', montantTTC: 730000, isConverted: true }
  ];

  filteredProformas: Proforma[] = [...this.proformas];
  paginatedProformas: Proforma[] = [];

  constructor(private router: Router) {
    this.updatePagination();
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-TN').format(montant) + ' DT';
  }

  filterProformas(): void {
    this.filteredProformas = this.proformas.filter(proforma => {
      const matchesSearch = proforma.client.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  applyDateFilter(): void {
    this.filteredProformas = this.proformas.filter(proforma => {
      let matchesSearch = proforma.client.toLowerCase().includes(this.searchTerm.toLowerCase());
      let matchesDate = true;

      if (this.startDate || this.endDate) {
        const proformaDate = this.parseDate(proforma.date);
        
        if (this.startDate) {
          const start = new Date(this.startDate);
          matchesDate = matchesDate && proformaDate >= start;
        }
        
        if (this.endDate) {
          const end = new Date(this.endDate);
          matchesDate = matchesDate && proformaDate <= end;
        }
      }

      return matchesSearch && matchesDate;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProformas.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProformas = this.filteredProformas.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  viewProforma(proforma: Proforma): void {
    this.selectedProforma = proforma;
  }

  closeModal(): void {
    this.selectedProforma = null;
  }

  convertToFacture(proforma: Proforma): void {
    this.router.navigate(['/factures/create'], {
      state: { 
        proformaData: {
          id: proforma.id,
          numero: proforma.numero,
          client: proforma.client,
          montantTTC: proforma.montantTTC,
          date: proforma.date
        }
      }
    });
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getClientEmail(client: string): string {
    const emails: { [key: string]: string } = {
      'Depart Travel': 'contact@departtravel.com',
      'Tours Sans Soucis': 'tourssanssoucisgmail.com',
      'Voyage Plus': 'infovoyageplus.tn',
      'Travel Express': 'expresstravelexpress.com'
    };
    return emails[client] || 'contactclient.com';
  }

  getQuantity(montantTTC: number): number {
    return Math.round((montantTTC - 1000) / 1.07 / 110000);
  }

  calculateHT(montantTTC: number): number {
    const montantWithoutTimbre = montantTTC - 1000;
    return Math.round(montantWithoutTimbre / 1.07);
  }

  calculateTVA(montantTTC: number): number {
    const ht = this.calculateHT(montantTTC);
    return Math.round(ht * 0.07);
  }

  convertToWords(amount: number): string {
    const thousands = Math.floor(amount / 1000);
    const remainder = amount % 1000;
    
    let result = '';
    
    if (thousands > 0) {
      result += `${thousands} DINARS`;
    }
    
    if (remainder > 0) {
      result += ` ET ${remainder.toString().padStart(3, '0')} MILLIMES`;
    }
    
    return result || 'ZÉRO DINAR';
  }

  printInvoice(): void {
    window.print();
  }

  downloadPDF(): void {
    // Simple download implementation using browser's print to PDF
    // In a real application, you would use a library like jsPDF or pdfmake
    alert('Pour télécharger le PDF, utilisez l\'option "Imprimer" et sélectionnez "Enregistrer au format PDF" dans votre navigateur.');
    window.print();
  }}