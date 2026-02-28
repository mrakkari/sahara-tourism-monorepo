import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-arrivals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    StatusBadgeComponent,
    GlassCardComponent
  ],
  templateUrl: './arrivals.component.html',
  styleUrls: ['./arrivals.component.scss'],
  animations: [
    trigger('staggerList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(40, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ArrivalsComponent implements OnInit {
  allReservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  pagedReservations: Reservation[] = [];

  // Filters
  filterDateString = new Date().toISOString().split('T')[0];
  statusFilter = 'pending';

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.reservationService.getAllReservations().subscribe(reservations => {
      this.allReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'arrived');
      this.applyFilters();
    });
  }

  onDateChange(): void {
    this.applyFilters();
  }

  resetToToday(): void {
    this.filterDateString = new Date().toISOString().split('T')[0];
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredReservations = this.allReservations.filter(r => {
      const statusMatch = this.statusFilter === 'all' ||
        (this.statusFilter === 'pending' && r.status === 'confirmed') ||
        (this.statusFilter === 'arrived' && r.status === 'arrived');

      let dateMatch = true;
      if (this.filterDateString) {
        dateMatch = r.checkInDate.startsWith(this.filterDateString);
      }

      return statusMatch && dateMatch;
    });

    this.pageIndex = 0;
    if (this.paginator) this.paginator.firstPage();
    this.updatePagedData();
  }

  updatePagedData(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedReservations = this.filteredReservations.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedData();
  }

  getArrivedCount(): number {
    return this.allReservations.filter(r => r.status === 'arrived').length;
  }

  getPendingArrivalsTodayCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.allReservations.filter(r => r.status === 'confirmed' && r.checkInDate.startsWith(today)).length;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  markArrived(id: string): void {
    if (confirm('Marquer ce groupe comme arrivé et installé ?')) {
      this.reservationService.markAsArrived(id);
      this.notificationService.showSuccess('✅ Groupe Check-In terminé !');
      this.loadData();
    }
  }
}