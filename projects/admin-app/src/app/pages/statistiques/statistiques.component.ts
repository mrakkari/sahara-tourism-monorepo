import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { StatisticsService } from '../../core/services/statistics.service';
import { ReservationStats, RevenueStats } from '../../core/models/admin.models';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PartnerRevenue {
  name: string;
  revenue: number;
  percentage: number;
}

interface SourceCount {
  source: string;
  count: number;
  percentage: number;
}

type PeriodType = 30 | 90;
type ViewType = 'revenue' | 'reservations';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="statistics-page" #statisticsPage>
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">📊 Tableau de Bord Analytique</h1>
          <p class="page-subtitle">Analyse en temps réel de vos performances</p>
        </div>
        <div class="header-actions">
          <button 
            class="btn-period" 
            [class.active]="selectedPeriod === 30"
            (click)="changePeriod(30)">
            30 jours
          </button>
          <button 
            class="btn-period" 
            [class.active]="selectedPeriod === 90"
            (click)="changePeriod(90)">
            90 jours
          </button>
          <button class="btn-export" (click)="exportToPDF()">
            📥 Exporter
          </button>
        </div>
      </div>

      <!-- KPI Cards - Top Row -->
      <div class="kpi-grid">
        <div class="kpi-card primary">
          <div class="kpi-header">
            <span class="kpi-icon">💰</span>
            <span class="kpi-trend up">+{{ revenueStats?.revenueGrowth || 12.5 }}%</span>
          </div>
          <div class="kpi-body">
            <h3 class="kpi-value">{{ formatCurrency(revenueStats?.totalRevenue || 10000000) }}</h3>
            <p class="kpi-label">Revenus Total</p>
          </div>
          <div class="kpi-footer">
            <span class="kpi-subtext">vs période précédente</span>
          </div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-header">
            <span class="kpi-icon">📅</span>
            <span class="kpi-trend up">+{{ reservationStats?.growthPercentage || 8.3 }}%</span>
          </div>
          <div class="kpi-body">
            <h3 class="kpi-value">{{ reservationStats?.totalReservations || 753 }}</h3>
            <p class="kpi-label">Total Réservations</p>
          </div>
          <div class="kpi-footer">
            <span class="kpi-subtext">{{ reservationStats?.confirmedReservations || 612 }} confirmées</span>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-header">
            <span class="kpi-icon">⏳</span>
            <span class="kpi-badge">{{ reservationStats?.pendingReservations || 87 }}</span>
          </div>
          <div class="kpi-body">
            <h3 class="kpi-value">{{ getPendingPercentage() }}%</h3>
            <p class="kpi-label">Taux d'Attente</p>
          </div>
          <div class="kpi-footer">
            <span class="kpi-subtext">Nécessite une action</span>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-header">
            <span class="kpi-icon">👥</span>
            <span class="kpi-trend up">+15.2%</span>
          </div>
          <div class="kpi-body">
            <h3 class="kpi-value">{{ passengerDirectCount }}</h3>
            <p class="kpi-label">Clients Directs</p>
          </div>
          <div class="kpi-footer">
            <span class="kpi-subtext">{{ formatCurrency(passengerDirectRevenue) }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        
        <!-- Left Column - Primary Charts -->
        <div class="left-column">
          
          <!-- Revenue/Reservation Trend Chart - Full Width -->
          <div class="chart-card featured">
            <div class="card-header">
              <div>
                <h2 class="card-title">📈 {{ currentView === 'revenue' ? 'Évolution des Revenus' : 'Évolution des Réservations' }}</h2>
                <p class="card-subtitle">{{ currentView === 'revenue' ? 'Performance mensuelle (TND)' : 'Nombre de réservations par mois' }}</p>
              </div>
              <div class="card-actions">
                <button 
                  class="btn-filter" 
                  [class.active]="currentView === 'revenue'"
                  (click)="changeView('revenue')">
                  Revenus
                </button>
                <button 
                  class="btn-filter" 
                  [class.active]="currentView === 'reservations'"
                  (click)="changeView('reservations')">
                  Réservations
                </button>
              </div>
            </div>
            <div class="chart-container large">
              <canvas baseChart
                *ngIf="barChartData"
                [data]="barChartData"
                [options]="barChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
            <div class="chart-stats">
              <div class="stat-pill">
                <span class="stat-label">Moyenne mensuelle</span>
                <span class="stat-value">{{ currentView === 'revenue' ? formatCurrency(getMonthlyAverage()) : getMonthlyAverage().toFixed(0) }}</span>
              </div>
              <div class="stat-pill">
                <span class="stat-label">Meilleur mois</span>
                <span class="stat-value">{{ getBestMonth() }}</span>
              </div>
            </div>
          </div>

          <!-- Partner Revenue Chart -->
          <div class="chart-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">🤝 Top Partenaires</h2>
                <p class="card-subtitle">Performance par partenaire</p>
              </div>
            </div>
            <div class="chart-container medium">
              <canvas baseChart
                *ngIf="partnerRevenueChartData"
                [data]="partnerRevenueChartData"
                [options]="partnerRevenueChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
            <div class="partner-list">
              <div class="partner-item" *ngFor="let partner of partnerRevenueData.slice(0, 3)">
                <div class="partner-rank">
                  <span class="rank-badge">{{ partnerRevenueData.indexOf(partner) + 1 }}</span>
                  <span class="partner-name">{{ partner.name }}</span>
                </div>
                <div class="partner-metrics">
                  <span class="partner-revenue">{{ formatCurrency(partner.revenue) }}</span>
                  <span class="partner-percentage">{{ partner.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column - Secondary Metrics -->
        <div class="right-column">
          
          <!-- Source Distribution -->
          <div class="chart-card compact">
            <div class="card-header">
              <h2 class="card-title">📍 Sources de Réservation</h2>
              <p class="card-subtitle">Canaux d'acquisition</p>
            </div>
            <div class="chart-container small">
              <canvas baseChart
                *ngIf="doughnutChartData"
                [data]="doughnutChartData"
                [options]="doughnutChartOptions"
                [type]="'doughnut'">
              </canvas>
            </div>
            <div class="source-list">
              <div class="source-item-compact" *ngFor="let source of sourceData.slice(0, 4)">
                <div class="source-indicator" [style.background-color]="getSourceColor(source.source)"></div>
                <span class="source-name">{{ source.source }}</span>
                <span class="source-value">{{ source.percentage }}%</span>
              </div>
            </div>
          </div>

          <!-- Revenue Distribution Pie -->
          <div class="chart-card compact">
            <div class="card-header">
              <h2 class="card-title">💼 Distribution Revenus</h2>
              <p class="card-subtitle">Partenaires vs Directs</p>
            </div>
            <div class="chart-container small">
              <canvas baseChart
                *ngIf="revenueDistributionChartData"
                [data]="revenueDistributionChartData"
                [options]="pieChartOptions"
                [type]="'pie'">
              </canvas>
            </div>
            <div class="distribution-summary">
              <div class="summary-row">
                <div class="summary-dot partners"></div>
                <span class="summary-label">Partenaires</span>
                <span class="summary-value">{{ getPartnerRevenueTotal() }}</span>
              </div>
              <div class="summary-row">
                <div class="summary-dot direct"></div>
                <span class="summary-label">Directs</span>
                <span class="summary-value">{{ passengerRevenuePercentage }}%</span>
              </div>
            </div>
          </div>

          <!-- Passenger Direct Card -->
          <div class="chart-card highlight">
            <div class="highlight-content">
              <div class="highlight-icon">👥</div>
              <div class="highlight-data">
                <h3 class="highlight-title">Passagers Directs</h3>
                <p class="highlight-value">{{ formatCurrency(passengerDirectRevenue) }}</p>
                <div class="highlight-stats">
                  <span class="highlight-count">{{ passengerDirectCount }} réservations</span>
                  <span class="highlight-badge">{{ passengerRevenuePercentage }}%</span>
                </div>
              </div>
            </div>
            <div class="mini-trend">
              <canvas baseChart
                *ngIf="passengerTrendChartData"
                [data]="passengerTrendChartData"
                [options]="miniChartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </div>

        </div>
      </div>

      <!-- Bottom Section - Detailed Sources Table -->
      <div class="bottom-section">
        <div class="table-card">
          <div class="card-header">
            <h2 class="card-title">📊 Analyse Détaillée des Sources</h2>
          </div>
          <div class="sources-table">
            <div class="table-header">
              <div class="th rank">#</div>
              <div class="th source">Source</div>
              <div class="th count">Réservations</div>
              <div class="th percentage">Part de marché</div>
              <div class="th trend">Tendance</div>
            </div>
            <div class="table-row" *ngFor="let source of sourceData; let i = index">
              <div class="td rank">{{ i + 1 }}</div>
              <div class="td source">
                <div class="source-badge" [style.background-color]="getSourceColor(source.source)"></div>
                <span class="source-text">{{ source.source }}</span>
              </div>
              <div class="td count">{{ source.count }}</div>
              <div class="td percentage">
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-fill" 
                       [style.width.%]="source.percentage"
                       [style.background-color]="getSourceColor(source.source)">
                  </div>
                  <span class="progress-text">{{ source.percentage }}%</span>
                </div>
              </div>
              <div class="td trend">
                <span class="trend-indicator up">↗ +{{ getRandomTrend() }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isExporting">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Génération du PDF en cours...</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .statistics-page {
      min-height: 100vh;
      background: #f8fafc;
      padding: 24px;
      position: relative;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .header-content p {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-period, .btn-export {
      padding: 8px 16px;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .btn-period:hover {
      border-color: #667eea;
      color: #667eea;
    }

    .btn-period.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .btn-export {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .btn-export:hover {
      background: #059669;
      border-color: #059669;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
    }

    .kpi-card.primary::before { background: linear-gradient(90deg, #667eea, #764ba2); }
    .kpi-card.success::before { background: linear-gradient(90deg, #10b981, #059669); }
    .kpi-card.warning::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .kpi-card.info::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .kpi-icon {
      font-size: 2rem;
    }

    .kpi-trend {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .kpi-trend.up {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .kpi-badge {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .kpi-body {
      margin-bottom: 12px;
    }

    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .kpi-label {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      font-weight: 500;
    }

    .kpi-footer {
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }

    .kpi-subtext {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .left-column, .right-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Chart Cards */
    .chart-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .chart-card.featured {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .chart-card.compact {
      padding: 20px;
    }

    .chart-card.highlight {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .featured .card-header {
      color: white;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .featured .card-title, .highlight .card-title {
      color: white;
    }

    .card-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .featured .card-subtitle {
      color: rgba(255, 255, 255, 0.8);
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }

    .btn-filter {
      padding: 6px 14px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-filter:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .btn-filter.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-color: rgba(255, 255, 255, 0.5);
    }

    /* Chart Containers */
    .chart-container.large {
      height: 350px;
      position: relative;
    }

    .chart-container.medium {
      height: 300px;
      position: relative;
    }

    .chart-container.small {
      height: 200px;
      position: relative;
    }

    .chart-stats {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    .stat-pill {
      flex: 1;
      background: rgba(255, 255, 255, 0.15);
      padding: 12px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
    }

    /* Partner List */
    .partner-list {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .partner-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
      transition: all 0.2s;
    }

    .partner-item:hover {
      background: #f1f5f9;
      transform: translateX(4px);
    }

    .partner-rank {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rank-badge {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .partner-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
    }

    .partner-metrics {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .partner-revenue {
      font-weight: 700;
      color: #1e293b;
      font-size: 1rem;
    }

    .partner-percentage {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.8rem;
    }

    /* Source List */
    .source-list {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .source-item-compact {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .source-indicator {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .source-name {
      flex: 1;
      font-weight: 500;
      color: #1e293b;
      font-size: 0.9rem;
    }

    .source-value {
      font-weight: 700;
      color: #667eea;
      font-size: 0.9rem;
    }

    /* Distribution Summary */
    .distribution-summary {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .summary-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .summary-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .summary-dot.partners {
      background: #3b82f6;
    }

    .summary-dot.direct {
      background: #8b5cf6;
    }

    .summary-label {
      flex: 1;
      font-weight: 500;
      color: #64748b;
      font-size: 0.9rem;
    }

    .summary-value {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.9rem;
    }

    /* Highlight Card */
    .highlight-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .highlight-icon {
      font-size: 3rem;
      opacity: 0.9;
    }

    .highlight-data {
      flex: 1;
    }

    .highlight-title {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .highlight-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      margin: 0 0 10px 0;
    }

    .highlight-stats {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .highlight-count {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .highlight-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.8rem;
      color: white;
    }

    .mini-trend {
      height: 80px;
      position: relative;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 10px;
    }

    /* Bottom Section - Table */
    .bottom-section {
      margin-top: 24px;
    }

    .table-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .btn-view-all {
      background: transparent;
      border: 2px solid #e2e8f0;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      color: #64748b;
    }

    .btn-view-all:hover {
      background: #f8fafc;
      border-color: #667eea;
      color: #667eea;
    }

    .sources-table {
      margin-top: 20px;
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 50px 2fr 1fr 2fr 1fr;
      gap: 16px;
      align-items: center;
      padding: 12px 16px;
    }

    .table-header {
      background: #f8fafc;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 8px;
    }

    .table-row {
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.2s;
    }

    .table-row:hover {
      background: #f8fafc;
      border-radius: 10px;
    }

    .source-badge {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 10px;
    }

    .source-text {
      font-weight: 500;
      color: #1e293b;
    }

    .td.source {
      display: flex;
      align-items: center;
    }

    .td.count {
      font-weight: 600;
      color: #1e293b;
    }

    .progress-bar-wrapper {
      position: relative;
      background: #f1f5f9;
      border-radius: 10px;
      height: 24px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s;
      opacity: 0.2;
    }

    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: 600;
      font-size: 0.85rem;
      color: #1e293b;
    }

    .trend-indicator {
      font-weight: 600;
      font-size: 0.85rem;
    }

    .trend-indicator.up {
      color: #10b981;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-spinner {
      background: white;
      padding: 40px;
      border-radius: 16px;
      text-align: center;
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 20px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-spinner p {
      color: #1e293b;
      font-weight: 500;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .statistics-page {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .table-header, .table-row {
        grid-template-columns: 40px 1fr 80px;
        gap: 8px;
        font-size: 0.85rem;
      }

      .td.percentage, .td.trend {
        display: none;
      }

      .th.percentage, .th.trend {
        display: none;
      }
    }
  `]
})
export class StatistiquesComponent implements OnInit {
  reservationStats: ReservationStats | null = null;
  revenueStats: RevenueStats | null = null;
  
  selectedPeriod: PeriodType = 30;
  currentView: ViewType = 'revenue';
  isExporting: boolean = false;

  // Data for 30 days
  data30Days = {
    revenue: [750000, 820000, 890000, 920000, 1050000, 980000, 1120000, 1200000, 1080000, 1150000, 1280000, 1350000],
    reservations: [52, 58, 65, 68, 75, 72, 82, 89, 78, 84, 93, 98],
    totalRevenue: 10000000,
    totalReservations: 753,
    confirmedReservations: 612,
    pendingReservations: 87,
    revenueGrowth: 12.5,
    reservationGrowth: 8.3,
    passengerDirectRevenue: 1450000,
    passengerDirectCount: 156
  };

  // Data for 90 days
  data90Days = {
    revenue: [650000, 720000, 780000, 850000, 920000, 880000, 950000, 1020000, 990000, 1080000, 1150000, 1220000],
    reservations: [48, 54, 61, 65, 70, 68, 74, 80, 76, 82, 88, 95],
    totalRevenue: 8500000,
    totalReservations: 651,
    confirmedReservations: 528,
    pendingReservations: 72,
    revenueGrowth: 18.7,
    reservationGrowth: 14.2,
    passengerDirectRevenue: 1250000,
    passengerDirectCount: 134
  };

  // Source data with counts
  sourceData: SourceCount[] = [
    { source: 'Airbnb', count: 245, percentage: 32.5 },
    { source: 'GetYourGuide', count: 189, percentage: 25.1 },
    { source: 'Booking', count: 156, percentage: 20.7 },
    { source: 'Partenaire', count: 87, percentage: 11.6 },
    { source: 'App', count: 43, percentage: 5.7 },
    { source: 'TripAdvisor', count: 21, percentage: 2.8 },
    { source: 'Email', count: 12, percentage: 1.6 }
  ];

  // Partner revenue data
  partnerRevenueData: PartnerRevenue[] = [
    { name: 'Bonheur voyage', revenue: 2850000, percentage: 28.5 },
    { name: 'costa travel', revenue: 2340000, percentage: 23.4 },
    { name: 'Desert Rose service', revenue: 1920000, percentage: 19.2 },
    { name: 'Rawia Travel', revenue: 1560000, percentage: 15.6 },
    { name: 'lotos voyages', revenue: 890000, percentage: 8.9 },
    { name: 'Tunisian Colors travel', revenue: 440000, percentage: 4.4 }
  ];

  // Passenger direct revenue
  passengerDirectRevenue: number = 1450000;
  passengerDirectCount: number = 156;
  passengerRevenuePercentage: number = 12.7;

  // Chart configurations
  doughnutChartData: ChartData<'doughnut'> | null = null;
  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value} réservations`;
          }
        }
      }
    },
    cutout: '70%'
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 }
        }
      }
    }
  };

  barChartData: ChartData<'bar'> | null = null;
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      }
    }
  };

  partnerRevenueChartData: ChartData<'bar'> | null = null;
  partnerRevenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${this.formatCurrency(context.parsed.x ?? 0)}`;
          }
        }
      }
    },
    scales: {
      x: { 
        beginAtZero: true,
        grid: {
          color: '#f1f5f9'
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  revenueDistributionChartData: ChartData<'pie'> | null = null;
  passengerTrendChartData: ChartData<'line'> | null = null;
  miniChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 }
    }
  };

  constructor(private statisticsService: StatisticsService) { }

  ngOnInit(): void {
    this.loadStatistics();
    this.setupSourceChart();
    this.setupPartnerRevenueChart();
    this.setupRevenueDistributionChart();
    this.setupPassengerTrendChart();
    this.updateCharts();
  }

  loadStatistics(): void {
    this.statisticsService.getReservationStats().subscribe(stats => {
      this.reservationStats = stats;
    });

    this.statisticsService.getRevenueStats().subscribe(stats => {
      this.revenueStats = stats;
    });
  }

  changePeriod(period: PeriodType): void {
    this.selectedPeriod = period;
    this.updateCharts();
    this.updateKPIs();
  }

  changeView(view: ViewType): void {
    this.currentView = view;
    this.updateMainChart();
  }

  updateCharts(): void {
    this.updateMainChart();
  }

  updateMainChart(): void {
    const data = this.selectedPeriod === 30 ? this.data30Days : this.data90Days;
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    const chartData = this.currentView === 'revenue' ? data.revenue : data.reservations;
    
    this.barChartData = {
      labels: months,
      datasets: [{
        label: this.currentView === 'revenue' ? 'Revenus' : 'Réservations',
        data: chartData,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 8
      }]
    };
  }

  updateKPIs(): void {
    const data = this.selectedPeriod === 30 ? this.data30Days : this.data90Days;
    
    // Update the stats objects
    if (this.revenueStats) {
      this.revenueStats = {
        ...this.revenueStats,
        totalRevenue: data.totalRevenue,
        revenueGrowth: data.revenueGrowth,
        monthlyRevenue: data.revenue
      };
    }

    if (this.reservationStats) {
      this.reservationStats = {
        ...this.reservationStats,
        totalReservations: data.totalReservations,
        confirmedReservations: data.confirmedReservations,
        pendingReservations: data.pendingReservations,
        growthPercentage: data.reservationGrowth
      };
    }

    this.passengerDirectRevenue = data.passengerDirectRevenue;
    this.passengerDirectCount = data.passengerDirectCount;
  }

  async exportToPDF(): Promise<void> {
    this.isExporting = true;

    try {
      const element = document.querySelector('.statistics-page') as HTMLElement;
      
      if (!element) {
        console.error('Element not found');
        this.isExporting = false;
        return;
      }

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`statistiques-${this.selectedPeriod}jours-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      this.isExporting = false;
    }
  }

  setupSourceChart(): void {
    this.doughnutChartData = {
      labels: this.sourceData.map(d => d.source),
      datasets: [{
        data: this.sourceData.map(d => d.count),
        backgroundColor: [
          '#ff385c',
          '#f97316',
          '#0071c2',
          '#8b5cf6',
          '#10b981',
          '#00aa6c',
          '#64748b'
        ],
        borderWidth: 0
      }]
    };
  }

  setupPartnerRevenueChart(): void {
    this.partnerRevenueChartData = {
      labels: this.partnerRevenueData.map(p => p.name),
      datasets: [{
        label: 'Revenus',
        data: this.partnerRevenueData.map(p => p.revenue),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899'
        ],
        borderRadius: 8
      }]
    };
  }

  setupRevenueDistributionChart(): void {
    const totalPartnerRevenue = this.partnerRevenueData.reduce((sum, p) => sum + p.revenue, 0);

    this.revenueDistributionChartData = {
      labels: ['Partenaires', 'Passagers Directs'],
      datasets: [{
        data: [totalPartnerRevenue, this.passengerDirectRevenue],
        backgroundColor: ['#3b82f6', '#8b5cf6'],
        borderWidth: 0
      }]
    };
  }

  setupPassengerTrendChart(): void {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const trendData = [95000, 112000, 128000, 135000, 148000, 156000];

    this.passengerTrendChartData = {
      labels: months,
      datasets: [{
        data: trendData,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2
      }]
    };
  }

  getSourceColor(source: string): string {
    const colors: { [key: string]: string } = {
      'Airbnb': '#ff385c',
      'GetYourGuide': '#f97316',
      'Booking': '#0071c2',
      'TripAdvisor': '#00aa6c',
      'Email': '#64748b',
      'App': '#10b981',
      'Partenaire': '#8b5cf6'
    };
    return colors[source] || '#64748b';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0
    }).format(value);
  }

  getPendingPercentage(): number {
    const total = this.reservationStats?.totalReservations || 753;
    const pending = this.reservationStats?.pendingReservations || 87;
    return Math.round((pending / total) * 100);
  }

  getMonthlyAverage(): number {
    const data = this.selectedPeriod === 30 ? this.data30Days : this.data90Days;
    const values = this.currentView === 'revenue' ? data.revenue : data.reservations;
    const total = values.reduce((sum, val) => sum + val, 0);
    return total / values.length;
  }

  getBestMonth(): string {
    const data = this.selectedPeriod === 30 ? this.data30Days : this.data90Days;
    const values = this.currentView === 'revenue' ? data.revenue : data.reservations;
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const maxIndex = values.indexOf(Math.max(...values));
    return months[maxIndex];
  }

  getPartnerRevenueTotal(): string {
    const total = this.partnerRevenueData.reduce((sum, p) => sum + p.revenue, 0);
    const totalRevenue = total + this.passengerDirectRevenue;
    return `${Math.round((total / totalRevenue) * 100)}%`;
  }

  getRandomTrend(): number {
    return Math.floor(Math.random() * 20) + 5;
  }
}