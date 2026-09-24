import type { PermissionKey, PermissionScope } from '@eduflow/shared';

/** Stored data scope of a grant. Mirrors the Prisma enum `PermissionScope`. */
export type GrantScope = 'ALL' | 'CAMPUS' | 'OWN' | 'VIEW';

/** What `authenticate` reads out of the verified access token. Never read from the body. */
export interface AuthContext {
  userId: string;
  /** Null only for PLATFORM users, who choose a tenant with the X-Organization-Id header. */
  orgId: string | null;
  userType: 'STAFF' | 'PARENT' | 'STUDENT' | 'PLATFORM';
  roleKeys: string[];
  campusIds: string[];
  defaultCampusId?: string;
  sessionId?: string;
  permissionVersion?: string;
  /** How the user proved identity, for example ["pwd"] or ["pwd", "totp"]. */
  amr: string[];
}

export interface PermissionGrant {
  key: PermissionKey;
  scope: GrantScope;
}

export type { PermissionKey, PermissionScope };
