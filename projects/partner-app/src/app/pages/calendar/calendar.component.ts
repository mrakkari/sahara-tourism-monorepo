import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { ReservationResponse } from '../../models/reservation-api.model';
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
    reservations: ReservationResponse[] = [];

    constructor(private reservationService: ReservationService) {}

    ngOnInit(): void {
        this.reservationService.getMyReservations().subscribe(res => {
            this.reservations = res;
            this.generateCalendar();
        });
    }

    generateCalendar(): void {
        const year  = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.currentYear      = year;
        this.currentMonthName = new Date(year, month).toLocaleString('fr-FR', { month: 'long' });
        this.currentMonthName = this.currentMonthName.charAt(0).toUpperCase() + this.currentMonthName.slice(1);

        const firstDay       = new Date(year, month, 1);
        const lastDay        = new Date(year, month + 1, 0);
        const daysInMonth    = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        this.calendarDays = [];

        // Previous month filler days
        for (let i = 0; i < startDayOfWeek; i++) {
            const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
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
            this.calendarDays.push({
                date,
                isCurrentMonth: true,
                isToday: isToday(date.toISOString()),
                events: this.getEventsForDate(date)
            });
        }

        // Next month filler days (fill to 42 cells)
        const remaining = 42 - this.calendarDays.length;
        for (let i = 1; i <= remaining; i++) {
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
            .filter(r => r.checkInDate?.toString().startsWith(dateStr))
            .map(r => ({
                // groupLeaderName replaces old partnerName
                title: `${r.groupLeaderName || r.groupName || '—'} (${r.status})`,
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