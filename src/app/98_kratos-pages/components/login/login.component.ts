import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { API_TOKEN_URL } from '@env/environment';
import { LoginFlow, Session } from '@ory/client';
import { Observable } from 'rxjs';
import { BaseFlowComponent } from '@kratos-pages/shared/components/base-flow/base-flow.component';
import { DynamicFormComponent } from '@kratos-pages/shared/components/dynamic-form/dynamic-form.component';
import { LoginRegisterFlowErrorHandler } from '@kratos-pages/shared/utils/error-handlers';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'spx-auth-login',
  imports: [AsyncPipe, DynamicFormComponent, RouterModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['../../shared/components/base-flow/base-flow.component.scss', './login.component.scss'],
})
export class LoginComponent extends BaseFlowComponent<LoginFlow> {
  flowType: FlowTypeEnum = 'login';
  i18n = inject(I18nService);

  override getFlow(flow$: Observable<LoginFlow>): void {
    LoginRegisterFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }
  override initFlow(flow$: Observable<LoginFlow>): void {
    LoginRegisterFlowErrorHandler(flow$).subscribe(res => this.updateFlow(res));
  }

  override successSubmit(_session: Session): void {
    window.location.href = `${API_TOKEN_URL}?return_to=${this.returnTo}`;
  }
}
