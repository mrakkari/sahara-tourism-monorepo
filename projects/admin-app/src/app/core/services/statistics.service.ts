import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Response interfaces matching backend DTOs exactly ───────────────────────

export interface DashboardStatsDTO {
  totalRevenue: number;
  revenueGrowth: number;
  totalReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  cancelledReservations: number;
  reservationGrowth: number;
  passengerDirectRevenue: number;
  passengerDirectCount: number;
  passengerRevenuePercentage: number;
  period: number;
}

export interface MonthlyTrendDTO {
  labels: string[];       // ["Jan", "Fév", ..., "Déc"]
  revenue: number[];      // one entry per month
  reservations: number[]; // one entry per month
  year: number;
}

export interface PartnerEntryDTO {
  name: string;
  revenue: number;
  percentage: number;
}

export interface PartnerRevenueDTO {
  partners: PartnerEntryDTO[];
  totalPartnerRevenue: number;
  partnerRevenuePercentage: number;
}

export interface SourceEntryDTO {
  source: string;
  count: number;
  percentage: number;
}

export interface SourceStatsDTO {
  sources: SourceEntryDTO[];
  totalReservations: number;
}

export interface RevenueDistributionDTO {
  partnerRevenue: number;
  directRevenue: number;
  partnerPercentage: number;
  directPercentage: number;
  totalRevenue: number;
}

export interface PassengerTrendDTO {
  labels: string[];
  revenue: number[];
  reservations: number[];
  totalRevenue: number;
  totalCount: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StatisticsService {

  private readonly base = `${environment.apiUrl}/api/admin/statistics`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/admin/statistics/dashboard?period=30|90
   * Feeds all four KPI cards.
   */
  getDashboard(period: 30 | 90 = 30): Observable<DashboardStatsDTO> {
    const params = new HttpParams().set('period', period);
    return this.http.get<DashboardStatsDTO>(`${this.base}/dashboard`, { params });
  }

  /**
   * GET /api/admin/statistics/monthly-trend
   * Feeds the main bar chart (full current calendar year, 12 months).
   */
  getMonthlyTrend(): Observable<MonthlyTrendDTO> {
    return this.http.get<MonthlyTrendDTO>(`${this.base}/monthly-trend`);
  }

  /**
   * GET /api/admin/statistics/partner-revenue?period=30|90
   * Feeds the horizontal bar chart + partner ranking list.
   */
  getPartnerRevenue(period: 30 | 90 = 30): Observable<PartnerRevenueDTO> {
    const params = new HttpParams().set('period', period);
    return this.http.get<PartnerRevenueDTO>(`${this.base}/partner-revenue`, { params });
  }

  /**
   * GET /api/admin/statistics/sources?period=30|90
   * Feeds the doughnut chart + sources table.
   */
  getSources(period: 30 | 90 = 30): Observable<SourceStatsDTO> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SourceStatsDTO>(`${this.base}/sources`, { params });
  }

  /**
   * GET /api/admin/statistics/revenue-distribution?period=30|90
   * Feeds the pie chart (Partenaires vs Directs).
   */
  getRevenueDistribution(period: 30 | 90 = 30): Observable<RevenueDistributionDTO> {
    const params = new HttpParams().set('period', period);
    return this.http.get<RevenueDistributionDTO>(`${this.base}/revenue-distribution`, { params });
  }

  /**
   * GET /api/admin/statistics/passenger-trend
   * Feeds the mini sparkline in the highlight card.
   */
  getPassengerTrend(): Observable<PassengerTrendDTO> {
    return this.http.get<PassengerTrendDTO>(`${this.base}/passenger-trend`);
  }
}