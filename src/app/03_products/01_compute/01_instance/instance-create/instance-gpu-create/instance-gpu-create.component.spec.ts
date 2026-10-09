import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GpuClass } from '@products/00_shared/models/compute/instance/instance';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { Organization, Project } from '@shared/models/data/organization';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { InstanceGpuCreateComponent, NO_GPU } from './instance-gpu-create.component';

describe('InstanceGpuCreateComponent', () => {
  const rtx: GpuClass = { id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' };

  let fixture: ComponentFixture<InstanceGpuCreateComponent>;
  let component: InstanceGpuCreateComponent;
  let instanceSvc: jasmine.SpyObj<InstanceService>;
  let emitted: string[][];

  async function setup(catalog: GpuClass[], initGpus?: GpuClass[]) {
    instanceSvc = jasmine.createSpyObj<InstanceService>('InstanceService', ['listGpuClasses']);
    instanceSvc.listGpuClasses.and.returnValue(of(catalog));

    await TestBed.configureTestingModule({
      imports: [InstanceGpuCreateComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: InstanceService, useValue: instanceSvc }],
    }).compileComponents();

    const stateSvc = TestBed.inject(StateService);
    stateSvc.organization.set({ id: 'org-1' } as unknown as Organization);
    stateSvc.project.set({ id: 'proj-1' } as unknown as Project);

    fixture = TestBed.createComponent(InstanceGpuCreateComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.gpusChange.subscribe(v => emitted.push(v));
    fixture.componentRef.setInput('az', 'az-1');
    if (initGpus !== undefined) {
      fixture.componentRef.setInput('initGpus', initGpus);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function card(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.info-card');
  }

  it('should fetch the GPU classes of the selected AZ', async () => {
    await setup([rtx]);

    expect(instanceSvc.listGpuClasses).toHaveBeenCalledWith('org-1', 'proj-1', 'az-1');
  });

  it('should hide the card when the AZ has no GPU class', async () => {
    await setup([]);

    expect(card()).toBeNull();
  });

  it('should show the card with None selected on create', async () => {
    await setup([rtx]);

    expect(card()).not.toBeNull();
    expect(component.selected()).toBe(NO_GPU);
    expect(component.options()).toEqual([rtx]);
    expect(emitted).toEqual([]);
  });

  it('should emit the selected class', async () => {
    await setup([rtx]);

    component.select(rtx.id);

    expect(emitted).toEqual([[rtx.id]]);
  });

  it('should emit an empty list when None is selected', async () => {
    await setup([rtx]);

    component.select(rtx.id);
    component.select(NO_GPU);

    expect(emitted).toEqual([[rtx.id], []]);
  });

  it('should reset the selection when the AZ changes on create', async () => {
    await setup([rtx]);
    component.select(rtx.id);

    fixture.componentRef.setInput('az', 'az-2');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.selected()).toBe(NO_GPU);
    expect(emitted[emitted.length - 1]).toEqual([]);
  });

  it('should seed the current GPU in edit mode without emitting', async () => {
    await setup([rtx], [rtx]);

    expect(component.selected()).toBe(rtx.id);
    expect(emitted).toEqual([]);
  });

  it('should keep a current GPU that is no longer in the catalog', async () => {
    await setup([], [{ id: 'undefined-gpu-class', displayName: 'nvidia.com/OLD' }]);

    expect(card()).not.toBeNull();
    expect(component.options()).toEqual([{ id: 'undefined-gpu-class', displayName: 'nvidia.com/OLD' }]);
  });

  it('should label the select for assistive technologies', async () => {
    await setup([rtx]);

    const label = (fixture.nativeElement as HTMLElement).querySelector('mat-label');
    expect(label?.textContent?.trim()).toBe('GPU');
  });

  it('should not mention a restart on create', async () => {
    await setup([rtx]);

    expect(card()?.textContent).not.toContain('restart');
  });

  it('should mention the restart in edit mode', async () => {
    await setup([rtx], [rtx]);

    expect(card()?.textContent).toContain('Changes apply after the next restart.');
  });
});
