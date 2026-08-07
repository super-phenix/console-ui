import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { SettingsFlow } from '@ory/client';
import { Observable } from 'rxjs';
import { BaseFlowComponent } from '@kratos-pages/shared/components/base-flow/base-flow.component';
import { DynamicFormComponent } from '@kratos-pages/shared/components/dynamic-form/dynamic-form.component';
import { SettingsFlowErrorHandler } from '@kratos-pages/shared/utils/error-handlers';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'spx-auth-settings',
  imports: [AsyncPipe, DynamicFormComponent, MatButtonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['../../shared/components/base-flow/base-flow.component.scss', './settings.component.scss'],
})
export class SettingsComponent extends BaseFlowComponent<SettingsFlow> {
  flowType: FlowTypeEnum = 'settings';
  i18n = inject(I18nService);

  default_redirect = window.location.origin;

  override getFlow(flow$: Observable<SettingsFlow>): void {
    SettingsFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }
  override initFlow(flow$: Observable<SettingsFlow>): void {
    SettingsFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }
}
