import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Step {
    label: string;
    icon?: string;
}

@Component({
    selector: 'lib-stepper',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stepper-container">
      <div *ngFor="let step of steps; let i = index; let last = last" class="step-wrapper">
        <!-- Step Circle -->
        <div class="step" 
             [class.completed]="i < currentStep"
             [class.active]="i === currentStep"
             [class.upcoming]="i > currentStep">
          <div class="step-circle">
            <span class="step-icon" *ngIf="i < currentStep">✓</span>
            <span class="step-number" *ngIf="i >= currentStep">{{ i + 1 }}</span>
          </div>
          <div class="step-label">{{ step.label }}</div>
        </div>
        
        <!-- Connector Line -->
        <div class="step-line" 
             *ngIf="!last"
             [class.completed]="i < currentStep">
        </div>
      </div>
    </div>
  `,
    styles: [`
    .stepper-container {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      width: 100%;
      padding: 20px 0;
    }

    .step-wrapper {
      display: flex;
      align-items: center;
      flex: 1;
      max-width: 200px;
    }

    .step-wrapper:last-child {
      flex: 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .step-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: #E2E8F0;
      color: #64748B;
    }

    .step.completed .step-circle {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .step.active .step-circle {
      background: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      transform: scale(1.1);
    }

    .step.upcoming .step-circle {
      background: #F1F5F9;
      color: #94A3B8;
    }

    .step-icon {
      font-size: 1.25rem;
    }

    .step-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #64748B;
      text-align: center;
      white-space: nowrap;
    }

    .step.active .step-label {
      color: #0EA5E9;
      font-weight: 600;
    }

    .step.completed .step-label {
      color: #10B981;
    }

    .step-line {
      flex: 1;
      height: 3px;
      background: #E2E8F0;
      margin: 0 8px;
      margin-top: -18px;
      border-radius: 3px;
      transition: background 0.3s ease;
    }

    .step-line.completed {
      background: linear-gradient(90deg, #10B981 0%, #0EA5E9 100%);
    }

    @media (max-width: 576px) {
      .stepper-container {
        padding: 10px 0;
      }

      .step-circle {
        width: 36px;
        height: 36px;
        font-size: 0.85rem;
      }

      .step-label {
        font-size: 0.75rem;
      }

      .step-wrapper {
        max-width: 120px;
      }
    }
  `]
})
export class StepperComponent {
    @Input() steps: Step[] = [];
    @Input() currentStep = 0;
}
