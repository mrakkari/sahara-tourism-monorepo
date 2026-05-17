// admin/src/app/pages/factures/factures.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { FactureResponse } from '../../core/models/facture.model';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './factures.component.html',
  styleUrls: ['./factures.component.scss'],
})
export class FacturesComponent implements OnInit {

  factures: FactureResponse[]          = [];
  filteredFactures: FactureResponse[]  = [];
  paginatedFactures: FactureResponse[] = [];

  selectedFacture: FactureResponse | null = null;

  searchTerm   = '';
  statusFilter = '';
  startDate    = '';
  endDate      = '';

  isLoading = true;
  error: string | null = null;

  currentPage  = 1;
  itemsPerPage = 10;
  totalPages   = 1;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadFactures();
  }

  loadFactures(): void {
    this.isLoading = true;
    this.error = null;
    this.invoiceService.getAllFactures().subscribe({
      next: data => {
        this.factures = data.sort((a, b) =>
          new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: err => {
        console.error('Failed to load factures:', err);
        this.error = 'Impossible de charger les factures.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const term  = this.searchTerm.toLowerCase();
    const start = this.startDate ? new Date(this.startDate) : null;
    const end   = this.endDate   ? new Date(this.endDate)   : null;

    this.filteredFactures = this.factures.filter(f => {
      const matchesTerm   = !term
        || f.invoiceNumber.toLowerCase().includes(term)
        || (f.userName ?? '').toLowerCase().includes(term);
      const matchesStatus = !this.statusFilter || f.paymentStatus === this.statusFilter;
      const date          = new Date(f.invoiceDate);
      const matchesDate   = (!start || date >= start) && (!end || date <= end);
      return matchesTerm && matchesStatus && matchesDate;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredFactures.length / this.itemsPerPage));
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedFactures = this.filteredFactures.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  viewFacture(f: FactureResponse): void  { this.selectedFacture = f; }
  closeModal(): void                      { this.selectedFacture = null; }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  paymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      UNPAID:         'Non payé',
      PARTIALLY_PAID: 'Part. payé',
      PAID:           'Payé',
      OVERDUE:        'En retard',
      REFUNDED:       'Remboursé',
    };
    return map[status] ?? status;
  }

  getClientName(f: FactureResponse): string {
    return f.userName || `Client #${f.userId.slice(0, 8).toUpperCase()}`;
  }

  getCurrencyLabel(currency: string): string {
    const map: Record<string, string> = { TND: 'DT', EUR: '€', USD: '$' };
    return map[currency] ?? currency;
  }

  printFacture(): void {
    window.print();
  }
}