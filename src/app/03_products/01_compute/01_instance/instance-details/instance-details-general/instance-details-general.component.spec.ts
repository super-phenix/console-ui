import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductInstance } from '@products/00_shared/models/product.model';

import { InstanceDetailsGeneralComponent } from './instance-details-general.component';

describe('InstanceDetailsGeneralComponent', () => {
  const rtxDevice = 'nvidia.com/GB202GL_RTX_PRO_6000_BLACKWELL_SERVER_EDITION';

  let component: InstanceDetailsGeneralComponent;
  let fixture: ComponentFixture<InstanceDetailsGeneralComponent>;

  function buildInstance(opts: {
    gpus?: ProductInstance['gpus'];
    requested?: string[];
    running?: string[] | null;
    vmiPhase?: string;
    emptyVmi?: boolean;
  }): ProductInstance {
    const toDevices = (names: string[]) => names.map((deviceName, i) => ({ name: `gpu-${i}`, deviceName }));
    return {
      id: 'inst-1',
      eid: 'inst-eid-1',
      productName: 'vm',
      gitops: 'false',
      gpus: opts.gpus,
      vm: {
        metadata: { name: 'vm', labels: {} },
        spec: {
          template: { spec: { domain: { devices: { disks: [], interfaces: [], gpus: toDevices(opts.requested ?? []) } } } },
        },
      },
      vmi: opts.emptyVmi
        ? // What the API returns for a stopped VM: a zero-value VMI.
          { metadata: {}, status: {}, spec: { domain: { devices: {} } } }
        : opts.running === null
          ? undefined
          : {
              metadata: { name: 'vm' },
              status: { phase: opts.vmiPhase ?? 'Running', conditions: [] },
              spec: { domain: { devices: { disks: [], interfaces: [], gpus: toDevices(opts.running ?? []) } } },
            },
    } as unknown as ProductInstance;
  }

  async function render(instance: ProductInstance) {
    fixture.componentRef.setInput('az', 'az-1');
    fixture.componentRef.setInput('instance', instance);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function gpuCard(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('[data-testid="gpu-card"]');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceDetailsGeneralComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceDetailsGeneralComponent);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    await render(buildInstance({}));
    expect(component).toBeTruthy();
  });

  it('should not show the GPU card when the instance has no GPU', async () => {
    await render(buildInstance({}));

    expect(gpuCard()).toBeNull();
  });

  it('should show the GPU display name', async () => {
    await render(
      buildInstance({
        gpus: [{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }],
        requested: [rtxDevice],
        running: [rtxDevice],
      })
    );

    expect(gpuCard()?.textContent).toContain('NVIDIA RTX PRO 6000');
    expect(gpuCard()?.textContent).not.toContain('applies after restart');
  });

  it('should flag a GPU added but not applied yet', async () => {
    await render(
      buildInstance({
        gpus: [{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }],
        requested: [rtxDevice],
        running: [],
      })
    );

    expect(component.gpuPendingRestart()).toBeTrue();
    expect(gpuCard()?.textContent).toContain('applies after restart');
  });

  it('should keep the card while a removed GPU is still attached', async () => {
    await render(buildInstance({ gpus: [], requested: [], running: [rtxDevice] }));

    expect(gpuCard()?.textContent).toContain('None');
    expect(gpuCard()?.textContent).toContain('applies after restart');
  });

  it('should not flag a pending restart when the instance is stopped', async () => {
    await render(
      buildInstance({
        gpus: [{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }],
        requested: [rtxDevice],
        running: null,
      })
    );

    expect(component.gpuPendingRestart()).toBeFalse();
  });

  it('should not flag a pending restart for a stopped VM returned with an empty VMI', async () => {
    await render(
      buildInstance({
        gpus: [{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }],
        requested: [rtxDevice],
        emptyVmi: true,
      })
    );

    expect(component.gpuPendingRestart()).toBeFalse();
    expect(gpuCard()?.textContent).not.toContain('applies after restart');
  });

  it('should not flag a pending restart against a finished VMI', async () => {
    await render(
      buildInstance({
        gpus: [{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }],
        requested: [rtxDevice],
        running: [],
        vmiPhase: 'Succeeded',
      })
    );

    expect(component.gpuPendingRestart()).toBeFalse();
  });
});
