import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import {
  StatisticsService,
  DashboardStatsDTO,
  MonthlyTrendDTO,
  PartnerRevenueDTO,
  SourceStatsDTO,
  RevenueDistributionDTO,
  PassengerTrendDTO,
} from '../../core/services/statistics.service';

// ─── Local view types ─────────────────────────────────────────────────────────
type PeriodType = 30 | 90;
type ViewType   = 'revenue' | 'reservations';

// ─── Simplified local shapes (mapped from DTOs) ───────────────────────────────
interface PartnerRevenue {
  name:       string;
  revenue:    number;
  percentage: number;
}

interface SourceCount {
  source:     string;
  count:      number;
  percentage: number;
}

@Component({
  selector:    'app-statistiques',
  standalone:  true,
  imports:     [CommonModule, BaseChartDirective],
  templateUrl: './statistiques.component.html',
  styleUrls:   ['./statistiques.component.scss'],
})
export class StatistiquesComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────────────────────
  selectedPeriod: PeriodType = 30;
  currentView:    ViewType   = 'revenue';
  isLoading  = false;
  isExporting = false;
  hasError   = false;

  // ── Data from API ──────────────────────────────────────────────────────────
  dashboard:           DashboardStatsDTO      | null = null;
  monthlyTrend:        MonthlyTrendDTO        | null = null;
  revenueDistribution: RevenueDistributionDTO | null = null;
  passengerTrend:      PassengerTrendDTO      | null = null;

  partnerRevenueData: PartnerRevenue[] = [];
  sourceData:         SourceCount[]    = [];

  // ── Chart data ─────────────────────────────────────────────────────────────
  barChartData:                ChartData<'bar'>      | null = null;
  partnerRevenueChartData:     ChartData<'bar'>      | null = null;
  doughnutChartData:           ChartData<'doughnut'> | null = null;
  revenueDistributionChartData:ChartData<'pie'>      | null = null;
  passengerTrendChartData:     ChartData<'line'>     | null = null;

  // ── Chart options (static, defined once) ──────────────────────────────────
  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid:  { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: 'rgba(255,255,255,0.8)' },
      },
      x: {
        grid:  { display: false },
        ticks: { color: 'rgba(255,255,255,0.8)' },
      },
    },
  };

  readonly partnerRevenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => this.formatCurrency(ctx.parsed.x ?? 0),
        },
      },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      y: { grid: { display: false } },
    },
  };

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed} réservations`,
        },
      },
    },
  };

  readonly pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 15, font: { size: 12 } },
      },
    },
  };

  readonly miniChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } },
  };

  // ── Source color map ───────────────────────────────────────────────────────
  private readonly SOURCE_COLORS: Record<string, string> = {
    Airbnb:       '#ff385c',
    GetYourGuide: '#f97316',
    Booking:      '#0071c2',
    TripAdvisor:  '#00aa6c',
    Email:        '#64748b',
    App:          '#10b981',
    Partenaire:   '#8b5cf6',
    Direct:       '#3b82f6',
  };

  private readonly CHART_COLORS = [
    '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#64748b',
  ];

  private destroy$ = new Subject<void>();

  constructor(private statisticsService: StatisticsService) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  /**
   * Load everything in parallel using forkJoin.
   * Monthly trend and passenger trend don't need the period param.
   */
  loadAllData(): void {
    this.isLoading = true;
    this.hasError  = false;

    forkJoin({
      dashboard:           this.statisticsService.getDashboard(this.selectedPeriod),
      monthlyTrend:        this.statisticsService.getMonthlyTrend(),
      partnerRevenue:      this.statisticsService.getPartnerRevenue(this.selectedPeriod),
      sources:             this.statisticsService.getSources(this.selectedPeriod),
      revenueDistribution: this.statisticsService.getRevenueDistribution(this.selectedPeriod),
      passengerTrend:      this.statisticsService.getPassengerTrend(),
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.isLoading = false)),
    )
    .subscribe({
      next: (results) => {
        // ── Store raw DTOs ──────────────────────────────────────────
        this.dashboard           = results.dashboard;
        this.monthlyTrend        = results.monthlyTrend;
        this.revenueDistribution = results.revenueDistribution;
        this.passengerTrend      = results.passengerTrend;

        // ── Map partner data to local shape ─────────────────────────
        this.partnerRevenueData = results.partnerRevenue.partners.map(p => ({
          name:       p.name,
          revenue:    p.revenue,
          percentage: p.percentage,
        }));

        // ── Map source data to local shape ──────────────────────────
        this.sourceData = results.sources.sources.map(s => ({
          source:     s.source,
          count:      Number(s.count),
          percentage: s.percentage,
        }));

        // ── Build all charts ────────────────────────────────────────
        this.buildMainBarChart();
        this.buildPartnerChart();
        this.buildDoughnutChart();
        this.buildPieChart();
        this.buildPassengerSparkline();
      },
      error: (err) => {
        console.error('Statistics load error:', err);
        this.hasError = true;
      },
    });
  }

  /**
   * Reload only period-sensitive endpoints when the user switches periods.
   * Monthly trend and passenger trend are calendar-year based — skip them.
   */
  private reloadPeriodData(): void {
    this.isLoading = true;
    this.hasError  = false;

    forkJoin({
      dashboard:           this.statisticsService.getDashboard(this.selectedPeriod),
      partnerRevenue:      this.statisticsService.getPartnerRevenue(this.selectedPeriod),
      sources:             this.statisticsService.getSources(this.selectedPeriod),
      revenueDistribution: this.statisticsService.getRevenueDistribution(this.selectedPeriod),
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.isLoading = false)),
    )
    .subscribe({
      next: (results) => {
        this.dashboard           = results.dashboard;
        this.revenueDistribution = results.revenueDistribution;

        this.partnerRevenueData = results.partnerRevenue.partners.map(p => ({
          name: p.name, revenue: p.revenue, percentage: p.percentage,
        }));

        this.sourceData = results.sources.sources.map(s => ({
          source: s.source, count: Number(s.count), percentage: s.percentage,
        }));

        this.buildPartnerChart();
        this.buildDoughnutChart();
        this.buildPieChart();
      },
      error: (err) => {
        console.error('Period reload error:', err);
        this.hasError = true;
      },
    });
  }

  // ── User interactions ──────────────────────────────────────────────────────

  changePeriod(period: PeriodType): void {
    if (this.selectedPeriod === period) return;
    this.selectedPeriod = period;
    this.reloadPeriodData();
  }

  changeView(view: ViewType): void {
    this.currentView = view;
    this.buildMainBarChart(); // just re-render with same data, different dataset
  }

  // ── Chart builders ─────────────────────────────────────────────────────────

  private buildMainBarChart(): void {
    if (!this.monthlyTrend) return;

    const data = this.currentView === 'revenue'
      ? this.monthlyTrend.revenue
      : this.monthlyTrend.reservations;

    this.barChartData = {
      labels: this.monthlyTrend.labels,
      datasets: [{
        label: this.currentView === 'revenue' ? 'Revenus (TND)' : 'Réservations',
        data,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 8,
      }],
    };
  }

  private buildPartnerChart(): void {
    this.partnerRevenueChartData = {
      labels: this.partnerRevenueData.map(p => p.name),
      datasets: [{
        label: 'Revenus',
        data:  this.partnerRevenueData.map(p => p.revenue),
        backgroundColor: this.CHART_COLORS,
        borderRadius: 8,
      }],
    };
  }

  private buildDoughnutChart(): void {
    this.doughnutChartData = {
      labels: this.sourceData.map(s => s.source),
      datasets: [{
        data:            this.sourceData.map(s => s.count),
        backgroundColor: this.sourceData.map(s => this.getSourceColor(s.source)),
        borderWidth: 0,
      }],
    };
  }

  private buildPieChart(): void {
    if (!this.revenueDistribution) return;

    this.revenueDistributionChartData = {
      labels: ['Partenaires', 'Passagers Directs'],
      datasets: [{
        data: [
          this.revenueDistribution.partnerRevenue,
          this.revenueDistribution.directRevenue,
        ],
        backgroundColor: ['#3b82f6', '#8b5cf6'],
        borderWidth: 0,
      }],
    };
  }

  private buildPassengerSparkline(): void {
    if (!this.passengerTrend) return;

    this.passengerTrendChartData = {
      labels: this.passengerTrend.labels,
      datasets: [{
        data:            this.passengerTrend.revenue,
        borderColor:     'rgba(255,255,255,0.8)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        tension:         0.4,
        fill:            true,
        borderWidth:     2,
      }],
    };
  }

  // ── PDF export ─────────────────────────────────────────────────────────────

  async exportToPDF(): Promise<void> {
    this.isExporting = true;
    try {
      const element = document.querySelector('.statistics-page') as HTMLElement;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#f8fafc',
      });

      const pdf        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData    = canvas.toDataURL('image/png');
      const imgWidth   = 210;
      const pageHeight = 297;
      const imgHeight  = (canvas.height * imgWidth) / canvas.width;
      let   heightLeft = imgHeight;
      let   position   = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const date = new Date().toISOString().split('T')[0];
      pdf.save(`statistiques-${this.selectedPeriod}jours-${date}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Erreur lors de la génération du PDF');
    } finally {
      this.isExporting = false;
    }
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  getPendingPercentage(): number {
    if (!this.dashboard || this.dashboard.totalReservations === 0) return 0;
    return Math.round(
      (this.dashboard.pendingReservations / this.dashboard.totalReservations) * 100
    );
  }

  getMonthlyAverage(): number {
    if (!this.monthlyTrend) return 0;
    const values = this.currentView === 'revenue'
      ? this.monthlyTrend.revenue
      : this.monthlyTrend.reservations;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return values.length ? sum / values.length : 0;
  }

  getBestMonth(): string {
    if (!this.monthlyTrend) return '—';
    const values = this.currentView === 'revenue'
      ? this.monthlyTrend.revenue
      : this.monthlyTrend.reservations;
    const maxIdx = values.indexOf(Math.max(...values));
    return this.monthlyTrend.labels[maxIdx] ?? '—';
  }

  getSourceColor(source: string): string {
    return this.SOURCE_COLORS[source] ?? '#64748b';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency', currency: 'TND', minimumFractionDigits: 0,
    }).format(value);
  }
}