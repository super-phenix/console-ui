import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AdvancedBlocksComponent } from './advanced-blocks.component';
import {
  AdvancedOptions,
  AdvancedOptionsInput,
  AdvancedOptionSource,
  ResolvedBool,
  ResolvedField,
} from '@products/00_shared/models/compute/instance/advanced-options.model';

function rb(value: boolean | null, source: AdvancedOptionSource = 'default', def = false): ResolvedBool {
  return { value, source, default: def };
}

function field(key: string, label: string, value: ResolvedBool): ResolvedField {
  return { key, label, description: '', ...value };
}

// A fully-default resolved schema (block-on KubeVirt defaults: TPM/EFI enabled
// true, Secure Boot true, persistents false); tweak fields per test.
function advanced(): AdvancedOptions {
  return {
    blocks: [
      {
        key: 'tpm',
        label: 'TPM',
        description: '',
        path: 'devices.tpm',
        onLabel: 'Enabled',
        offLabel: 'Disabled',
        enabled: rb(false, 'default', true),
        fields: [field('persistent', 'Persistent', rb(false, 'default', false))],
      },
      {
        key: 'efi',
        label: 'EFI firmware',
        description: '',
        path: 'firmware.bootloader.efi',
        onLabel: 'EFI',
        offLabel: 'BIOS',
        enabled: rb(false, 'default', true),
        fields: [
          field('secureBoot', 'Secure Boot', rb(false, 'default', true)),
          field('persistent', 'EFI persistent', rb(false, 'default', false)),
        ],
      },
    ],
  };
}

describe('AdvancedBlocksComponent', () => {
  let fixture: ComponentFixture<AdvancedBlocksComponent>;
  let component: AdvancedBlocksComponent;
  let emitted: AdvancedOptionsInput[];

  async function setup(editable: boolean, initial: AdvancedOptions = advanced()): Promise<void> {
    fixture = TestBed.createComponent(AdvancedBlocksComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.advancedChange.subscribe(v => emitted.push(v));
    fixture.componentRef.setInput('resolved', initial);
    fixture.componentRef.setInput('editable', editable);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedBlocksComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  const lastEfi = () => emitted[emitted.length - 1].firmware!.bootloader!.efi!;
  const lastTpm = () => emitted[emitted.length - 1].devices!.tpm!;
  const ctrl = (name: string) => component.form.get(name)!;

  describe('editable', () => {
    it('creates', async () => {
      await setup(true);
      expect(component).toBeTruthy();
    });

    it('EFI block On emits enabled=true with KubeVirt-default sub-fields', async () => {
      await setup(true);
      ctrl('efi').setValue('enabled');
      expect(lastEfi().enabled).toBe(true);
      expect(lastEfi().secureBoot).toBe(true); // seeded from field.default
      expect(lastEfi().persistent).toBe(false);
    });

    it('EFI block On with Secure Boot toggled off emits secureBoot=false', async () => {
      await setup(true);
      ctrl('efi').setValue('enabled');
      ctrl('efi-secureBoot').setValue('disabled');
      expect(lastEfi().enabled).toBe(true);
      expect(lastEfi().secureBoot).toBe(false);
    });

    it('EFI block Off emits enabled=false and null sub-fields (force BIOS)', async () => {
      await setup(true);
      ctrl('efi').setValue('disabled');
      expect(lastEfi().enabled).toBe(false);
      expect(lastEfi().secureBoot).toBeNull();
      expect(lastEfi().persistent).toBeNull();
    });

    it('EFI block Auto emits null leaves (inherit)', async () => {
      await setup(true);
      ctrl('efi').setValue('enabled');
      ctrl('efi').setValue('inherit');
      expect(lastEfi().enabled).toBeNull();
      expect(lastEfi().secureBoot).toBeNull();
      expect(lastEfi().persistent).toBeNull();
    });

    it('TPM block On + persistent emits enabled and persistent true', async () => {
      await setup(true);
      ctrl('tpm').setValue('enabled');
      ctrl('tpm-persistent').setValue('enabled');
      expect(lastTpm().enabled).toBe(true);
      expect(lastTpm().persistent).toBe(true);
    });

    it('seeds the EFI block from a manual VM (source vm)', async () => {
      const a = advanced();
      a.blocks[1].enabled = rb(true, 'vm');
      a.blocks[1].fields[0] = field('secureBoot', 'Secure Boot', rb(false, 'vm', true));
      await setup(true, a);
      expect(ctrl('efi').value).toBe('enabled');
      expect(ctrl('efi-secureBoot').value).toBe('disabled');
    });

    it('seeds a sub-field from the backend default (not the resolved value) when the block is Auto', async () => {
      const a = advanced();
      // BIOS/Auto: secureBoot effective value is false, but its block-on default is true.
      a.blocks[1].enabled = rb(false, 'default', true);
      a.blocks[1].fields[0] = field('secureBoot', 'Secure Boot', rb(false, 'default', true));
      await setup(true, a);
      expect(ctrl('efi').value).toBe('inherit');
      expect(ctrl('efi-secureBoot').value).toBe('enabled'); // from backend default, not value=false
    });

    it('On seeds persistents to Disabled and Secure Boot to Enabled (KubeVirt defaults)', async () => {
      await setup(true);
      ctrl('efi').setValue('enabled');
      ctrl('tpm').setValue('enabled');
      expect(ctrl('efi-secureBoot').value).toBe('enabled');
      expect(ctrl('efi-persistent').value).toBe('disabled');
      expect(ctrl('tpm-persistent').value).toBe('disabled');
      expect(lastEfi().secureBoot).toBe(true);
      expect(lastEfi().persistent).toBe(false);
      expect(lastTpm().persistent).toBe(false);
    });
  });

  describe('read-only', () => {
    it('renders a row per block and field without building a form', async () => {
      await setup(false);
      // 2 block rows + 3 sub-field rows = 5 named rows.
      expect(fixture.nativeElement.querySelectorAll('.ao-name').length).toBe(5);
      // No interactive form is seeded in read-only mode.
      expect(component.form.contains('efi')).toBe(false);
      expect(emitted.length).toBe(0);
    });

    it('shows the source label for a resolved value', async () => {
      const a = advanced();
      a.blocks[1].enabled = rb(true, 'preference', true);
      await setup(false, a);
      expect(fixture.nativeElement.textContent).toContain('From instance type');
    });
  });
});
