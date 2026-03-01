import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ReservationService } from './reservation.service';
import { InvoiceService } from './invoice.service';
import { Reservation } from '../models/reservation.model';
import { TourType } from '../models/tour.model';

export type StatisticsPeriod = 'month' | 'quarter' | 'year' | 'all';

export interface Statistics {
    totalReservations: number;
    approvedReservations: number;
    pendingReservations: number;
    rejectedReservations: number;

    totalRevenue: number;
    invoicedAmount: number;
    paidAmount: number;
    unpaidAmount: number;

    totalParticipants: number;
    totalAdults: number;
    totalChildren: number;
    averageGroupSize: number;

    tourTypeDistribution: TourTypeStats[];
    topPerformingTours: TopTour[];
}

export interface TourTypeStats {
    tourType: string; // string instead of TourType enum
    count: number;
    revenue: number;
    percentage: number;
}

export interface TopTour {
    tourType: string; // string instead of TourType enum
    reservations: number;
    revenue: number;
    averageGroupSize: number;
}

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {

    constructor(
        private reservationService: ReservationService,
        private invoiceService: InvoiceService
    ) { }

    getStatistics(period: StatisticsPeriod = 'all'): Observable<Statistics> {
        // Fetch both tour types and reservations, then calculate
        return this.reservationService.getAllTourTypes().pipe(
            switchMap((tourTypes: TourType[]) => {
                const tourTypeNames = tourTypes.map(t => t.name);
                return this.reservationService.getAllReservations().pipe(
                    map(reservations => {
                        const filtered = this.filterByPeriod(reservations, period);
                        return this.calculateStatistics(filtered, tourTypeNames);
                    })
                );
            })
        );
    }

    private filterByPeriod(reservations: Reservation[], period: StatisticsPeriod): Reservation[] {
        if (period === 'all') return reservations;

        const now = new Date();
        const startDate = new Date();

        switch (period) {
            case 'month':   startDate.setDate(now.getDate() - 30);  break;
            case 'quarter': startDate.setDate(now.getDate() - 90);  break;
            case 'year':    startDate.setDate(now.getDate() - 365); break;
        }

        return reservations.filter(r => {
            const dateToCheck = new Date(r.createdAt);
            return dateToCheck >= startDate && dateToCheck <= now;
        });
    }

    private calculateStatistics(reservations: Reservation[], tourTypeNames: string[]): Statistics {
        const totalReservations = reservations.length;
        const approvedReservations = reservations.filter(r => r.status === 'confirmed').length;
        const pendingReservations = reservations.filter(r => r.status === 'pending').length;
        const rejectedReservations = reservations.filter(r => r.status === 'rejected').length;

        const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        const invoicedAmount = totalRevenue;
        const paidAmount = reservations
            .filter(r => r.status === 'confirmed')
            .reduce((sum, r) => sum + (r.payment?.paidAmount || 0), 0);
        const unpaidAmount = totalRevenue - paidAmount;

        const totalParticipants = reservations.reduce((sum, r) => sum + r.numberOfPeople, 0);
        const totalAdults = reservations.reduce((sum, r) => sum + r.adults, 0);
        const totalChildren = reservations.reduce((sum, r) => sum + r.children, 0);
        const averageGroupSize = totalReservations > 0 ? totalParticipants / totalReservations : 0;

        const tourTypeDistribution = this.calculateTourTypeDistribution(reservations, tourTypeNames, totalRevenue);
        const topPerformingTours = this.calculateTopPerformingTours(reservations, tourTypeNames);

        return {
            totalReservations,
            approvedReservations,
            pendingReservations,
            rejectedReservations,
            totalRevenue,
            invoicedAmount,
            paidAmount,
            unpaidAmount,
            totalParticipants,
            totalAdults,
            totalChildren,
            averageGroupSize,
            tourTypeDistribution,
            topPerformingTours
        };
    }

    private calculateTourTypeDistribution(reservations: Reservation[], tourTypeNames: string[], totalRevenue: number): TourTypeStats[] {
        const distribution: TourTypeStats[] = [];

        tourTypeNames.forEach((tourType: string) => {
            const tourReservations = reservations.filter(r => r.tourType === tourType);
            const count = tourReservations.length;
            const revenue = tourReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

            if (count > 0) {
                distribution.push({ tourType, count, revenue, percentage });
            }
        });

        return distribution.sort((a, b) => b.revenue - a.revenue);
    }

    private calculateTopPerformingTours(reservations: Reservation[], tourTypeNames: string[]): TopTour[] {
        const topTours: TopTour[] = [];

        tourTypeNames.forEach((tourType: string) => {
            const tourReservations = reservations.filter(r => r.tourType === tourType);
            if (tourReservations.length === 0) return;

            const reservationCount = tourReservations.length;
            const revenue = tourReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            const totalParticipants = tourReservations.reduce((sum, r) => sum + r.numberOfPeople, 0);
            const averageGroupSize = totalParticipants / reservationCount;

            topTours.push({ tourType, reservations: reservationCount, revenue, averageGroupSize });
        });

        return topTours.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }
}