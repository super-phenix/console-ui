/** 'preference' is the kubevirt term for what the UI calls the instance type. */
export type AdvancedOptionSource = 'vm' | 'preference' | 'default';

export interface ResolvedBool {
  /** Effective value (null when not set anywhere). */
  value: boolean | null;
  source: AdvancedOptionSource;
  /**
   * KubeVirt default this field takes when its block is active (e.g. Secure Boot
   * is `true` once EFI is on). Used to seed the control when switching a block to
   * manual, so the frontend doesn't re-encode KubeVirt defaults.
   */
  default: boolean;
  /**
   * Value currently applied on the running VMI (undefined when the VM is
   * stopped). These settings only take effect on the next boot, so when `live`
   * differs from `value` a restart is required to apply the saved value.
   */
  live?: boolean | null;
  /** True when `live` is known and differs from `value` (restart required). */
  stale?: boolean;
}

/** One advanced option: presentation metadata (from the API, never hardcoded)
 *  plus its resolved state. `key` matches the option's leaf name in the input. */
export interface ResolvedField extends ResolvedBool {
  key: string;
  label: string;
  description: string;
}

/** A group of advanced options gated by an enable toggle (Auto/On/Off). `path`
 *  is the dotted location of this block in AdvancedOptionsInput
 *  (e.g. "devices.tpm"), so the payload is built generically. `onLabel`/`offLabel`
 *  name the toggle's on/off segments (Enabled/Disabled, EFI/BIOS). */
export interface ResolvedBlock {
  key: string;
  label: string;
  description: string;
  path: string;
  onLabel: string;
  offLabel: string;
  enabled: ResolvedBool;
  fields: ResolvedField[];
}

/** The resolved advanced-options schema: an ordered list of blocks carrying both
 *  metadata and resolved values. The UI renders it generically. */
export interface AdvancedOptions {
  blocks: ResolvedBlock[];
}

/** Baseline every input block carries: the enable toggle (null=Auto, true=On,
 *  false=Off). Mirrors the backend BlockToggle. */
export interface BlockToggleInput {
  enabled?: boolean | null;
}

export interface TpmOptionsInput extends BlockToggleInput {
  persistent?: boolean | null;
}

export interface EfiOptionsInput extends BlockToggleInput {
  secureBoot?: boolean | null;
  persistent?: boolean | null;
}

/** Request payload (kept typed and KubeVirt-shaped). The generic form builds it
 *  by writing each block's resolved leaves at its metadata `path`. */
export interface AdvancedOptionsInput {
  devices?: {
    tpm?: TpmOptionsInput;
  };
  firmware?: {
    bootloader?: {
      efi?: EfiOptionsInput;
    };
  };
}

/** UI tri-state for an advanced option control. */
export type AdvancedTriState = 'inherit' | 'enabled' | 'disabled';

/** Map a UI tri-state to the nullable boolean leaf sent in the payload. */
export function triStateToLeaf(state: AdvancedTriState): boolean | null {
  switch (state) {
    case 'enabled':
      return true;
    case 'disabled':
      return false;
    default:
      return null;
  }
}

/** Derive the UI tri-state from a resolved option: a value forced on the VM maps
 *  to enabled/disabled, anything inherited maps to "inherit". */
export function resolvedToTriState(resolved: ResolvedBool | undefined): AdvancedTriState {
  if (!resolved || resolved.source !== 'vm' || resolved.value === null) {
    return 'inherit';
  }
  return resolved.value ? 'enabled' : 'disabled';
}

/** Write `value` into `obj` at a dotted `path`, creating intermediate objects.
 *  Used to build the typed payload from a block's metadata `path`. */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let node = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof node[k] !== 'object' || node[k] === null) {
      node[k] = {};
    }
    node = node[k] as Record<string, unknown>;
  }
  node[keys[keys.length - 1]] = value;
}
