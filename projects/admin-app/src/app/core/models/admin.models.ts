
export interface ReservationStats {
    totalReservations: number;
    confirmedReservations: number;
    pendingReservations: number;
    cancelledReservations: number;
    growthPercentage: number;
}

export interface RevenueStats {
    totalRevenue: number;
    monthlyRevenue: number[];
    revenueGrowth: number;
}
