import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { Organization, Project } from '@shared/models/data/organization';
import { StateService } from '@shared/services/state.service';
import { of, throwError } from 'rxjs';

import { KaasCreateComponent } from './kaas-create.component';

describe('KaasCreateComponent', () => {
  let component: KaasCreateComponent;
  let fixture: ComponentFixture<KaasCreateComponent>;
  let getKubeVersions: jasmine.Spy;

  const versionsByAz: Record<string, string[]> = {
    az1: ['v1.36.3', 'v1.35.5'],
    az2: ['v1.34.8'],
    empty: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasCreateComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    const state = TestBed.inject(StateService);
    state.organization.set({ id: 'org1' } as Organization);
    state.project.set({ id: 'proj1' } as Project);

    getKubeVersions = spyOn(TestBed.inject(KaasService), 'getKubeVersions').and.callFake(
      (_org: string, _project: string, az: string) =>
        az in versionsByAz ? of(versionsByAz[az]) : throwError(() => new Error('409'))
    );

    fixture = TestBed.createComponent(KaasCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  async function selectAz(az: string) {
    component.selectedAz.set(az);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('gates Disaster Recovery on Kubernetes >= 1.35 (tolerating a "v" prefix)', () => {
    component.firstFormGroup.controls.kubeVersion.setValue('v1.34.5');
    expect(component.drSupported()).toBe(false);

    component.firstFormGroup.controls.kubeVersion.setValue('v1.35.5');
    expect(component.drSupported()).toBe(true);
  });

  it('clears the DR toggle when the version drops below 1.35', () => {
    component.firstFormGroup.controls.kubeVersion.setValue('v1.35.5');
    fixture.detectChanges();
    component.disasterRecovery.set(true);

    component.firstFormGroup.controls.kubeVersion.setValue('v1.34.5');
    fixture.detectChanges();
    expect(component.disasterRecovery()).toBe(false);
  });

  describe('kube versions', () => {
    it('does not load versions before an AZ is selected', () => {
      expect(getKubeVersions).not.toHaveBeenCalled();
      expect(component.kubeVersions.value()).toEqual([]);
      expect(component.firstFormGroup.controls.kubeVersion.value).toBe('');
    });

    it('loads the versions of the selected AZ and selects the first one', async () => {
      await selectAz('az1');

      expect(getKubeVersions).toHaveBeenCalledWith('org1', 'proj1', 'az1');
      expect(component.kubeVersions.value()).toEqual(['v1.36.3', 'v1.35.5']);
      expect(component.firstFormGroup.controls.kubeVersion.value).toBe('v1.36.3');
    });

    it('reloads the versions when the AZ changes', async () => {
      await selectAz('az1');
      await selectAz('az2');

      expect(getKubeVersions).toHaveBeenCalledWith('org1', 'proj1', 'az2');
      expect(component.kubeVersions.value()).toEqual(['v1.34.8']);
      expect(component.firstFormGroup.controls.kubeVersion.value).toBe('v1.34.8');
    });

    it('clears the version when the AZ has no version', async () => {
      await selectAz('az1');
      await selectAz('empty');

      expect(component.kubeVersions.value()).toEqual([]);
      expect(component.firstFormGroup.controls.kubeVersion.value).toBe('');
      expect(component.firstFormGroup.controls.kubeVersion.valid).toBeFalse();
    });

    it('clears the version when the AZ versions cannot be loaded', async () => {
      await selectAz('az1');
      await selectAz('unconfigured');

      expect(component.kubeVersions.value()).toEqual([]);
      expect(component.firstFormGroup.controls.kubeVersion.value).toBe('');
    });
  });
});
