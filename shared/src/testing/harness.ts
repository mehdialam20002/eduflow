/**
 * A tiny Vitest-shaped API on top of Node's built-in test runner.
 *
 * Why this exists: Vitest and tsx both ship an unsigned `esbuild.exe`, and the founder's Windows
 * machine enforces an Application Control policy that refuses to run unsigned executables. Node 24
 * runs TypeScript directly and has a test runner built in, so tests use that instead. Keeping the
 * familiar `describe / it / expect` shape means the test files, and every example in the
 * specifications, stay the same. If the policy is ever relaxed, swapping back to Vitest is a
 * one-line change in each test file.
 *
 * Run tests with:  npm test        (root, every workspace)
 *                  node --test src/modules/fees   (one folder)
 */
import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it, test } from 'node:test';

export { after, afterEach, before, beforeEach, describe, it, test };
export const afterAll = after;
export const beforeAll = before;

type AnyFn = (...args: unknown[]) => unknown;

interface MockFn extends AnyFn {
  mock: { calls: unknown[][]; mockImplementation: (fn: AnyFn) => void };
  mockImplementation: (fn: AnyFn) => MockFn;
  mockReturnValue: (value: unknown) => MockFn;
  mockResolvedValue: (value: unknown) => MockFn;
  mockRejectedValue: (error: unknown) => MockFn;
  mockReturnValueOnce: (value: unknown) => MockFn;
  mockResolvedValueOnce: (value: unknown) => MockFn;
  mockRejectedValueOnce: (error: unknown) => MockFn;
}

function isMockFn(value: unknown): value is MockFn {
  return typeof value === 'function' && typeof (value as MockFn).mock === 'object';
}

function callsOf(value: unknown): unknown[][] {
  if (!isMockFn(value)) {
    throw new TypeError('Expected a mock function created with vi.fn()');
  }
  return value.mock.calls;
}

/** Only the matchers the EduFlow tests actually use, so there is no hidden behaviour. */
class Expectation<T> {
  // Written out rather than declared as constructor parameter properties, because Node runs
  // this TypeScript by stripping types only and cannot generate the assignments for them.
  readonly actual: T;
  readonly negated: boolean;

  constructor(actual: T, negated = false) {
    this.actual = actual;
    this.negated = negated;
  }

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.negated);
  }

  /** Awaits a rejected promise and asserts on the thrown error. */
  get rejects(): { toBeInstanceOf: (c: abstract new (...a: never[]) => unknown) => Promise<void>;
    toThrow: (expected?: RegExp | string) => Promise<void> } {
    const settle = async (): Promise<unknown> => {
      try {
        await (this.actual as Promise<unknown>);
      } catch (error) {
        return error;
      }
      return assert.fail('Expected the promise to reject, but it resolved');
    };
    return {
      toBeInstanceOf: async (constructor) => {
        const error = await settle();
        assert.ok(error instanceof constructor, `Rejected with ${format(error)}, not ${constructor.name}`);
      },
      toThrow: async (expected) => {
        const error = await settle();
        if (expected === undefined) return;
        const message = error instanceof Error ? error.message : String(error);
        const matches = expected instanceof RegExp ? expected.test(message) : message.includes(expected);
        assert.ok(matches, `Rejection message ${format(message)} does not match ${format(expected)}`);
      },
    };
  }

  /** Awaits a fulfilled promise and asserts on its value. */
  get resolves(): { toBe: (expected: unknown) => Promise<void>; toEqual: (expected: unknown) => Promise<void> } {
    return {
      toBe: async (expected) => expect(await (this.actual as Promise<unknown>)).toBe(expected),
      toEqual: async (expected) => expect(await (this.actual as Promise<unknown>)).toEqual(expected),
    };
  }

  private check(passed: boolean, message: string, expected?: unknown): void {
    if (passed === this.negated) {
      assert.fail(
        `${message}\n  actual:   ${format(this.actual)}` +
          (expected === undefined ? '' : `\n  expected: ${format(expected)}`),
      );
    }
  }

  toBe(expected: unknown): void {
    this.check(Object.is(this.actual, expected), 'Values are not the same reference or value', expected);
  }

  toEqual(expected: unknown): void {
    let same = true;
    try {
      assert.deepStrictEqual(this.actual, expected);
    } catch {
      same = false;
    }
    this.check(same, 'Values are not deeply equal', expected);
  }

  toStrictEqual(expected: unknown): void {
    this.toEqual(expected);
  }

  toContain(expected: unknown): void {
    const actual = this.actual;
    const found = typeof actual === 'string'
      ? actual.includes(String(expected))
      : Array.isArray(actual)
        ? actual.includes(expected)
        : false;
    this.check(found, 'Value does not contain the expected item', expected);
  }

  toMatch(expected: RegExp | string): void {
    const actual = String(this.actual);
    const found = expected instanceof RegExp ? expected.test(actual) : actual.includes(expected);
    this.check(found, 'Value does not match', expected);
  }

  toThrow(expected?: RegExp | string | (abstract new (...args: never[]) => Error)): void {
    if (typeof this.actual !== 'function') {
      throw new TypeError('expect(...).toThrow() needs a function');
    }
    let thrown: unknown;
    let didThrow = false;
    try {
      (this.actual as AnyFn)();
    } catch (error) {
      didThrow = true;
      thrown = error;
    }
    if (didThrow && expected !== undefined) {
      if (typeof expected === 'function') {
        this.check(thrown instanceof expected, 'Threw the wrong error type', expected.name);
        return;
      }
      const message = thrown instanceof Error ? thrown.message : String(thrown);
      const matches = expected instanceof RegExp ? expected.test(message) : message.includes(expected);
      this.check(matches, 'Thrown message does not match', expected);
      return;
    }
    this.check(didThrow, this.negated ? 'Function threw and should not have' : 'Function did not throw');
  }

  toBeInstanceOf(expected: abstract new (...args: never[]) => unknown): void {
    this.check(this.actual instanceof expected, 'Value is not an instance of', expected.name);
  }

  toHaveProperty(key: string, value?: unknown): void {
    const holder = this.actual as Record<string, unknown> | null;
    const present = holder !== null && typeof holder === 'object' && key in holder;
    if (value === undefined) {
      this.check(present, `Object has no property "${key}"`);
      return;
    }
    this.check(present && Object.is(holder?.[key], value), `Property "${key}" does not have the expected value`, value);
  }

  toHaveLength(expected: number): void {
    const length = (this.actual as { length?: number })?.length;
    this.check(length === expected, 'Length does not match', expected);
  }

  toBeDefined(): void {
    this.check(this.actual !== undefined, 'Value is undefined');
  }

  toBeUndefined(): void {
    this.check(this.actual === undefined, 'Value is defined');
  }

  toBeNull(): void {
    this.check(this.actual === null, 'Value is not null');
  }

  toBeTruthy(): void {
    this.check(Boolean(this.actual), 'Value is not truthy');
  }

  toBeFalsy(): void {
    this.check(!this.actual, 'Value is not falsy');
  }

  toBeGreaterThan(expected: number): void {
    this.check(Number(this.actual) > expected, 'Value is not greater than', expected);
  }

  toBeGreaterThanOrEqual(expected: number): void {
    this.check(Number(this.actual) >= expected, 'Value is not greater than or equal to', expected);
  }

  toBeLessThan(expected: number): void {
    this.check(Number(this.actual) < expected, 'Value is not less than', expected);
  }

  toBeLessThanOrEqual(expected: number): void {
    this.check(Number(this.actual) <= expected, 'Value is not less than or equal to', expected);
  }

  toBeCloseTo(expected: number, digits = 2): void {
    const difference = Math.abs(Number(this.actual) - expected);
    this.check(difference < 10 ** -digits / 2, 'Number is not close enough to', expected);
  }

  toHaveBeenCalled(): void {
    this.check(callsOf(this.actual).length > 0, 'Mock was never called');
  }

  toHaveBeenCalledTimes(expected: number): void {
    this.check(callsOf(this.actual).length === expected, 'Mock call count does not match', expected);
  }

  toHaveBeenCalledWith(...expected: unknown[]): void {
    const matched = callsOf(this.actual).some((call) => {
      try {
        assert.deepStrictEqual(call, expected);
        return true;
      } catch {
        return false;
      }
    });
    this.check(matched, 'Mock was not called with', expected);
  }
}

function format(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'function') return `[function ${value.name || 'anonymous'}]`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

const stubbed = new Map<string, { existed: boolean; value: unknown }>();

/** The small slice of Vitest's `vi` helper the EduFlow tests use. */
export const vi = {
  /**
   * A hand-written mock rather than node:test's `mock.fn`, because that one hands back a proxy
   * whose `.mock` cannot be reshaped, and the tests read Vitest's `mock.calls[0][1]` form.
   */
  fn(implementation?: AnyFn): MockFn {
    const calls: unknown[][] = [];
    const queue: AnyFn[] = [];
    let standing: AnyFn = implementation ?? ((): unknown => undefined);

    const mockFn = ((...args: unknown[]): unknown => {
      calls.push(args);
      const next = queue.shift() ?? standing;
      return next(...args);
    }) as MockFn;

    mockFn.mock = {
      calls,
      mockImplementation: (next: AnyFn) => {
        standing = next;
      },
    };
    const replace = (next: AnyFn): MockFn => {
      standing = next;
      return mockFn;
    };
    const once = (next: AnyFn): MockFn => {
      queue.push(next);
      return mockFn;
    };
    mockFn.mockImplementation = replace;
    mockFn.mockReturnValue = (value) => replace(() => value);
    mockFn.mockResolvedValue = (value) => replace(() => Promise.resolve(value));
    mockFn.mockRejectedValue = (error) => replace(() => Promise.reject(error));
    mockFn.mockReturnValueOnce = (value) => once(() => value);
    mockFn.mockResolvedValueOnce = (value) => once(() => Promise.resolve(value));
    mockFn.mockRejectedValueOnce = (error) => once(() => Promise.reject(error));
    return mockFn;
  },

  /** Replaces a global for one test; call unstubAllGlobals in afterEach. */
  stubGlobal(name: string, value: unknown): void {
    const holder = globalThis as unknown as Record<string, unknown>;
    if (!stubbed.has(name)) {
      stubbed.set(name, { existed: name in holder, value: holder[name] });
    }
    holder[name] = value;
  },

  unstubAllGlobals(): void {
    const holder = globalThis as unknown as Record<string, unknown>;
    for (const [name, previous] of stubbed) {
      if (previous.existed) holder[name] = previous.value;
      else delete holder[name];
    }
    stubbed.clear();
  },

  /** Mocks are created per test, so there is nothing global to reset; kept for familiarity. */
  resetAllMocks(): void {},
};
