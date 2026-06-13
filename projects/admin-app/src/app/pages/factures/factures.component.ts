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

  sendingIds  = new Set<string>();
  sendSuccess = new Set<string>();

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

  sendFacture(f: FactureResponse): void {
    if (this.sendingIds.has(f.invoiceId)) return;
    this.sendingIds.add(f.invoiceId);
    this.sendSuccess.delete(f.invoiceId);
    this.invoiceService.sendFacture(f.invoiceId).subscribe({
      next: () => {
        this.sendingIds.delete(f.invoiceId);
        this.sendSuccess.add(f.invoiceId);
        setTimeout(() => this.sendSuccess.delete(f.invoiceId), 4000);
      },
      error: err => {
        this.sendingIds.delete(f.invoiceId);
        console.error('Erreur envoi facture:', err);
      }
    });
  }

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
    const preview = document.querySelector('.invoice-preview') as HTMLElement;
    if (!preview) return;

    const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<title>Facture</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; color: #1e293b; font-size: 12px; padding: 10mm 15mm; background: white; }
img { max-width: 100%; }
.invoice-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 18px; }
.company-left { display: flex; align-items: flex-start; gap: 14px; }
.logo-img { width: 65px; height: 65px; border-radius: 50%; object-fit: contain; border: 1px solid #e5e7eb; flex-shrink: 0; }
.company-details h3 { margin: 0 0 4px; font-size: 13px; font-weight: 700; }
.company-details p { margin: 2px 0; font-size: 11px; color: #475569; }
.invoice-date { text-align: right; font-size: 12px; }
.invoice-title { text-align: center; font-size: 20px; font-weight: 700; margin: 14px 0; letter-spacing: 0.02em; }
.client-section { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.client-block { text-align: right; font-size: 12px; line-height: 1.8; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; }
.client-block p { margin: 0; }
.invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
.invoice-table th, .invoice-table td { padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 11px; }
.invoice-table thead { background: #fef3c7; }
.invoice-table th { font-weight: 600; }
.totals-section { display: flex; justify-content: flex-end; margin-bottom: 14px; }
.totals-table { width: 300px; border-collapse: collapse; }
.totals-table td { padding: 7px 12px; border: 1px solid #e5e7eb; font-size: 12px; }
.totals-table td:first-child { font-weight: 600; }
.amount-cell { text-align: right; font-weight: 600; }
.total-ttc-row { background: #f9fafb; }
.total-ttc-row td { font-size: 13px; font-weight: 700; }
.paid-cell { color: #10b981; font-weight: 400; }
.remaining-row { background: #f0fdf4; }
.remaining-row td { font-weight: 700; }
.arrete-section { font-size: 11px; font-weight: 400; margin-bottom: 12px; }
.proforma-status-row { display: none; }
.signature-section { text-align: right; font-size: 11px; color: #475569; margin-bottom: 30px; padding-top: 8px; }
.invoice-footer { text-align: center; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #64748b; margin-top: 14px; }
</style>
</head><body>${preview.innerHTML}</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (!win) { URL.revokeObjectURL(url); return; }

    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => { win.close(); URL.revokeObjectURL(url); }, 500);
    }, 600);
  }
}