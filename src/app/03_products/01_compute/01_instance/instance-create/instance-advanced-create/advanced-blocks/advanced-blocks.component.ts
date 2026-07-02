import { Component, computed, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import {
  AdvancedOptions,
  AdvancedOptionSource,
  AdvancedOptionsInput,
  AdvancedTriState,
  ResolvedBlock,
  ResolvedBool,
  ResolvedField,
  resolvedToTriState,
  setByPath,
  triStateToLeaf,
} from '@products/00_shared/models/compute/instance/advanced-options.model';

/**
 * Renders the advanced-options blocks generically from the API schema — no
 * hardcoded labels, descriptions or field accessors. Shared by the create/edit
 * form (editable) and the read-only details tab, so both look identical and a
 * new advanced option needs no frontend change.
 */
@Component({
  selector: 'spx-advanced-blocks',
  imports: [ReactiveFormsModule, MatButtonToggleModule, MatIconModule],
  templateUrl: './advanced-blocks.component.html',
  styleUrl: './advanced-blocks.component.scss',
})
export class AdvancedBlocksComponent {
  /** Resolved blocks to display and (editable mode) seed the controls from. */
  resolved = input<AdvancedOptions | undefined>(undefined);
  /** Instance-type defaults backing the "Auto" hint; refreshes on type change
   *  without re-seeding the user's choices. Editable mode only. */
  inherited = input<AdvancedOptions | undefined>(undefined);
  /** false = read-only details rendering; true = interactive form. */
  editable = input(false);

  advancedChange = output<AdvancedOptionsInput>();

  protected blocks = computed<ResolvedBlock[]>(() => this.resolved()?.blocks ?? []);

  // One tri-state control per block toggle (keyed by block.key) and per sub-field
  // (keyed by `${block.key}-${field.key}`). Built once when the schema arrives.
  form = new FormGroup<Record<string, FormControl<AdvancedTriState>>>({});
  private seeded = false;

  constructor() {
    // Subscribe before the controls exist; addControl during seeding is silent
    // (emitEvent:false), later user edits emit through here.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.advancedChange.emit(this.toInput()));

    // Seed the form the first time the schema arrives (editable mode only).
    effect(() => {
      const blocks = this.blocks();
      if (!this.editable() || this.seeded || blocks.length === 0) return;
      this.seeded = true;
      for (const block of blocks) {
        this.form.addControl(block.key, new FormControl(resolvedToTriState(block.enabled), { nonNullable: true }), {
          emitEvent: false,
        });
        const manual = block.enabled.source === 'vm';
        for (const field of block.fields) {
          this.form.addControl(this.fieldKey(block, field), new FormControl(seedSubField(field, manual), { nonNullable: true }), {
            emitEvent: false,
          });
        }
      }
      this.advancedChange.emit(this.toInput());
    });
  }

  protected fieldKey(block: ResolvedBlock, field: ResolvedField): string {
    return `${block.key}-${field.key}`;
  }

  /** Current tri-state of a block toggle (falls back to the resolved state). */
  protected blockState(block: ResolvedBlock): AdvancedTriState {
    return (this.form.get(block.key)?.value as AdvancedTriState) ?? resolvedToTriState(block.enabled);
  }

  /** Sub-fields are hidden only when the user forced the block Off (editable). */
  protected subFieldsHidden(block: ResolvedBlock): boolean {
    return this.editable() && this.blockState(block) === 'disabled';
  }

  protected hasControl(name: string): boolean {
    return this.form.contains(name);
  }

  /* ---------- read-only / value formatting ---------- */

  protected formatValue(rb: ResolvedBool): string {
    if (rb.value === null) return '—';
    return rb.value ? 'Enabled' : 'Disabled';
  }

  protected formatLive(rb: ResolvedBool): string {
    if (rb.live === null || rb.live === undefined) return '—';
    return rb.live ? 'Enabled' : 'Disabled';
  }

  // 'preference' is the kubevirt term for the instance type.
  protected sourceLabel(source: AdvancedOptionSource): string {
    switch (source) {
      case 'vm':
        return 'Overridden';
      case 'preference':
        return 'From instance type';
      default:
        return 'System default';
    }
  }

  protected sourceClass(source: AdvancedOptionSource): string {
    return `advanced-badge advanced-badge--${source}`;
  }

  /** Restart strip text when the saved value differs from the running VMI. */
  protected driftText(rb: ResolvedBool): string {
    if (!rb.stale) return '';
    return `Running as ${this.formatLive(rb)} right now — restart to apply ${this.formatValue(rb)}`;
  }

  /* ---------- editable "Auto" hints ---------- */

  protected blockInheritHint(block: ResolvedBlock): string {
    const r = this.inheritedBlock(block.key)?.enabled;
    if (!r) return '';
    const value = r.value === null ? '—' : r.value ? block.onLabel : block.offLabel;
    return `Auto: ${value} (${this.origin(r.source)})`;
  }

  protected blockInheritSource(block: ResolvedBlock): 'preference' | 'default' {
    return this.inheritedBlock(block.key)?.enabled.source === 'preference' ? 'preference' : 'default';
  }

  protected inferredHint(block: ResolvedBlock, field: ResolvedField): string {
    const r = this.inferred(block, field);
    if (!r) return '';
    const value = r.value === null ? '—' : r.value ? 'Enabled' : 'Disabled';
    return `Auto: ${value} (${this.origin(r.source)})`;
  }

  protected inferredSource(block: ResolvedBlock, field: ResolvedField): 'preference' | 'default' {
    return this.inferred(block, field)?.source === 'preference' ? 'preference' : 'default';
  }

  private origin(source: AdvancedOptionSource): string {
    return source === 'preference' ? 'instance type' : 'default';
  }

  private inheritedBlock(key: string): ResolvedBlock | undefined {
    const a = this.inherited() ?? this.resolved();
    return a?.blocks.find(b => b.key === key);
  }

  private inferred(block: ResolvedBlock, field: ResolvedField): ResolvedBool | undefined {
    return this.inheritedBlock(block.key)?.fields.find(f => f.key === field.key);
  }

  // A block on Auto emits null leaves (inherit); On emits the concrete sub-field
  // values; Off emits enabled=false with null sub-fields. Built generically by
  // writing each value at the block's metadata path.
  private toInput(): AdvancedOptionsInput {
    const payload: Record<string, unknown> = {};
    for (const block of this.blocks()) {
      const state = this.blockState(block);
      setByPath(payload, `${block.path}.enabled`, triStateToLeaf(state));
      const on = state === 'enabled';
      for (const field of block.fields) {
        const fieldState = this.form.get(this.fieldKey(block, field))?.value as AdvancedTriState | undefined;
        setByPath(payload, `${block.path}.${field.key}`, on && fieldState ? triStateToLeaf(fieldState) : null);
      }
    }
    return payload as AdvancedOptionsInput;
  }
}

// seedSubField picks the initial enabled/disabled state for a sub-field control.
// When the block is manually owned by the VM, use the VM's saved value; otherwise
// use the backend-reported KubeVirt default for when the block is active (so we
// never re-encode KubeVirt defaults in the frontend).
function seedSubField(field: ResolvedField, manual: boolean): AdvancedTriState {
  const value = manual ? (field.value ?? field.default) : field.default;
  return value ? 'enabled' : 'disabled';
}
