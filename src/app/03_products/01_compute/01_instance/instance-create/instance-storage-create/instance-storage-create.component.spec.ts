import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateInstanceCloudInit } from '@products/00_shared/models/compute/instance/instance';
import { AZService } from '@products/00_shared/services/az.service';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { DefaultCloudInitSnackbar } from '@shared/models/snackbar';
import { StateService } from '@shared/services/state.service';
import { of, throwError } from 'rxjs';

import { InstanceStorageCreateComponent } from './instance-storage-create.component';

describe('InstanceStorageCreateComponent', () => {
  let component: InstanceStorageCreateComponent;
  let fixture: ComponentFixture<InstanceStorageCreateComponent>;
  let azSvc: jasmine.SpyObj<AZService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackbar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    azSvc = jasmine.createSpyObj<AZService>('AZService', ['getDefaultCloudInit']);
    azSvc.getDefaultCloudInit.and.callFake((_, az) => of({ config: `#default-${az}` }));
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    snackbar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [InstanceStorageCreateComponent],
      providers: [
        { provide: AZService, useValue: azSvc },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackbar },
        { provide: DiskService, useValue: { listByAZ: () => of([]) } },
        { provide: InstanceService, useValue: { listContainerDisks: () => of([]) } },
        {
          provide: StateService,
          useValue: { organization: signal({ id: 'org1' }), project: signal({ id: 'project1' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceStorageCreateComponent);
    component = fixture.componentInstance;
  });

  const setAz = async (az: string | null) => {
    fixture.componentRef.setInput('az', az);
    await fixture.whenStable();
  };

  it('should create', async () => {
    await setAz(null);
    expect(component).toBeTruthy();
    expect(azSvc.getDefaultCloudInit).not.toHaveBeenCalled();
  });

  it('should show the default cloud-init of the selected AZ', async () => {
    await setAz('az1');
    expect(azSvc.getDefaultCloudInit).toHaveBeenCalledWith('org1', 'az1');
    expect(component.cloudInitForm.controls.config.value).toBe('#default-az1');

    await setAz('az2');
    expect(component.cloudInitForm.controls.config.value).toBe('#default-az2');
  });

  it('should keep a customized config when the AZ changes', async () => {
    await setAz('az1');
    component.cloudInitForm.patchValue({ custom: true, config: '#mine' });

    await setAz('az2');

    expect(component.cloudInitForm.controls.config.value).toBe('#mine');
  });

  it('should keep an unedited config while custom is enabled when the AZ changes', async () => {
    await setAz('az1');
    component.cloudInitForm.controls.custom.setValue(true);

    await setAz('az2');

    expect(component.cloudInitForm.controls.config.value).toBe('#default-az1');
  });

  describe('disabling the custom config', () => {
    const disableCustom = async (confirmed: boolean | undefined) => {
      dialog.open.and.returnValue({ afterClosed: () => of(confirmed) } as never);
      component.cloudInitForm.controls.custom.setValue(false);
      await component.onCustomChange(false);
    };

    it('should not ask for confirmation when the config is the default one', async () => {
      await setAz('az1');
      component.cloudInitForm.controls.custom.setValue(true);

      await disableCustom(undefined);

      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.cloudInitForm.getRawValue()).toEqual(
        jasmine.objectContaining({ custom: false, config: '#default-az1' })
      );
    });

    it('should replace the config with the current AZ default once confirmed', async () => {
      await setAz('az1');
      component.cloudInitForm.patchValue({ custom: true, config: '#mine' });
      await setAz('az2');

      await disableCustom(true);

      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(component.cloudInitForm.getRawValue()).toEqual(
        jasmine.objectContaining({ custom: false, config: '#default-az2' })
      );
    });

    [undefined, false].forEach(confirmed => {
      it(`should keep the custom config when the dialog closes with ${confirmed}`, async () => {
        await setAz('az1');
        component.cloudInitForm.patchValue({ custom: true, config: '#mine' });

        await disableCustom(confirmed);

        expect(component.cloudInitForm.getRawValue()).toEqual(
          jasmine.objectContaining({ custom: true, config: '#mine' })
        );
      });
    });

    it('should do nothing when custom is enabled', async () => {
      await setAz('az1');
      component.cloudInitForm.patchValue({ custom: true, config: '#mine' });

      await component.onCustomChange(true);

      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.cloudInitForm.controls.config.value).toBe('#mine');
    });
  });

  it('should keep the config of the instance being edited', async () => {
    const init: CreateInstanceCloudInit = { custom: true, config: '#stored', bus: 'virtio' };
    fixture.componentRef.setInput('initCloudInit', init);

    await setAz('az1');

    expect(component.cloudInitForm.getRawValue()).toEqual({ custom: true, config: '#stored', bus: 'virtio' });
  });

  it('should not emit a change when the default is loaded', async () => {
    const emitted: CreateInstanceCloudInit[] = [];
    component.cloudInitChange.subscribe(v => emitted.push(v));

    await setAz('az1');

    expect(emitted).toEqual([]);
  });

  it('should leave the config empty and warn when the default cannot be fetched', async () => {
    azSvc.getDefaultCloudInit.and.returnValue(throwError(() => new Error('not found')));

    await setAz('az1');

    expect(component.cloudInitForm.controls.config.value).toBe('');
    expect(snackbar.open).toHaveBeenCalledOnceWith(
      DefaultCloudInitSnackbar.message,
      DefaultCloudInitSnackbar.action,
      DefaultCloudInitSnackbar.config
    );
  });

  it('should not warn when the default is fetched', async () => {
    await setAz('az1');
    expect(snackbar.open).not.toHaveBeenCalled();
  });
});
