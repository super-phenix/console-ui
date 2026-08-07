import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { RegistrationFlow } from '@ory/client';
import { Observable } from 'rxjs';
import { BaseFlowComponent } from '@kratos-pages/shared/components/base-flow/base-flow.component';
import { DynamicFormComponent } from '@kratos-pages/shared/components/dynamic-form/dynamic-form.component';
import { LoginRegisterFlowErrorHandler } from '@kratos-pages/shared/utils/error-handlers';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'spx-auth-registration',
  imports: [AsyncPipe, DynamicFormComponent, RouterModule, MatButtonModule],
  templateUrl: './registration.component.html',
  styleUrls: ['../../shared/components/base-flow/base-flow.component.scss', './registration.component.scss'],
})
export class RegistrationComponent extends BaseFlowComponent<RegistrationFlow> {
  flowType: FlowTypeEnum = 'registration';
  i18n = inject(I18nService);

  override getFlow(flow$: Observable<RegistrationFlow>): void {
    LoginRegisterFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }
  override initFlow(flow$: Observable<RegistrationFlow>): void {
    LoginRegisterFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }
}
