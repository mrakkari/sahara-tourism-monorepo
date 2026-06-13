import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type StatusType = 'pending' | 'confirmed' | 'rejected' | 'arrived' | 'cancelled' |
    'paid' | 'partial' | 'completed';

@Component({
    selector: 'lib-status-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span class="status-badge" [class]="'badge-' + status">
      <span class="badge-dot"></span>
      <span class="badge-label">{{ label || getLabel() }}</span>
    </span>
  `,
    styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px 3px 7px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Pending - Amber */
    .badge-pending {
      background: rgba(245,158,11,0.10);
      color: #92400E;
    }
    .badge-pending .badge-dot { background: #F59E0B; }

    /* Confirmed - Green */
    .badge-confirmed {
      background: rgba(16,185,129,0.10);
      color: #065F46;
    }
    .badge-confirmed .badge-dot { background: #10B981; }

    /* Rejected - Red */
    .badge-rejected {
      background: rgba(239,68,68,0.10);
      color: #991B1B;
    }
    .badge-rejected .badge-dot { background: #EF4444; }

    /* Arrived - Blue */
    .badge-arrived {
      background: rgba(59,130,246,0.10);
      color: #1E40AF;
    }
    .badge-arrived .badge-dot { background: #3B82F6; }

    /* Cancelled - Gray */
    .badge-cancelled {
      background: rgba(100,116,139,0.10);
      color: #475569;
    }
    .badge-cancelled .badge-dot { background: #94A3B8; }

    /* Paid / Completed - Purple */
    .badge-paid,
    .badge-completed {
      background: rgba(139,92,246,0.10);
      color: #5B21B6;
    }
    .badge-paid .badge-dot,
    .badge-completed .badge-dot { background: #8B5CF6; }

    /* Partial - Sky Blue */
    .badge-partial {
      background: rgba(14,165,233,0.10);
      color: #0369A1;
    }
    .badge-partial .badge-dot { background: #3B82F6; }
  `]
})
export class StatusBadgeComponent {
    @Input() status: StatusType = 'pending';
    @Input() label?: string;
    @Input() showIcon = false;

    getLabel(): string {
        const labels: Record<StatusType, string> = {
            'pending':   'En attente',
            'confirmed': 'Confirmé',
            'rejected':  'Rejeté',
            'arrived':   'Arrivé',
            'cancelled': 'Annulé',
            'paid':      'Payé',
            'partial':   'Partiel',
            'completed': 'Terminé'
        };
        return labels[this.status] || this.status;
    }
}
