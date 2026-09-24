import { describe, expect, it } from '@eduflow/shared/testing';
import { MODULE_CODES, PERMISSION_KEYS } from '@eduflow/shared';
import { NAV_ITEMS, phaseOf } from './navigation.ts';

// The menu is the one place where a typed permission key or module code would
// silently hide a whole module, so it is checked against the generated lists.
describe('navigation', () => {
  it('uses only permission keys that the shared package knows', () => {
    const unknown = NAV_ITEMS.filter((item) => !PERMISSION_KEYS.includes(item.permission));
    expect(unknown.map((item) => item.permission)).toEqual([]);
  });

  it('uses only module codes from the canon list of 34 modules', () => {
    const unknown = NAV_ITEMS.filter((item) => !MODULE_CODES.includes(item.moduleCode));
    expect(unknown.map((item) => item.moduleCode)).toEqual([]);
  });

  it('gives every entry its own route', () => {
    const routes = NAV_ITEMS.map((item) => item.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('reads the release phase from the shared module list', () => {
    const dashboard = NAV_ITEMS.find((item) => item.moduleCode === 'DASH');
    expect(dashboard).toBeDefined();
    expect(dashboard === undefined ? null : phaseOf(dashboard)).toBe(1);
  });
});
