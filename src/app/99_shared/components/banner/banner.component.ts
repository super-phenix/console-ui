import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BannerLevelEnum } from '@shared/models/enums';

@Component({
  selector: 'spx-banner',
  imports: [MatIconModule],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent {
  level = input<BannerLevelEnum>(BannerLevelEnum.Info);
  multiline = input();

  icon = computed(() => {
    switch (this.level()) {
      case BannerLevelEnum.Info:
        return 'info';
      case BannerLevelEnum.Warn:
        return 'warning';
      case BannerLevelEnum.Error:
        return 'error';
      case BannerLevelEnum.Success:
        return 'check_circle';
    }
  });
}
