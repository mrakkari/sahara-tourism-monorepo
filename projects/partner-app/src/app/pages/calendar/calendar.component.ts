import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { isToday } from '../../utils/date-utils';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  currentMonthName = '';
  currentYear = 0;
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  calendarDays: any[] = [];
  reservations: Reservation[] = [];

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.reservationService.getAllReservations().subscribe(res => {
      this.reservations = res;
      this.generateCalendar();
    });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.currentYear = year;
    this.currentMonthName = new Date(year, month).toLocaleString('fr-FR', { month: 'long' });
    this.currentMonthName = this.currentMonthName.charAt(0).toUpperCase() + this.currentMonthName.slice(1);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    this.calendarDays = [];

    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      this.calendarDays.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: isToday(prevDate.toISOString()),
        events: []
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayEvents = this.getEventsForDate(date);

      this.calendarDays.push({
        date: date,
        isCurrentMonth: true,
        isToday: isToday(date.toISOString()),
        events: dayEvents
      });
    }

    // Next month days to fill grid (up to 42 cells = 6 rows)
    const totalCells = 42;
    const remainingCells = totalCells - this.calendarDays.length;

    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      this.calendarDays.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }
  }

  getEventsForDate(date: Date): any[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.reservations
      .filter(r => r.checkInDate.startsWith(dateStr))
      .map(r => ({
        title: `${r.partnerName} (${r.status})`,
        type: r.status
      }));
  }

  prevMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }
}