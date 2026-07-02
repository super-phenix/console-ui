import { Volume } from './vmi.model';

export function extractVolumeEID(volume: Volume): string {
  if (volume.dataVolume?.name) {
    return volume.dataVolume.name;
  }
  if (volume.persistentVolumeClaim?.claimName) {
    return volume.persistentVolumeClaim?.claimName;
  }

  return volume.name;
}
