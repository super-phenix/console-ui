import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, model, output, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { AutoRefreshComponent } from '@shared/components/auto-refresh/auto-refresh.component';
import { ScreenService } from '@shared/services/screen.service';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-product-list-filter',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatSlideToggleModule,
    FormsModule,
    AutoRefreshComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './product-list-filter.component.html',
  styleUrl: './product-list-filter.component.scss',
})
export class ProductListFilterComponent {
  protected stateSvc = inject(StateService);
  protected screenSvc = inject(ScreenService);

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());

  needReload = output();
  filter = output<Map<string, string>>();

  showCluster = input<undefined | boolean>();
  showClusterChange = output<boolean>();

  refreshInterval = model<number>(0);

  updateFilter(key: string, value: string) {
    this.filterValue.update(prev => new Map(prev).set(key, value));
    this.filter.emit(this.filterValue());
  }

  reloadData() {
    this.needReload.emit();
  }
}
