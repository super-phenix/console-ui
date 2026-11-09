import { Component, WritableSignal, inject, signal } from '@angular/core';
import { API_LOGOUT_URL } from '@env/environment';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { FlowService } from '@kratos-pages/shared/services/flow.service';
import { LogoutFlowErrorHandler } from '@kratos-pages/shared/utils/error-handlers';
import { FlowError, LogoutFlow } from '@ory/client';

@Component({
  selector: 'spx-auth-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
})
export class LogoutComponent {
  private flowService = inject(FlowService);
  i18n = inject(I18nService);
  error: WritableSignal<FlowError | undefined> = signal(undefined);

  constructor() {
    LogoutFlowErrorHandler(this.flowService.initFlow<LogoutFlow>('logout')).subscribe(res => {
      window.location.href = `${res.logout_url}&return_to=${API_LOGOUT_URL}`;
    });
  }
}
