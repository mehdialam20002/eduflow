'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  PERMISSION_KEYS,
  SYSTEM_ROLES,
  scopeFor,
  type PermissionKey,
  type PermissionScope,
  type SystemRole,
} from '@eduflow/shared';
import { env } from '@/lib/env';
import { setActiveCampusId } from '@/lib/api-client';

// Session stub. It holds the shape that GET /auth/me (AUTH-API-14) returns, so the
// screens built on it need no change on the day the auth feature replaces the body
// of this file with a real query.

/** Data scope of one grant, as AUTH-API-14 writes it. */
export type GrantScope = 'ALL' | 'CAMPUS' | 'OWN' | 'VIEW';

export interface SessionUser {
  id: string;
  userType: 'PLATFORM' | 'STAFF' | 'PARENT' | 'STUDENT';
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface SessionRole {
  key: string;
  name: string;
  isSystem: boolean;
}

export interface SessionCampus {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SessionOrganization {
  id: string;
  name: string;
  slug: string;
  type: 'SCHOOL' | 'COACHING' | 'COLLEGE' | 'TRAINING_CENTRE';
  timezone: string;
  currency: string;
}

export interface Session {
  user: SessionUser;
  organization: SessionOrganization;
  roles: SessionRole[];
  grants: ReadonlyMap<PermissionKey, GrantScope>;
  campuses: SessionCampus[];
  planFeatures: string[];
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionContextValue {
  status: SessionStatus;
  session: Session | null;
  /** True while the shell shows the sample session instead of a signed-in user. */
  isPreview: boolean;
  activeCampusId: string | null;
  selectCampus: (campusId: string) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SCOPE_BY_PERMISSION_SCOPE: Record<PermissionScope, GrantScope | null> = {
  yes: 'ALL',
  campus: 'CAMPUS',
  own: 'OWN',
  view: 'VIEW',
  no: null,
};

/** Turns a role into the grant map that AUTH-API-14 will later send. */
function grantsForRole(role: SystemRole): Map<PermissionKey, GrantScope> {
  const grants = new Map<PermissionKey, GrantScope>();
  for (const key of PERMISSION_KEYS) {
    const scope = SCOPE_BY_PERMISSION_SCOPE[scopeFor(role, key)];
    if (scope !== null) grants.set(key, scope);
  }
  return grants;
}

// The canon sample tenant, so every screenshot in the docs matches the screen.
const PREVIEW_ROLE: SystemRole = 'ORG_ADMIN';

function buildPreviewSession(): Session {
  return {
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      userType: 'STAFF',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'rajesh@brightfuture.example',
      phone: '+919839012345',
    },
    organization: {
      id: '00000000-0000-4000-8000-0000000000a1',
      name: 'Bright Future Public School',
      slug: 'bright-future',
      type: 'SCHOOL',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
    roles: [{ key: PREVIEW_ROLE, name: SYSTEM_ROLES[PREVIEW_ROLE].label, isSystem: true }],
    grants: grantsForRole(PREVIEW_ROLE),
    campuses: [
      { id: 'campus-main', name: 'Main Campus', isDefault: true },
      { id: 'campus-gomti', name: 'Gomti Nagar Campus', isDefault: false },
    ],
    planFeatures: ['plan.PRO'],
  };
}

function defaultCampusId(session: Session | null): string | null {
  if (session === null) return null;
  const preferred = session.campuses.find((campus) => campus.isDefault) ?? session.campuses[0];
  return preferred?.id ?? null;
}

export function SessionProvider({ children }: { children: ReactNode }): ReactNode {
  const isPreview = env.previewSession;
  const [session, setSession] = useState<Session | null>(() =>
    isPreview ? buildPreviewSession() : null,
  );
  const [campusId, setCampusId] = useState<string | null>(() =>
    defaultCampusId(isPreview ? buildPreviewSession() : null),
  );

  // Every later request carries X-Campus-Id, so the api-client is told outside render.
  useEffect(() => {
    setActiveCampusId(campusId);
  }, [campusId]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status: session === null ? 'unauthenticated' : 'authenticated',
      session,
      isPreview,
      activeCampusId: campusId,
      selectCampus: (nextCampusId: string) => {
        setCampusId(nextCampusId);
      },
      clearSession: () => {
        setSession(null);
        setCampusId(null);
      },
    }),
    [session, campusId, isPreview],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession must be used inside <AppProviders>.');
  }
  return value;
}
