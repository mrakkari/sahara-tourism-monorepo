// shared/src/lib/toast.service.ts

import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  toast = signal<Toast | null>(null);

  showSuccess(message: string): void {
    this.toast.set({ message, type: 'success' });
    setTimeout(() => this.toast.set(null), 3000);
  }

  showError(message: string): void {
    this.toast.set({ message, type: 'error' });
    setTimeout(() => this.toast.set(null), 3000);
  }

  showInfo(message: string): void {
    this.toast.set({ message, type: 'info' });
    setTimeout(() => this.toast.set(null), 3000);
  }

  showWarning(message: string): void {
    this.toast.set({ message, type: 'warning' });
    setTimeout(() => this.toast.set(null), 3000);
  }
}