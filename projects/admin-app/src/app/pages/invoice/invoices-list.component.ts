import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { Reservation } from '../../core/models/reservation.model';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GlassCardComponent, StatusBadgeComponent],
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss']
})
export class InvoicesListComponent implements OnInit {
  invoices: Reservation[] = [];
  filteredInvoices: Reservation[] = [];
  paginatedInvoices: Reservation[] = [];
  
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  // Filters
  searchClient: string = '';
  startDate: string = '';
  endDate: string = '';

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.reservationService.getAllReservations().subscribe(res => {
      // Show all confirmed/arrived/completed as invoices (exclude cancelled)
      this.invoices = res.filter(r => r.status !== 'cancelled');
      this.filteredInvoices = [...this.invoices];
      this.updatePagination();
    });
  }

  applyFilters(): void {
    this.filteredInvoices = this.invoices.filter(invoice => {
      // Client search filter
      const clientMatch = !this.searchClient || 
        invoice.partnerName.toLowerCase().includes(this.searchClient.toLowerCase());

      // Date range filter
      const invoiceDate = new Date(invoice.createdAt);
      const startMatch = !this.startDate || 
        invoiceDate >= new Date(this.startDate);
      const endMatch = !this.endDate || 
        invoiceDate <= new Date(this.endDate);

      return clientMatch && startMatch && endMatch;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchClient = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  cancelInvoice(invoice: Reservation): void {
    if (confirm(`Êtes-vous sûr de vouloir annuler la facture ${this.getInvoiceNumber(invoice)} ?`)) {
      // Update the reservation status to cancelled
      const updatedReservation = this.reservationService.updateReservation(invoice.id, { status: 'cancelled' });
      
      if (updatedReservation) {
        // Remove from the list
        this.invoices = this.invoices.filter(inv => inv.id !== invoice.id);
        this.applyFilters();
        alert('Facture annulée avec succès');
      }
    }
  }

  getInvoiceNumber(invoice: Reservation): string {
    // Generate invoice number: MonthDay/Year format (e.g., FEB06/2026, MAR15/2026)
    const date = new Date(invoice.createdAt);
   // const year = date.getMonth;
    const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${month}${day}`;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR');
  }

  get totalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedInvoices = this.filteredInvoices.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }
}