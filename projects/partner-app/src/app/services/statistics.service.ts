import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ReservationService } from '../../../../shared/src/services/reservation.service';
import { ReservationResponse } from '../../../../shared/src/models/reservation-api.model';
import { TourType } from '../../../../shared/src/models/tour.model';

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
    tourType: string;
    count: number;
    revenue: number;
    percentage: number;
}

export interface TopTour {
    tourType: string;
    reservations: number;
    revenue: number;
    averageGroupSize: number;
}

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {

    constructor(private reservationService: ReservationService) {}

    getStatistics(period: StatisticsPeriod = 'all'): Observable<Statistics> {
        return this.reservationService.getAllTourTypes().pipe(
            switchMap((tourTypes: TourType[]) => {
                const tourTypeNames = tourTypes.map(t => t.name);
                return this.reservationService.getMyReservations().pipe(
                    map(reservations => {
                        const filtered = this.filterByPeriod(reservations, period);
                        return this.calculateStatistics(filtered, tourTypeNames);
                    })
                );
            })
        );
    }

    // ─── Filter by period ─────────────────────────────────────────
    private filterByPeriod(reservations: ReservationResponse[], period: StatisticsPeriod): ReservationResponse[] {
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

    // ─── Calculate all statistics ─────────────────────────────────
    private calculateStatistics(reservations: ReservationResponse[], tourTypeNames: string[]): Statistics {

        const totalReservations  = reservations.length;
        const approvedReservations = reservations.filter(r => r.status === 'CONFIRMED').length;
        const pendingReservations  = reservations.filter(r => r.status === 'PENDING').length;
        const rejectedReservations = reservations.filter(r => r.status === 'REJECTED').length;

        // totalAmount = tours amount, totalExtrasAmount = extras
        const totalRevenue   = reservations.reduce((sum, r) =>
            sum + (r.totalAmount || 0) + (r.totalExtrasAmount || 0), 0);
        const invoicedAmount = totalRevenue;

        // Only CONFIRMED reservations count as "paid" for now
        const paidAmount   = reservations
            .filter(r => r.status === 'CONFIRMED')
            .reduce((sum, r) => sum + (r.totalAmount || 0) + (r.totalExtrasAmount || 0), 0);
        const unpaidAmount = totalRevenue - paidAmount;

        const totalAdults   = reservations.reduce((sum, r) => sum + (r.numberOfAdults   || 0), 0);
        const totalChildren = reservations.reduce((sum, r) => sum + (r.numberOfChildren || 0), 0);
        const totalParticipants  = totalAdults + totalChildren;
        const averageGroupSize   = totalReservations > 0 ? totalParticipants / totalReservations : 0;

        const tourTypeDistribution = this.calculateTourTypeDistribution(reservations, tourTypeNames, totalRevenue);
        const topPerformingTours   = this.calculateTopPerformingTours(reservations, tourTypeNames);

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

    // ─── Tour type distribution ───────────────────────────────────
    // ReservationResponse has tourTypes[] array (snapshots),
    // so we match by name across all tour type snapshots
    private calculateTourTypeDistribution(
        reservations: ReservationResponse[],
        tourTypeNames: string[],
        totalRevenue: number
    ): TourTypeStats[] {
        return tourTypeNames
            .map(tourType => {
                // A reservation "has" this tour type if any of its snapshots match by name
                const matching = reservations.filter(r =>
                    r.tourTypes?.some(t => t.name === tourType)
                );
                const count   = matching.length;
                const revenue = matching.reduce((sum, r) => {
                    const tourTotal = r.tourTypes
                        ?.filter(t => t.name === tourType)
                        .reduce((s, t) => s + (t.totalPrice || 0), 0) || 0;
                    return sum + tourTotal;
                }, 0);
                const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

                return { tourType, count, revenue, percentage };
            })
            .filter(s => s.count > 0)
            .sort((a, b) => b.revenue - a.revenue);
    }

    // ─── Top performing tours ─────────────────────────────────────
    private calculateTopPerformingTours(
        reservations: ReservationResponse[],
        tourTypeNames: string[]
    ): TopTour[] {
        return tourTypeNames
            .map(tourType => {
                const matching = reservations.filter(r =>
                    r.tourTypes?.some(t => t.name === tourType)
                );
                if (matching.length === 0) return null;

                const reservationCount = matching.length;
                const revenue = matching.reduce((sum, r) => {
                    const tourTotal = r.tourTypes
                        ?.filter(t => t.name === tourType)
                        .reduce((s, t) => s + (t.totalPrice || 0), 0) || 0;
                    return sum + tourTotal;
                }, 0);
                const totalParticipants = matching.reduce((sum, r) =>
                    sum + (r.numberOfAdults || 0) + (r.numberOfChildren || 0), 0);
                const averageGroupSize = totalParticipants / reservationCount;

                return { tourType, reservations: reservationCount, revenue, averageGroupSize };
            })
            .filter((t): t is TopTour => t !== null)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }
}