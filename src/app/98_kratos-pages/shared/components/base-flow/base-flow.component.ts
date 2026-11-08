import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BrowserQueryParam } from '@kratos-pages/shared/models/browser';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { ErrorEnum } from '@kratos-pages/shared/models/error';
import { kratosApiAuth } from '@kratos-pages/shared/utils/kratos-api-auth';
import { Session } from '@ory/client';
import { Observable, firstValueFrom } from 'rxjs';
import { FlowService } from '@kratos-pages/shared/services/flow.service';
import { redirectLimit } from '@shared/utils/redirect-limit';

/**
 * This abstract component provides initialization for Kratos flow.
 *
 * @class BaseFlowComponent
 * @param T - Type flow
 * @implements OnInit
 *
 */
@Component({
  imports: [],
  template: '',
  styleUrl: './base-flow.component.scss',
})
export abstract class BaseFlowComponent<T> implements OnInit {
  /**
   * Define which flow is currently loaded
   *
   * @abstract
   */
  abstract flowType: FlowTypeEnum;
  /**
   * This property corresponds to the flow Id in Kratos.
   * It's used to get the flow from Kratos
   *
   * It's also used to determine if we handle form in the app, or if we redirect to Kratos.
   * If we have a flowId, we redirect to Kratos.
   *
   * @protected
   */
  protected flowId: string | null;

  /**
   * @protected
   */
  protected returnTo: string | null;

  flow: WritableSignal<T | undefined> = signal(undefined);
  /**
   * Set when the flow could not be loaded (bad response, or no response at all from Kratos).
   */
  error: WritableSignal<boolean> = signal(false);
  form?: FormGroup = new FormGroup({});

  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  protected flowService = inject(FlowService);

  constructor() {
    this.flowId = this.route.snapshot.queryParamMap.get('flow');
    this.returnTo = this.route.snapshot.queryParamMap.get(BrowserQueryParam.ReturnTo);
  }

  ngOnInit(): void {
    if (this.flowId) {
      this.getFlow(this.flowService.getFlow<T>(this.flowType, this.flowId));
    } else {
      const query = new URLSearchParams();
      if (this.returnTo && this.flowType !== 'settings') {
        query.set(BrowserQueryParam.ReturnTo, this.returnTo);
      }
      if (this.route.snapshot.queryParamMap.get(BrowserQueryParam.Refresh) === 'true') {
        query.set(BrowserQueryParam.Refresh, 'true');
      }
      this.initFlow(this.flowService.initFlow<T>(this.flowType, query.toString() ? query : undefined));
    }
  }

  /**
   * Called with a flow fetch from Kratos.
   * @param flow$ A flow as Observable
   * @abstract Override and add error handling
   */
  abstract getFlow(flow$: Observable<T>): void;
  /**
   * Called with a flow just initialized.
   * @param flow$
   * @abstract Override and add error handling
   */
  abstract initFlow(flow$: Observable<T>): void;

  /**
   * Method called when we handle form manually (no flowId)
   *
   * @param _session
   *
   * @abstract Implement this method !
   */
  successSubmit(_session: Session): void {
    throw new Error('Method not implemented.');
  }

  updateFlow(flow: T) {
    redirectLimit.reset();
    this.flow.update(() => flow);
  }

  setError() {
    this.error.set(true);
  }

  retry() {
    redirectLimit.reset();
    window.location.reload();
  }

  /**
   * Used to submit the form to Kratos
   *
   * Called when we doesn't have flowId
   *
   * @param url define where to send the form
   * @fires {@link successSubmit} on success
   */
  async submit(url: string) {
    console.log(this.form);

    firstValueFrom(this.flowService.sendForm(url, this.form?.getRawValue()))
      .then(res => {
        this.successSubmit(res);
      })
      .catch((err: HttpErrorResponse) => {
        const errorId = err.error?.error?.id ?? err.error?.id;
        if (errorId === ErrorEnum.SessionAlreadyAvailable) {
          void kratosApiAuth.exchange(this.returnTo).catch(() => this.setError());
          return;
        }
        if (err.status === 400 && err.error?.ui?.messages) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (err.error.ui.messages.findIndex((v: any) => v.id === 4000010) !== -1) {
            this.router.navigate(['/ui', 'verification']);
          } else {
            this.updateFlow(err.error);
          }
        }
        console.log('Error  ', err);
      });
  }
}
