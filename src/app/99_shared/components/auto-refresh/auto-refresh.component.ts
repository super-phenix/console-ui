import { Component, DestroyRef, effect, inject, model, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { DEFAULT_REFRESH_INTERVAL } from '@shared/models/consts';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'spx-auto-refresh',
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './auto-refresh.component.html',
  styleUrl: './auto-refresh.component.scss',
})
export class AutoRefreshComponent {
  private destroyRef = inject(DestroyRef);

  readonly intervalOpt = [0, 1, 2, 3, 5, 10];

  refreshInterval = model<number>(DEFAULT_REFRESH_INTERVAL);

  refresh = output<void>();
  refreshAuto: Subscription = new Subscription();

  constructor() {
    effect(() => {
      this.updateAutoState(this.refreshInterval());
    });
  }

  selectionChange(event: MatSelectChange) {
    this.refreshInterval.set(event.value);
  }

  updateAutoState(value: number) {
    if (value !== 0) {
      this.refreshAuto.unsubscribe();
      this.refreshAuto = timer(0, value * 60 * 1000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.refresh.emit();
        });
    } else {
      this.refreshAuto.unsubscribe();
    }
  }
}
