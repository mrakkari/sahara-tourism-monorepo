// admin/src/app/pages/proformas/proformas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../../../../shared/src/services/reservation.service';
import { ProformaResponse } from '../../../../../shared/src/models/proforma.model';
import { InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-proformas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './proformas.component.html',
  styleUrls: ['./proformas.component.scss'],
})
export class ProformasComponent implements OnInit {

  proformas: ProformaResponse[]          = [];
  filteredProformas: ProformaResponse[]  = [];
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

  sendingIds = new Set<string>();
  sendSuccess = new Set<string>();

  constructor(
    private reservationService: ReservationService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.loadProformas();
  }

  loadProformas(): void {
    this.isLoading = true;
    this.error = null;
    this.reservationService.getAllProformas().subscribe({
      next: data => {
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
    const term  = this.searchTerm.toLowerCase();
    const start = this.startDate ? new Date(this.startDate) : null;
    const end   = this.endDate   ? new Date(this.endDate)   : null;

    this.filteredProformas = this.proformas.filter(p => {
      const matchesTerm   = !term || p.invoiceNumber.toLowerCase().includes(term)
                            || (p.userName ?? '').toLowerCase().includes(term);
      const matchesStatus = !this.statusFilter || p.paymentStatus === this.statusFilter;
      const date          = new Date(p.invoiceDate);
      const matchesDate   = (!start || date >= start) && (!end || date <= end);
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
  closeModal(): void                       { this.selectedProforma = null; }

  sendProforma(p: ProformaResponse): void {
    if (this.sendingIds.has(p.invoiceId)) return;
    this.sendingIds.add(p.invoiceId);
    this.sendSuccess.delete(p.invoiceId);
    this.invoiceService.sendProforma(p.invoiceId).subscribe({
      next: () => {
        this.sendingIds.delete(p.invoiceId);
        this.sendSuccess.add(p.invoiceId);
        setTimeout(() => this.sendSuccess.delete(p.invoiceId), 4000);
      },
      error: err => {
        this.sendingIds.delete(p.invoiceId);
        console.error('Erreur envoi proforma:', err);
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
      UNPAID:          'Non payé',
      PARTIALLY_PAID:  'Part. payé',
      PAID:            'Payé',
      OVERDUE:         'En retard',
      REFUNDED:        'Remboursé',
    };
    return map[status] ?? status;
  }

  getUserName(p: ProformaResponse): string {
    return p.userName || `Client #${p.userId.slice(0, 8).toUpperCase()}`;
  }

  printInvoice(): void {
    const preview = document.querySelector('.invoice-preview') as HTMLElement;
    if (!preview) return;

    const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<title>Proforma</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; color: #1e293b; font-size: 12px; padding: 10mm 15mm; background: white; }
img { max-width: 100%; }
.invoice-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 18px; }
.company-left { display: flex; align-items: flex-start; gap: 14px; }
.logo-img { width: 65px; height: 65px; border-radius: 50%; object-fit: contain; border: 1px solid #e5e7eb; }
.logo-text { font-size: 11px; font-weight: 600; margin-top: 6px; }
.company-details h3 { margin: 0 0 4px; font-size: 13px; font-weight: 700; }
.company-details p { margin: 2px 0; font-size: 11px; color: #475569; }
.invoice-date { text-align: right; font-size: 12px; }
.client-section { display: flex; justify-content: flex-end; margin-bottom: 18px; }
.client-block { text-align: right; font-size: 12px; line-height: 1.8; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; }
.client-block p { margin: 0; }
.invoice-title { text-align: center; font-size: 20px; font-weight: 700; margin: 16px 0; letter-spacing: 0.02em; }
.invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
.invoice-table th, .invoice-table td { padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 11px; }
.invoice-table thead { background: #fef3c7; }
.invoice-table th { font-weight: 600; }
.totals-section { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.totals-table { width: 280px; border-collapse: collapse; }
.totals-table td { padding: 7px 12px; border: 1px solid #e5e7eb; font-size: 12px; }
.total-row { background: #f9fafb; }
.paid-cell { color: #10b981; font-weight: 500; }
.proforma-status-row { display: none; }
.invoice-footer { text-align: center; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #64748b; margin-top: 16px; }
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