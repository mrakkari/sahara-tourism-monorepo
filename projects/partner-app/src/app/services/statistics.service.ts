import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReservationService } from './reservation.service';
import { InvoiceService } from './invoice.service';
import { TourType, getAllTourTypes } from '../models/tour.model';
import { Reservation } from '../models/reservation.model';

export type StatisticsPeriod = 'month' | 'quarter' | 'year' | 'all';

export interface Statistics {
    // Reservation metrics
    totalReservations: number;
    approvedReservations: number;
    pendingReservations: number;
    rejectedReservations: number;

    // Revenue metrics
    totalRevenue: number;
    invoicedAmount: number;
    paidAmount: number;
    unpaidAmount: number;

    // Participant metrics
    totalParticipants: number;
    totalAdults: number;
    totalChildren: number;
    averageGroupSize: number;

    // Tour type distribution
    tourTypeDistribution: TourTypeStats[];

    // Top performing tours
    topPerformingTours: TopTour[];
}

export interface TourTypeStats {
    tourType: TourType;
    count: number;
    revenue: number;
    percentage: number;
}

export interface TopTour {
    tourType: TourType;
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
        return this.reservationService.getAllReservations().pipe(
            map(reservations => {
                const filteredReservations = this.filterByPeriod(reservations, period);
                return this.calculateStatistics(filteredReservations);
            })
        );
    }

    private filterByPeriod(reservations: Reservation[], period: StatisticsPeriod): Reservation[] {
        if (period === 'all') {
            return reservations;
        }

        const now = new Date();
        const startDate = new Date();

        switch (period) {
            case 'month':
                // Last 30 days
                startDate.setDate(now.getDate() - 30);
                break;
            case 'quarter':
                // Last 90 days (3 months)
                startDate.setDate(now.getDate() - 90);
                break;
            case 'year':
                // Last 365 days
                startDate.setDate(now.getDate() - 365);
                break;
        }

        // Filter reservations based on their creation date
        return reservations.filter(r => {
            const dateToCheck = new Date(r.createdAt);
            return dateToCheck >= startDate && dateToCheck <= now;
        });
    }

    private calculateStatistics(reservations: Reservation[]): Statistics {
        // Reservation counts
        const totalReservations = reservations.length;
        const approvedReservations = reservations.filter(r => r.status === 'confirmed').length;
        const pendingReservations = reservations.filter(r => r.status === 'pending').length;
        const rejectedReservations = reservations.filter(r => r.status === 'rejected').length;

        // Revenue calculations
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        const invoicedAmount = totalRevenue;
        const paidAmount = reservations
            .filter(r => r.status === 'confirmed')
            .reduce((sum, r) => sum + (r.payment?.paidAmount || 0), 0);
        const unpaidAmount = totalRevenue - paidAmount;

        // Participant calculations
        const totalParticipants = reservations.reduce((sum, r) => sum + r.numberOfPeople, 0);
        const totalAdults = reservations.reduce((sum, r) => sum + r.adults, 0);
        const totalChildren = reservations.reduce((sum, r) => sum + r.children, 0);
        const averageGroupSize = totalReservations > 0 ? totalParticipants / totalReservations : 0;

        // Tour type distribution
        const tourTypeDistribution = this.calculateTourTypeDistribution(reservations, totalRevenue);

        // Top performing tours
        const topPerformingTours = this.calculateTopPerformingTours(reservations);

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

    private calculateTourTypeDistribution(reservations: Reservation[], totalRevenue: number): TourTypeStats[] {
        const tourTypes = getAllTourTypes();
        const distribution: TourTypeStats[] = [];

        tourTypes.forEach(tourType => {
            const tourReservations = reservations.filter(r => r.tourType === tourType);
            const count = tourReservations.length;
            const revenue = tourReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

            if (count > 0) {
                distribution.push({
                    tourType,
                    count,
                    revenue,
                    percentage
                });
            }
        });

        return distribution.sort((a, b) => b.revenue - a.revenue);
    }

    private calculateTopPerformingTours(reservations: Reservation[]): TopTour[] {
        const tourTypes = getAllTourTypes();
        const topTours: TopTour[] = [];

        tourTypes.forEach(tourType => {
            const tourReservations = reservations.filter(r => r.tourType === tourType);
            if (tourReservations.length === 0) return;

            const reservationCount = tourReservations.length;
            const revenue = tourReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            const totalParticipants = tourReservations.reduce((sum, r) => sum + r.numberOfPeople, 0);
            const averageGroupSize = totalParticipants / reservationCount;

            topTours.push({
                tourType,
                reservations: reservationCount,
                revenue,
                averageGroupSize
            });
        });

        return topTours.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }
}