import type { RequestHandler } from 'express';
import { AppError, forbidden } from '../lib/errors.ts';
import { runWithTenant } from '../lib/tenant-context.ts';
import { requestIdOf } from './request-id.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Opens the tenant context for the rest of the request. It runs straight after `authenticate`,
 * because everything it needs comes from the verified token plus two narrowing headers.
 */
export const tenant: RequestHandler = (req, res, next) => {
  const auth = req.auth;
  if (auth === undefined) return next(new AppError('UNAUTHENTICATED', 'Sign in to continue'));

  let orgId = auth.orgId;
  let impersonatorUserId: string | undefined;

  const headerOrg = req.get('X-Organization-Id');
  if (headerOrg !== undefined) {
    if (auth.roleKeys.includes('SUPER_ADMIN')) {
      if (!UUID.test(headerOrg)) {
        return next(
          new AppError('VALIDATION_ERROR', 'X-Organization-Id must be a UUID', [
            { field: 'X-Organization-Id', issue: 'Invalid UUID' },
          ]),
        );
      }
      orgId = headerOrg;
      impersonatorUserId = auth.userId;
    } else {
      // Answering FORBIDDEN would tell an attacker that the header is a real switch.
      req.log.warn({ userId: auth.userId }, 'X-Organization-Id ignored: not a platform user');
    }
  }

  if (orgId === null) {
    return next(
      new AppError('VALIDATION_ERROR', 'X-Organization-Id header is required', [
        { field: 'X-Organization-Id', issue: 'Required for platform users on tenant routes' },
      ]),
    );
  }

  // X-Campus-Id narrows a request to one campus. It can never widen what the user may reach.
  let activeCampusId: string | undefined;
  const headerCampus = req.get('X-Campus-Id');
  if (headerCampus !== undefined) {
    if (!UUID.test(headerCampus)) {
      return next(
        new AppError('VALIDATION_ERROR', 'X-Campus-Id must be a UUID', [
          { field: 'X-Campus-Id', issue: 'Invalid UUID' },
        ]),
      );
    }
    // An empty campus list means organization-wide reach, which is how an ORG_ADMIN signs in.
    const mayReach = auth.campusIds.length === 0 || auth.campusIds.includes(headerCampus);
    if (!mayReach) return next(forbidden('You are not assigned to this campus'));
    activeCampusId = headerCampus;
  }

  const context = {
    orgId,
    userId: auth.userId,
    campusIds: auth.campusIds,
    roles: auth.roleKeys,
    permissions: [] as string[],
    requestId: requestIdOf(res),
    ...(activeCampusId === undefined ? {} : { activeCampusId }),
    ...(impersonatorUserId === undefined ? {} : { impersonatorUserId }),
  };

  // Everything after this point, including the controller and the service, runs inside the store.
  runWithTenant(context, async () => {
    next();
  }).catch(next);
};
