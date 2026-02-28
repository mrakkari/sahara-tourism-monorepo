import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'lib-loading-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="skeleton-wrapper" [ngStyle]="{'width': width, 'height': height}">
      <div class="skeleton-element" 
           [class.circle]="type === 'circle'"
           [class.text]="type === 'text'"
           [class.card]="type === 'card'"
           [class.avatar]="type === 'avatar'">
      </div>
    </div>
  `,
    styles: [`
    .skeleton-wrapper {
      display: inline-block;
    }

    .skeleton-element {
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e8e8e8 50%,
        #f0f0f0 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    .skeleton-element.circle,
    .skeleton-element.avatar {
      border-radius: 50%;
    }

    .skeleton-element.text {
      border-radius: 4px;
    }

    .skeleton-element.card {
      border-radius: 16px;
    }

    @keyframes shimmer {
      0% {
        background-position: -468px 0;
      }
      100% {
        background-position: 468px 0;
      }
    }
  `]
})
export class LoadingSkeletonComponent {
    @Input() width = '100%';
    @Input() height = '20px';
    @Input() type: 'text' | 'circle' | 'card' | 'avatar' = 'text';
}
