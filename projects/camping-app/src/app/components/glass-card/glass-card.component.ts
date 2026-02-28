import { Component, Input, HostBinding, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-glass-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card-content">
      <!-- Decorator Blob -->
      <div class="glow-blob" *ngIf="gradient"></div>
      
      <!-- Content -->
      <div class="content-wrapper">
        <ng-content></ng-content>
      </div>

      <!-- Spotlight Effect -->
      <div class="spotlight" [style.background]="getSpotlightGradient()"></div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      position: relative;
    }

    .card-content {
      position: relative;
      background: rgba(255, 255, 255, 0.6); // Higher opacity for legibility
      backdrop-filter: blur(24px); // Deeper blur
      -webkit-backdrop-filter: blur(24px);
      border-radius: 24px; // More rounded
      border: 1px solid rgba(255, 255, 255, 0.4); // Brighter border
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 10px 15px -3px rgba(0, 0, 0, 0.05),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2); // Inner light ring
      overflow: hidden;
      padding: 24px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host(.hoverable) .card-content {
      cursor: pointer;
    }

    :host(.hoverable:hover) .card-content {
      transform: translateY(-6px) scale(1.01);
      background: rgba(255, 255, 255, 0.75);
      box-shadow: 
        0 20px 25px -5px rgba(0, 0, 0, 0.1), 
        0 10px 10px -5px rgba(0, 0, 0, 0.04),
        0 0 20px rgba(14, 165, 233, 0.15); // Blue glow match
      border-color: rgba(255, 255, 255, 0.8);
    }

    /* Gradient Variant (Aurora) */
    :host(.gradient-card) .card-content {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
    }

    .glow-blob {
      position: absolute;
      top: -50%;
      right: -50%;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
      filter: blur(60px);
      z-index: 0;
      pointer-events: none;
    }

    .content-wrapper {
      position: relative;
      z-index: 1;
    }

    .spotlight {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 2;
      mix-blend-mode: overlay;
    }

    :host(.hoverable:hover) .spotlight {
      opacity: 1;
    }
  `]
})
export class GlassCardComponent {
    @Input() hoverable = false;
    @Input() gradient = false;

    @HostBinding('class.hoverable') get isHoverable() { return this.hoverable; }
    @HostBinding('class.gradient-card') get isGradient() { return this.gradient; }

    mouseX = 0;
    mouseY = 0;

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.hoverable) return;
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }

    getSpotlightGradient() {
        return `radial-gradient(600px circle at ${this.mouseX}px ${this.mouseY}px, rgba(255,255,255,0.4), transparent 40%)`;
    }
}
