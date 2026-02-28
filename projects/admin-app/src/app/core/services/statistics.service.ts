import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ReservationStats, RevenueStats } from '../models/admin.models';

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    constructor() { }

    /**
     * Get reservation statistics
     */
    getReservationStats(): Observable<ReservationStats> {
        // Mock data - replace with actual API call
        return of({
            totalReservations: 247,
            confirmedReservations: 189,
            pendingReservations: 43,
            cancelledReservations: 15,
            growthPercentage: 12.5
        });
    }

    /**
     * Get revenue statistics
     */
    getRevenueStats(): Observable<RevenueStats> {
        // Mock data - replace with actual API call
        return of({
            totalRevenue: 125000,
            monthlyRevenue: [
                8500, 9200, 10100, 11400, 12800,
                13500, 14200, 15800, 16400, 17200,
                18500, 19800
            ],
            revenueGrowth: 18.3
        });
    }

    /**
     * Get reservation count by status
     */
    getReservationsByStatus(): Observable<{ status: string, count: number }[]> {
        return of([
            { status: 'Confirmé', count: 189 },
            { status: 'En attente', count: 43 },
            { status: 'Annulé', count: 15 }
        ]);
    }

    /**
     * Get monthly reservations trend
     */
    getMonthlyReservationsTrend(): Observable<{ month: string, count: number }[]> {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const data = months.map((month, index) => ({
            month,
            count: Math.floor(15 + Math.random() * 10) + index
        }));
        return of(data);
    }

    /**
     * Get client statistics
     */
    getClientStats(): Observable<{ total: number, partenaires: number, passagers: number }> {
        return of({
            total: 156,
            partenaires: 48,
            passagers: 108
        });
    }

    /**
     * Get average revenue per reservation
     */
    getAverageRevenuePerReservation(): Observable<number> {
        return of(506);
    }
}
