import { Organization } from './organization';

export interface Session {
  session: string;
  user: User;
}

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  provider: string;
  providerId: string;
  inviteCode: string;
  personalOrg: Organization[];
  guestOrg: Organization[];
}

export interface UserRole {
  // group as groupId
  groups: string[];
  user: User;
  owner?: boolean;
}

export function getUserOrganization(user: User): Organization[] {
  const result = user.guestOrg || [];
  return [...new Map(result.concat(user.personalOrg).map(item => [item.id, item])).values()];
}
