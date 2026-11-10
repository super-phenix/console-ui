import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { FlowService } from '@kratos-pages/shared/services/flow.service';
import { redirect } from '@kratos-pages/shared/utils/error-handlers';
import { LoginFlow } from '@ory/client';
import { Observable, of, throwError } from 'rxjs';
import { BaseFlowComponent } from './base-flow.component';

@Component({ template: '' })
class TestFlowComponent extends BaseFlowComponent<LoginFlow> {
  flowType: FlowTypeEnum = 'login';
  override getFlow(_flow$: Observable<LoginFlow>): void {
    // Not used by submit
  }
  override initFlow(_flow$: Observable<LoginFlow>): void {
    // Not used by submit
  }
  success = jasmine.createSpy('success');
  override successSubmit(): void {
    this.success();
  }
}

describe('BaseFlowComponent submit', () => {
  const redirectTo = 'http://localhost:4433/self-service/login/browser?aal=aal2';
  let redirectSpy: jasmine.Spy;
  let sendForm: jasmine.Spy;

  function create(returnTo: string | null) {
    TestBed.configureTestingModule({
      imports: [TestFlowComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(returnTo ? { return_to: returnTo } : {}) } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: FlowService, useValue: { sendForm } },
      ],
    });
    return TestBed.createComponent(TestFlowComponent).componentInstance;
  }

  const failWith = (status: number, error: unknown) =>
    sendForm.and.returnValue(throwError(() => new HttpErrorResponse({ status, error })));

  beforeEach(() => {
    redirectSpy = spyOn(redirect, 'to');
    sendForm = jasmine.createSpy('sendForm');
  });

  it('should go to the second factor when Kratos asks for a browser redirect', async () => {
    failWith(422, { redirect_browser_to: redirectTo });

    await create('http://localhost:4200/dashboard').submit('http://kratos/login');
    await Promise.resolve();

    const target = new URL(redirectSpy.calls.mostRecent().args[0]);
    expect(target.searchParams.get('aal')).toBe('aal2');
    expect(target.searchParams.get('return_to')).toBe('http://localhost:4200/dashboard');
  });

  it('should not add return_to when the page has none', async () => {
    failWith(422, { redirect_browser_to: redirectTo });

    await create(null).submit('http://kratos/login');
    await Promise.resolve();

    expect(redirectSpy).toHaveBeenCalledWith(redirectTo);
  });

  it('should ignore a 422 without a target', async () => {
    failWith(422, {});

    await create(null).submit('http://kratos/login');
    await Promise.resolve();

    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('should show validation errors in the form on a 400', async () => {
    const flow = { ui: { messages: [], nodes: [] } } as unknown as LoginFlow;
    failWith(400, flow);

    const component = create(null);
    await component.submit('http://kratos/login');
    await Promise.resolve();

    expect(component.flow()).toEqual(flow);
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('should complete the login on success', async () => {
    sendForm.and.returnValue(of({}));

    const component = create(null);
    await component.submit('http://kratos/login');
    await Promise.resolve();

    expect(component.success).toHaveBeenCalled();
  });
});
