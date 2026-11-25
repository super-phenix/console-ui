import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { InaccessibleProjectSnackbar } from '@shared/models/snackbar';
import { AuthService } from '@shared/services/auth.service';
import { StateService } from '@shared/services/state.service';

import { routes } from '../../app.routes';

describe('RedirectComponent', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let stateSvc: jasmine.SpyObj<StateService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let navigate: jasmine.Spy;

  const open = async (url: string) => {
    await RouterTestingHarness.create(url);
    await new Promise(resolve => setTimeout(resolve));
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['getAccessToken', 'userLoggedIn', 'redirectToFlow']);
    auth.getAccessToken.and.resolveTo();
    auth.userLoggedIn.and.returnValue(true);
    stateSvc = jasmine.createSpyObj('StateService', ['setOrganization', 'setProject']);
    stateSvc.setOrganization.and.callFake(async orgId => orgId !== '');
    stateSvc.setProject.and.returnValue(true);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          routes.filter(route => (route.path === '' ? !route.children : route.path!.startsWith('redirect/')))
        ),
        { provide: AuthService, useValue: auth },
        { provide: StateService, useValue: stateSvc },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  const cases: { url: string; target: string; project?: string }[] = [
    { url: '/', target: 'dashboard' },
    { url: '/redirect/org', target: 'organization/settings' },
    { url: '/redirect/org/project', target: 'dashboard', project: 'project' },
    {
      url: '/redirect/org/project/az1/loadBalancer/lb-1',
      target: 'products/network/load-balancer/details/az1/lb-1',
      project: 'project',
    },
    { url: '/redirect/org/project/az1/unknown/id-1', target: 'dashboard', project: 'project' },
  ];
  cases.forEach(({ url, target, project }) => {
    it(`should open ${target} from ${url}`, async () => {
      await open(url);

      expect(stateSvc.setOrganization).toHaveBeenCalledOnceWith(url === '/' ? '' : 'org');
      expect(stateSvc.setProject.calls.allArgs()).toEqual(project ? [[project]] : []);
      expect(navigate).toHaveBeenCalledOnceWith([target]);
      expect(snackBar.open).not.toHaveBeenCalled();
    });
  });

  it('should wait for the organization before setting the project', async () => {
    let resolve!: (loaded: boolean) => void;
    stateSvc.setOrganization.and.returnValue(new Promise(r => (resolve = r)));

    await open('/redirect/org/project/az1/disk/disk-1');
    expect(stateSvc.setProject).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    resolve(true);
    await new Promise(r => setTimeout(r));
    expect(stateSvc.setProject).toHaveBeenCalledOnceWith('project');
    expect(navigate).toHaveBeenCalledOnceWith(['products/storage/disk/details/az1/disk-1']);
  });

  ['/redirect/org', '/redirect/org/project', '/redirect/org/project/az1/disk/disk-1'].forEach(url => {
    it(`should open the dashboard from ${url} when the organization cannot be loaded`, async () => {
      stateSvc.setOrganization.and.resolveTo(false);

      await open(url);

      expect(stateSvc.setProject).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledOnceWith(['dashboard']);
    });
  });

  ['/redirect/org/project', '/redirect/org/project/az1/disk/disk-1'].forEach(url => {
    it(`should show an error and open the dashboard from ${url} when the project is not accessible`, async () => {
      stateSvc.setProject.and.returnValue(false);

      await open(url);

      expect(snackBar.open).toHaveBeenCalledOnceWith(
        InaccessibleProjectSnackbar.message,
        InaccessibleProjectSnackbar.action,
        InaccessibleProjectSnackbar.config
      );
      expect(navigate).toHaveBeenCalledOnceWith(['dashboard']);
    });
  });

  it('should open the login when the session cannot be loaded', async () => {
    auth.getAccessToken.and.rejectWith(new Error('401'));

    await open('/redirect/org');

    expect(auth.redirectToFlow).toHaveBeenCalledOnceWith('login');
    expect(navigate).not.toHaveBeenCalled();
  });
});
