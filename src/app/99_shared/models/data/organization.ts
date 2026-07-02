import { User, UserRole } from './user';

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  owner: User;
  users: UserRole[];
  projects: Project[];

  technicalContact?: string;
  administrativeContact?: string;
  billingContact?: string;
}

export interface Project {
  id: string;
  name: string;
}
