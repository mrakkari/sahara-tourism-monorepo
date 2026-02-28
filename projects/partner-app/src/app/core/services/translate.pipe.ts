// src/app/core/services/translate.pipe.ts
import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LanguageService } from './language.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Important: makes pipe update when language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription;
  private lastKey: string = '';
  private lastValue: string = '';

  constructor(
    private languageService: LanguageService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    // Subscribe to language changes and trigger change detection
    this.subscription = this.languageService.currentLanguage$.subscribe(() => {
      this.lastValue = ''; // Reset cache
      this.changeDetectorRef.markForCheck();
    });
  }

  transform(key: string): string {
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.lastValue = this.languageService.translate(key);
    } else if (!this.lastValue) {
      this.lastValue = this.languageService.translate(key);
    }
    return this.lastValue;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}