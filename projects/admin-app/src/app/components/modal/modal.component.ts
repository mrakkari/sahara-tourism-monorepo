import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'lib-modal',
    standalone: true,
    imports: [CommonModule],
    animations: [
        trigger('slideUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(50px)' }),
                animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                animate('0.2s ease-in', style({ opacity: 0, transform: 'translateY(50px)' }))
            ])
        ]),
        trigger('backdrop', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('0.2s ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('0.2s ease-in', style({ opacity: 0 }))
            ])
        ])
    ],
    template: `
    <div class="modal-backdrop" 
         *ngIf="isOpen" 
         [@backdrop]
         (click)="closeOnBackdrop && close()">
      
      <div class="glass-modal" 
           [@slideUp]
           [class.large]="size === 'large'"
           [class.small]="size === 'small'"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header" [class.gradient]="gradientHeader">
          <h2 class="modal-title">
            <span class="modal-icon" *ngIf="icon">{{ icon }}</span>
            {{ title }}
          </h2>
          <button class="btn-close" (click)="close()" aria-label="Close">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    }

    .glass-modal {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 24px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .glass-modal.small {
      max-width: 400px;
    }

    .glass-modal.large {
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(14, 165, 233, 0.1);
    }

    .modal-header.gradient {
      background: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%);
      color: white;
      border-bottom: none;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1E293B;
    }

    .modal-header.gradient .modal-title {
      color: white;
    }

    .modal-icon {
      font-size: 1.5rem;
    }

    .btn-close {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      color: #64748B;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    .modal-header.gradient .btn-close {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .modal-header.gradient .btn-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(14, 165, 233, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 576px) {
      .glass-modal {
        max-width: 100%;
        max-height: 100%;
        border-radius: 16px 16px 0 0;
        align-self: flex-end;
      }
    }
  `]
})
export class ModalComponent {
    @Input() isOpen = false;
    @Input() title = 'Modal';
    @Input() icon?: string;
    @Input() size: 'small' | 'default' | 'large' = 'default';
    @Input() closeOnBackdrop = true;
    @Input() showFooter = true;
    @Input() gradientHeader = false;
    @Output() closed = new EventEmitter<void>();

    @HostListener('document:keydown.escape')
    onEscapePress(): void {
        if (this.isOpen) {
            this.close();
        }
    }

    close(): void {
        this.isOpen = false;
        this.closed.emit();
    }
}
