/**
 * ContainerDisk describes a vendor-provided ISO that the platform can mount
 * on an instance as a read-only CDROM (a KubeVirt container disk).
 * the catalog is intentionally open-ended so future entries (guest tools, etc.) can be
 * added without touching the UI shape.
 */
export interface ContainerDisk {
  id: string;
  displayName: string;
  bus: string;
  supportedOS: string[];
  /**
   * When true, the platform suggests mounting this entry on any VM
   * whose preference matches `supportedOS`. The create form uses this to
   * decide which checkboxes start checked.
   */
  recommended: boolean;
}
