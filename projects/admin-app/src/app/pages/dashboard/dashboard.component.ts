import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReservationService } from '../../core/services/reservation.service';
import { Reservation } from '../../core/models/reservation.model';
import { NotificationService } from '../../core/services/notification.service';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { TOUR_TYPES, RESERVATION_SOURCES } from '../../core/constants/business-data.constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    StatCardComponent,
    StatusBadgeComponent,
    GlassCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  pagedReservations: Reservation[] = [];

  // Filters
  statusFilter = 'all';
  tourTypeFilter = 'all';
  searchTerm = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Tour types and sources for filtering
  tourTypes = Array.from(TOUR_TYPES);
  reservationSources = Array.from(RESERVATION_SOURCES);

  // Pagination
  pageSize = 5;
  pageIndex = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  constructor(
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReservations.length / this.itemsPerPage);
  }

  loadReservations(): void {
    this.reservationService.getAllReservations().subscribe(reservations => {
      this.reservations = reservations;
      this.applyFilters();
    });
  }

  filterToday(): void {
    this.startDate = new Date();
    this.endDate = new Date();
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(r => {
      const statusMatch = this.statusFilter === 'all' || r.status === this.statusFilter;
      const tourTypeMatch = this.tourTypeFilter === 'all' || r.tourType === this.tourTypeFilter;
      const searchMatch = this.searchTerm === '' ||
        r.partnerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(this.searchTerm.toLowerCase());

      let dateMatch = true;
      if (this.startDate) {
        const d = new Date(r.checkInDate);
        const start = new Date(this.startDate);
        start.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        if (this.endDate) {
          const end = new Date(this.endDate);
          end.setHours(23, 59, 59, 999);
          dateMatch = d >= start && d <= end;
        } else {
          dateMatch = d.getTime() === start.getTime();
        }
      }

      return statusMatch && tourTypeMatch && searchMatch && dateMatch;
    });

    // Sorting by status
    this.filteredReservations.sort((a, b) => {
      const statusOrder: Record<string, number> = {
        'pending': 1,
        'confirmed': 2,
        'arrived': 3,
        'completed': 4,
        'cancelled': 5
      };

      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;

      return orderA - orderB;
    });

    this.currentPage = 1;
    this.updatePagedData();
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.tourTypeFilter = 'all';
    this.searchTerm = '';
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  updatePagedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedReservations = this.filteredReservations.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedData();
    }
  }

  // Stats Helpers
  getTotalReservations(): number { return this.reservations.length; }
  getPendingCount(): number { return this.reservations.filter(r => r.status === 'pending').length; }
  getConfirmedCount(): number { return this.reservations.filter(r => r.status === 'confirmed' || r.status === 'arrived').length; }
  getTotalRevenue(): number { return this.reservations.reduce((sum, r) => sum + r.payment.paidAmount, 0); }

  // UI Helpers
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  calculateDuration(r: Reservation): number {
    const cin = new Date(r.checkInDate);
    const cout = new Date(r.checkOutDate);
    return Math.ceil((cout.getTime() - cin.getTime()) / (1000 * 3600 * 24));
  }

  getPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'pending': 'Non payé',
      'partial': 'Partiel',
      'completed': 'Payé'
    };
    return map[status] || status;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmé',
      'arrived': 'Arrivé',
      'completed': 'Terminé',
      'cancelled': 'Annulé'
    };
    return map[status] || status;
  }

  confirmReservation(id: string): void {
    if (confirm('Confirmer cette réservation ?')) {
      this.reservationService.confirmReservation(id);
      this.loadReservations();
    }
  }

  exportToCSV(): void {
    this.exportToPDF();
  }
  
  exportToPDF(): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('Réservations Sahara', 14, 22);
    
    // Add subtitle with filters info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const today = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Exporté le ${today}`, 14, 30);
    doc.text(`Page ${this.currentPage} sur ${this.totalPages} | ${this.filteredReservations.length} réservations au total`, 14, 36);
    
    // Prepare table data from current page
    const tableData = this.pagedReservations.map(r => [
      r.partnerName,
      r.tourType || 'N/A',
      `${r.numberOfPeople} pers.`,
      this.formatDate(r.checkInDate),
      `${this.calculateDuration(r)} nuits`,
      r.source || 'N/A',
      this.getStatusLabel(r.status),
      this.getPaymentStatusLabel(r.payment.paymentStatus),
      `${r.payment.totalAmount} TND`
    ]);
    
    // Generate table
    autoTable(doc, {
      head: [[
        'Partenaire', 
        'Type Tour', 
        'Personnes', 
        'Check-in', 
        'Durée', 
        'Source', 
        'Statut', 
        'Paiement', 
        'Montant'
      ]],
      body: tableData,
      startY: 42,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Partenaire
        1: { cellWidth: 20 }, // Type
        2: { cellWidth: 18 }, // Personnes
        3: { cellWidth: 20 }, // Check-in
        4: { cellWidth: 15 }, // Durée
        5: { cellWidth: 20 }, // Source
        6: { cellWidth: 22 }, // Statut
        7: { cellWidth: 20 }, // Paiement
        8: { cellWidth: 25, halign: 'right' } // Montant
      },
      margin: { top: 42 },
    });
    
    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`reservations_page${this.currentPage}_${timestamp}.pdf`);
    
    this.notificationService.showSuccess(
      `${this.pagedReservations.length} réservations de la page ${this.currentPage} exportées en PDF!`
    );
  }
}