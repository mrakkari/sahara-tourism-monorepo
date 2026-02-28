import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService, Statistics, StatisticsPeriod } from '../../services/statistics.service';
import { TranslatePipe } from '../../core/services/translate.pipe';

@Component({
    selector: 'app-statistiques',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './statistiques.component.html',
    styleUrls: ['./statistiques.component.scss']
})
export class StatistiquesComponent implements OnInit {
    statistics: Statistics | null = null;
    selectedPeriod: StatisticsPeriod = 'month';
    loading = true;

    periods = [
        { value: 'month' as StatisticsPeriod, label: 'Ce mois' },
        { value: 'quarter' as StatisticsPeriod, label: 'Ce trimestre' },
        { value: 'year' as StatisticsPeriod, label: 'Cette année' },
        { value: 'all' as StatisticsPeriod, label: 'Toutes les périodes' }
    ];

    constructor(private statisticsService: StatisticsService) { }

    ngOnInit(): void {
        this.loadStatistics();
    }

    loadStatistics(): void {
        this.loading = true;
        this.statisticsService.getStatistics(this.selectedPeriod).subscribe({
            next: (stats) => {
                this.statistics = stats;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading statistics:', err);
                this.loading = false;
            }
        });
    }

    onPeriodChange(): void {
        this.loadStatistics();
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'approved': '#10B981',
            'pending': '#F59E0B',
            'rejected': '#EF4444'
        };
        return colors[status] || '#64748B';
    }

    getPeriodLabel(): string {
        const period = this.periods.find(p => p.value === this.selectedPeriod);
        return period ? period.label : '';
    }
}