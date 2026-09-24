// The only public door of @eduflow/shared.
//
// The web app and the API both import from '@eduflow/shared' and never reach inside the
// package by path, so everything below stays free to move.

// Constants generated from the specifications. Never edited by hand.
export * from './generated/index.ts';

// The API contract.
export * from './types/api.ts';
export * from './schemas/common.ts';

// Pure helpers. No side effects, no environment, no network.
export * from './lib/money.ts';
export * from './lib/dates.ts';
export * from './lib/permissions.ts';

// Domain events and queues.
export * from './constants/events.ts';
