import { JsonPipe } from '@angular/common';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ErrorEnum, isRecoveryBlockedBySession } from '@kratos-pages/shared/models/error';
import { FlowService } from '@kratos-pages/shared/services/flow.service';
import { kratosApiAuth } from '@kratos-pages/shared/utils/kratos-api-auth';
import { redirect, urlWithRecoveryRefresh } from '@kratos-pages/shared/utils/error-handlers';
import { FlowError, GenericError } from '@ory/client';

@Component({
  selector: 'spx-auth-error',
  imports: [JsonPipe],
  templateUrl: './error.component.html',
  styleUrls: ['../../shared/components/base-flow/base-flow.component.scss', './error.component.scss'],
})
export class ErrorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private flowService = inject(FlowService);

  id: string | null = this.route.snapshot.queryParamMap.get('id');

  error: WritableSignal<FlowError | undefined> = signal(undefined);

  ngOnInit(): void {
    if (this.id) {
      this.flowService.getFlowError(this.id).subscribe(res => {
        const kratosError = res.error as GenericError | undefined;
        if (isRecoveryBlockedBySession(kratosError)) {
          const next = urlWithRecoveryRefresh(window.location.href);
          if (next) {
            redirect.to(next);
            return;
          }
        }
        if (kratosError?.id === ErrorEnum.SessionAlreadyAvailable) {
          const returnTo = this.route.snapshot.queryParamMap.get('return_to');
          void kratosApiAuth.exchange(returnTo).catch(() => this.error.set(res));
          return;
        }
        this.error.set(res);
      });
    }
  }
}
