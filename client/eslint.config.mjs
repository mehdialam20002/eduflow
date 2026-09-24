// The repository root owns the rule set for all three workspaces, so a rule is
// changed in exactly one place. This file only adds the ignores that are
// specific to a Next.js build output folder.
//
// The guard keeps `npm run lint -w client` working on a checkout where the root
// config has not been added yet; ESLint then lints with the ignores only.
let rootConfig = [];
try {
  const imported = await import('../eslint.config.mjs');
  rootConfig = imported.default ?? [];
} catch {
  rootConfig = [];
}

export default [
  { ignores: ['.next/**', 'coverage/**', 'next-env.d.ts'] },
  ...rootConfig,
];
