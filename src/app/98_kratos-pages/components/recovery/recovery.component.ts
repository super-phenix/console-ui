import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { RecoveryFlow } from '@ory/client';
import { Observable } from 'rxjs';
import { BaseFlowComponent } from '@kratos-pages/shared/components/base-flow/base-flow.component';
import { DynamicFormComponent } from '@kratos-pages/shared/components/dynamic-form/dynamic-form.component';
import { RecoveryFlowErrorHandler } from '@kratos-pages/shared/utils/error-handlers';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'spx-auth-recovery',
  imports: [AsyncPipe, DynamicFormComponent, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './recovery.component.html',
  styleUrls: ['../../shared/components/base-flow/base-flow.component.scss', './recovery.component.scss'],
})
export class RecoveryComponent extends BaseFlowComponent<RecoveryFlow> {
  flowType: FlowTypeEnum = 'recovery';
  i18n = inject(I18nService);

  override getFlow(flow$: Observable<RecoveryFlow>): void {
    RecoveryFlowErrorHandler(flow$).subscribe(res => (res ? this.updateFlow(res) : this.setError()));
  }
  override initFlow(flow$: Observable<RecoveryFlow>): void {
    RecoveryFlowErrorHandler(flow$).subscribe(res => (res ? this.updateFlow(res) : this.setError()));
  }
}
