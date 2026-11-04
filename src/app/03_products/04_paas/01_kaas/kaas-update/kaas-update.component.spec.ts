import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { Organization, Project } from '@shared/models/data/organization';
import { StateService } from '@shared/services/state.service';
import { NEVER, of, throwError } from 'rxjs';

import { KaasUpdateComponent } from './kaas-update.component';

describe('KaasUpdateComponent', () => {
  let component: KaasUpdateComponent;
  let fixture: ComponentFixture<KaasUpdateComponent>;
  let getKubeVersions: jasmine.Spy;

  async function setup(versions: ReturnType<KaasService['getKubeVersions']>) {
    await TestBed.configureTestingModule({
      imports: [KaasUpdateComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ az: 'az1', id: 'eid1' }) } } },
      ],
    }).compileComponents();

    const state = TestBed.inject(StateService);
    state.organization.set({ id: 'org1' } as Organization);
    state.project.set({ id: 'proj1' } as Project);

    const kaasSvc = TestBed.inject(KaasService);
    spyOn(kaasSvc, 'getForUpdate').and.returnValue(NEVER);
    getKubeVersions = spyOn(kaasSvc, 'getKubeVersions').and.returnValue(versions);

    fixture = TestBed.createComponent(KaasUpdateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('should create', async () => {
    await setup(of([]));
    expect(component).toBeTruthy();
  });

  it('loads the kube versions of the cluster AZ', async () => {
    await setup(of(['v1.36.3', 'v1.35.5']));

    expect(getKubeVersions).toHaveBeenCalledWith('org1', 'proj1', 'az1');
    expect(component.kubeVersions()).toEqual(['v1.36.3', 'v1.35.5']);
  });

  it('keeps an empty version list when the AZ versions cannot be loaded', async () => {
    await setup(throwError(() => new Error('503')));

    expect(component.kubeVersions()).toEqual([]);
  });
});
