import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FlowService } from '@kratos-pages/shared/services/flow.service';
import { LoginFlow } from '@ory/client';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  const method = {
    group: 'totp',
    type: 'input',
    attributes: { node_type: 'input', name: 'totp_code', type: 'text' },
    meta: {},
    messages: [],
  };

  function render(requested_aal: string, nodes: unknown[] = [method]): HTMLElement {
    const flow = { requested_aal, ui: { action: '', method: 'POST', nodes, messages: [] } } as unknown as LoginFlow;
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: FlowService, useValue: { initFlow: () => of(flow) } }],
    });
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const links = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('a')).map(link => link.getAttribute('href'));

  it('should offer sign up and recovery on the password step', () => {
    expect(links(render('aal1'))).toEqual(['/auth/registration', '/auth/recovery']);
  });

  it('should only offer another account on the second factor step', () => {
    const element = render('aal2');

    expect(element.querySelector('h1')?.textContent).toContain('Two-step verification');
    expect(links(element)).toEqual(['/auth/logout']);
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('should explain the dead end when no second factor is available', () => {
    const csrf = {
      group: 'default',
      type: 'input',
      attributes: { node_type: 'input', name: 'csrf_token', type: 'hidden' },
      meta: {},
      messages: [],
    };
    const element = render('aal2', [csrf]);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('administrator');
    expect(element.querySelector('spx-auth-dynamic-form')).toBeNull();
    expect(links(element)).toEqual(['/auth/logout']);
  });
});
