import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CreateInstance } from '@products/00_shared/models/compute/instance/instance';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { Organization, Project } from '@shared/models/data/organization';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';

import { InstanceCreateComponent } from './instance-create.component';

describe('InstanceCreateComponent', () => {
  let component: InstanceCreateComponent;
  let fixture: ComponentFixture<InstanceCreateComponent>;
  let instanceSvc: jasmine.SpyObj<InstanceService>;

  beforeEach(async () => {
    instanceSvc = jasmine.createSpyObj<InstanceService>('InstanceService', [
      'create',
      'listInstanceType',
      'getInstanceTypeAdvancedOptions',
      'listGpuClasses',
    ]);
    instanceSvc.create.and.returnValue(of({ eid: 'inst-eid-1' }));
    instanceSvc.listInstanceType.and.returnValue(of([]));
    instanceSvc.getInstanceTypeAdvancedOptions.and.returnValue(of({ blocks: [] }));
    instanceSvc.listGpuClasses.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InstanceCreateComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: InstanceService, useValue: instanceSvc },
      ],
    }).compileComponents();

    const stateSvc = TestBed.inject(StateService);
    stateSvc.organization.set({ id: 'org-1' } as unknown as Organization);
    stateSvc.project.set({ id: 'proj-1' } as unknown as Project);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(InstanceCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('GPU payload', () => {
    beforeEach(() => {
      component.firstFormGroup.setValue({ productName: 'vm-1', az: 'az-1' });
      component.selectedAz.set('az-1');
      component.networks = [{ order: 0, subnetEId: 'subnet-eid-0', enabled: true }];
    });

    function sentPayload(): CreateInstance {
      return instanceSvc.create.calls.mostRecent().args[3];
    }

    it('should omit compute.gpu when no GPU is selected', async () => {
      await component.create();

      expect(sentPayload().compute.gpu).toBeUndefined();
    });

    it('should send the selected GPU class', async () => {
      component.gpus = ['nvidia-rtx-pro-6000-bse'];

      await component.create();

      expect(sentPayload().compute.gpu).toEqual([{ device: 'nvidia-rtx-pro-6000-bse' }]);
    });
  });
});
