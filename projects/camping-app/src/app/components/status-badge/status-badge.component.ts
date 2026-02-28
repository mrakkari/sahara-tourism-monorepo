import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type StatusType = 'pending' | 'confirmed' | 'rejected' | 'arrived' | 'cancelled' |
    'paid' | 'partial' | 'completed' | 'checked-out';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span class="status-badge" [class]="'badge-' + status" [class.with-icon]="showIcon">
      <span class="badge-icon" *ngIf="showIcon">{{ getIcon() }}</span>
      <span class="badge-label">{{ label || getLabel() }}</span>
    </span>
  `,
    styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      transition: transform 0.2s ease;
    }

    .status-badge.with-icon {
      padding-left: 10px;
    }

    .badge-icon {
      font-size: 0.9rem;
    }

    /* Pending - Orange/Amber */
    .badge-pending {
      background: rgba(245, 158, 11, 0.1);
      color: #F59E0B;
    }

    /* Confirmed - Green */
    .badge-confirmed {
      background: rgba(16, 185, 129, 0.1);
      color: #10B981;
    }

    /* Rejected - Red */
    .badge-rejected {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    /* Arrived - Blue */
    .badge-arrived {
      background: rgba(59, 130, 246, 0.1);
      color: #3B82F6;
    }

    /* Cancelled - Gray */
    .badge-cancelled {
      background: rgba(100, 116, 139, 0.1);
      color: #64748B;
    }

    /* Paid/Completed - Purple */
    .badge-paid,
    .badge-completed {
      background: rgba(139, 92, 246, 0.1);
      color: #8B5CF6;
    }

    /* Partial - Sky Blue */
    .badge-partial {
      background: rgba(14, 165, 233, 0.1);
      color: #0EA5E9;
    }
    
    /* Checked-out - Dark Gray/Black */
    .badge-checked-out {
      background: rgba(33, 37, 41, 0.1);
      color: #212529;
    }

    /* Hover effect */
    .status-badge:hover {
      transform: scale(1.02);
    }
  `]
})
export class StatusBadgeComponent {
    @Input() status: StatusType = 'pending';
    @Input() label?: string;
    @Input() showIcon = true;

    getIcon(): string {
        const icons: Record<StatusType, string> = {
            'pending': '⏳',
            'confirmed': '✅',
            'rejected': '❌',
            'arrived': '🎉',
            'cancelled': '🚫',
            'paid': '💰',
            'partial': '💳',
            'completed': '✓',
            'checked-out': '👋'
        };
        return icons[this.status] || '📋';
    }

    getLabel(): string {
        const labels: Record<StatusType, string> = {
            'pending': 'En attente',
            'confirmed': 'Confirmé',
            'rejected': 'Rejeté',
            'arrived': 'Arrivé',
            'cancelled': 'Annulé',
            'paid': 'Payé',
            'partial': 'Partiel',
            'completed': 'Terminé',
            'checked-out': 'Parti'
        };
        return labels[this.status] || this.status;
    }
}
