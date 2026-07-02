/**
 * View model for VirtualMachinePreference.
 * Maps the 7 domain-relevant fields from VirtualMachinePreferenceSpec.
 * Returned by GET /{orgId}/{az}/{projectId}/vm-type/{name}
 *
 * Types mirror the KubeVirt instancetypev1beta1 Go structs.
 */

export interface ClockPreferences {
  preferredClockOffset?: {
    utc?: { offsetSeconds?: number };
    timezone?: string;
  };
  preferredTimer?: {
    hpet?: { tickPolicy?: string; present?: boolean };
    kvm?: { present?: boolean };
    pit?: { tickPolicy?: string; present?: boolean };
    rtc?: { tickPolicy?: string; present?: boolean; track?: string };
    hyperv?: { present?: boolean };
  };
}

export interface CPUPreferences {
  preferredCPUTopology?: string;
  preferredCPUFeatures?: { name: string; policy?: string }[];
}

export interface DevicePreferences {
  preferredAutoattachGraphicsDevice?: boolean;
  preferredAutoattachMemBalloon?: boolean;
  preferredAutoattachPodInterface?: boolean;
  preferredAutoattachSerialConsole?: boolean;
  preferredAutoattachInputDevice?: boolean;
  preferredBlockMultiQueue?: boolean;
  preferredCdromBus?: string;
  preferredDisableHotplug?: boolean;
  preferredDiskBus?: string;
  preferredDiskBlockSize?: {
    custom?: { logical?: number; physical?: number };
    matchVolume?: { enabled?: boolean };
  };
  preferredDiskCache?: string;
  preferredDiskDedicatedIoThread?: boolean;
  preferredInputBus?: string;
  preferredInputType?: string;
  preferredInterfaceMasquerade?: Record<string, unknown>;
  preferredInterfaceModel?: string;
  preferredLunBus?: string;
  preferredNetworkInterfaceMultiQueue?: boolean;
  preferredRng?: Record<string, unknown>;
  preferredSoundModel?: string;
  preferredTPM?: Record<string, unknown>;
  preferredUseVirtioTransitional?: boolean;
  preferredVirtualGPUOptions?: Record<string, unknown>;
}

export interface FeaturePreferences {
  preferredAcpi?: Record<string, unknown>;
  preferredApic?: { enabled?: boolean; endOfInterrupt?: boolean };
  preferredHyperv?: {
    relaxed?: { enabled?: boolean };
    vapic?: { enabled?: boolean };
    spinlocks?: { enabled?: boolean; spinlocks?: number };
    vpindex?: { enabled?: boolean };
    runtime?: { enabled?: boolean };
    synic?: { enabled?: boolean };
    synictimer?: { enabled?: boolean; direct?: { enabled?: boolean } };
    reset?: { enabled?: boolean };
    vendorid?: { enabled?: boolean; vendorid?: string };
    frequencies?: { enabled?: boolean };
    reenlightenment?: { enabled?: boolean };
    tlbflush?: { enabled?: boolean };
    ipi?: { enabled?: boolean };
    evmcs?: { enabled?: boolean };
  };
  preferredKvm?: { hidden?: boolean };
  preferredPvspinlock?: { enabled?: boolean };
  preferredSmm?: { enabled?: boolean };
}

export interface FirmwarePreferences {
  preferredUseBios?: boolean;
  preferredUseBiosSerial?: boolean;
  preferredUseEfi?: boolean;
  preferredUseSecureBoot?: boolean;
}

export interface MachinePreferences {
  preferredMachineType?: string;
}

export interface VolumePreferences {
  preferredStorageClassName?: string;
}

export interface VirtualMachinePreferenceView {
  name: string;
  clock?: ClockPreferences;
  cpu?: CPUPreferences;
  devices?: DevicePreferences;
  features?: FeaturePreferences;
  firmware?: FirmwarePreferences;
  machine?: MachinePreferences;
  volumes?: VolumePreferences;
}
