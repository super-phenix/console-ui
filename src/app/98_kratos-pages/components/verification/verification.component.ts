import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { VerificationFlow } from '@ory/client';
import { Observable } from 'rxjs';
import { BaseFlowComponent } from '@kratos-pages/shared/components/base-flow/base-flow.component';
import { DynamicFormComponent } from '@kratos-pages/shared/components/dynamic-form/dynamic-form.component';
import { VerificationFlowErrorHandler } from '@kratos-pages/shared/utils/error-handlers';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'spx-auth-verification',
  imports: [AsyncPipe, DynamicFormComponent, RouterModule, MatButtonModule],
  templateUrl: './verification.component.html',
  styleUrls: ['../../shared/components/base-flow/base-flow.component.scss', './verification.component.scss'],
})
export class VerificationComponent extends BaseFlowComponent<VerificationFlow> {
  flowType: FlowTypeEnum = 'verification';
  i18n = inject(I18nService);

  override getFlow(flow$: Observable<VerificationFlow>): void {
    VerificationFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }
  override initFlow(flow$: Observable<VerificationFlow>): void {
    VerificationFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }
}
