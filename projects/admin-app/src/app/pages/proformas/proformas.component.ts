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

  constructor(private reservationService: ReservationService) {}

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
    window.print();
  }
}