import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../core/services/reservation.service';
import { Reservation } from '../../core/models/reservation.model';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { GlassCardComponent } from '../../components/glass-card/glass-card.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, StatCardComponent, GlassCardComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  reservations: Reservation[] = [];

  totalRevenue = 0;
  totalReservations = 0;
  activePartners = 0;
  topPartners: any[] = [];

  lineChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [],
      label: 'Revenue (TND)',
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
        return gradient;
      },
      borderColor: '#0EA5E9',
      borderWidth: 3,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#0EA5E9',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.4
    }],
    labels: []
  };

  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: { size: 14, family: 'Inter' },
        bodyFont: { size: 14, family: 'Inter', weight: 'bold' },
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { family: 'Inter' } }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.5)', drawBorder: false },
        ticks: { color: '#64748B', font: { family: 'Inter' }, callback: (value: any) => value + ' TND' }
      }
    }
  };

  pieChartData: ChartData<'doughnut', number[], string | string[]> = {
    labels: ['Confirmed', 'Pending', 'Rejected'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      hoverOffset: 4,
      borderWidth: 0
    }]
  };

  pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, pointStyle: 'circle', font: { family: 'Inter', size: 12 } }
      }
    }
  };

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.reservationService.getAllReservations().subscribe(data => {
      this.reservations = data;
      this.calculateMetrics();
      this.generateChartData();
    });
  }

  calculateMetrics(): void {
    this.totalReservations = this.reservations.length;
    this.totalRevenue = this.reservations.reduce((acc, curr) => acc + curr.payment.paidAmount, 0);

    const partnerMap = new Map<string, { name: string, revenue: number, count: number }>();

    this.reservations.forEach(r => {
      const current = partnerMap.get(r.partnerName) || { name: r.partnerName, revenue: 0, count: 0 };
      current.revenue += r.payment.paidAmount;
      current.count += 1;
      partnerMap.set(r.partnerName, current);
    });

    this.activePartners = partnerMap.size;
    const maxRevenue = Math.max(...Array.from(partnerMap.values()).map(p => p.revenue)) || 1;

    this.topPartners = Array.from(partnerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        percentage: (p.revenue / maxRevenue) * 100
      }));
  }

  generateChartData(): void {
    let confirmed = 0, pending = 0, rejected = 0;
    this.reservations.forEach(r => {
      if (r.status === 'confirmed' || r.status === 'arrived') confirmed++;
      else if (r.status === 'pending') pending++;
      else if (r.status === 'rejected' || r.status === 'cancelled') rejected++;
    });

    this.pieChartData.datasets[0].data = [confirmed, pending, rejected];

    const labels = [];
    const data = [];

    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

      // Allow partial match for simplicity if createdAt has time
      const dayRevenue = this.reservations
        .filter(r => r.createdAt.includes(dateStr))
        .reduce((acc, curr) => acc + curr.payment.paidAmount, 0);

      data.push(dayRevenue);
    }

    this.lineChartData.labels = labels;
    this.lineChartData.datasets[0].data = data;
  }

  getPendingCount(): number {
    return this.reservations.filter(r => r.status === 'pending').length;
  }
}