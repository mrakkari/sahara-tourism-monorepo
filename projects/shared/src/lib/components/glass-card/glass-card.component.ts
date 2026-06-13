import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'lib-glass-card',
    standalone: true,
    imports: [CommonModule],
    template: `<ng-content></ng-content>`,
    styles: [`
    :host {
      display: block;
      background: #FFFFFF;
      border: 1px solid rgba(0,0,0,0.09);
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      overflow: visible;
      transition: box-shadow 0.18s ease;
    }

    :host(.hoverable) {
      cursor: pointer;
    }

    :host(.hoverable:hover) {
      box-shadow: 0 4px 16px rgba(0,0,0,0.09);
    }
  `]
})
export class GlassCardComponent {
    @Input() hoverable = false;
    @Input() gradient = false;

    @HostBinding('class.hoverable') get isHoverable() { return this.hoverable; }
}
