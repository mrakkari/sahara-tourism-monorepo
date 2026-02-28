import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'lib-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stat-premium">
      <div class="stat-content">
        <span class="stat-label">{{ label }}</span>
        <div class="stat-value-row">
          <span class="stat-value">{{ value }}</span>
          <span class="stat-trend" 
                [class.positive]="trend > 0" 
                [class.negative]="trend < 0"
                *ngIf="trend !== 0">
            {{ trend > 0 ? '↗' : '↘' }} {{ Math.abs(trend) }}%
          </span>
        </div>
        <span class="stat-period" *ngIf="trendPeriod">vs {{ trendPeriod }}</span>
      </div>
      
      <!-- Floating 3D Icon Container -->
      <div class="icon-container" [style.background]="getGlassGradient()">
        <span class="stat-icon">{{ icon }}</span>
      </div>
    </div>
  `,
    styles: [`
    .stat-premium {
      position: relative;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 24px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.05), 
        0 10px 15px -3px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .stat-premium:hover {
      transform: translateY(-4px);
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 0 20px rgba(14, 165, 233, 0.1);
    }

    .stat-content {
      position: relative;
      z-index: 2;
    }

    .stat-label {
      display: block;
      color: #64748B;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: #1E293B;
      letter-spacing: -1px;
    }

    .stat-trend {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 20px;
    }

    .stat-trend.positive {
      color: #10B981;
      background: rgba(16, 185, 129, 0.1);
    }

    .stat-trend.negative {
      color: #EF4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .stat-period {
      display: block;
      margin-top: 4px;
      font-size: 0.8rem;
      color: #94A3B8;
    }

    .icon-container {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      transform: rotate(-5deg);
      transition: transform 0.3s ease;
    }

    .stat-premium:hover .icon-container {
      transform: rotate(0deg) scale(1.1);
    }
  `]
})
export class StatCardComponent {
    @Input() icon = '📊';
    @Input() value: number | string = 0;
    @Input() label = 'Stat';
    @Input() trend = 0;
    @Input() trendPeriod = '';
    @Input() iconGradient = ''; // Still accepted but we'll use a glass default if not matched

    Math = Math;

    getGlassGradient() {
        // Return custom gradient if provided, else a nice default glass
        return this.iconGradient || 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2))';
    }
}
