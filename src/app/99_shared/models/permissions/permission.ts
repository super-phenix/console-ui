export interface PermissionListBody {
  entityType: EntityType;
  entityId?: string;
}

export type PermissionSetMap = Map<string, string[]>;

export type EntityType = 'organization' | 'project';

export enum EntityTypeEnum {
  Organization = 'organization',
  Project = 'project',
}

export interface Group {
  id: string;
  name: string;
  allProjects: boolean;
  projectIds: string[];
  permissionSets: string[];
  /** Set on platform-managed groups; absent means the group is custom and editable. */
  predefinedKey?: string;
}
