# EduFlow web app (`@eduflow/client`)

The Next.js App Router application that staff, parents and students use. It renders in the
browser. It holds no secrets and never touches the database: it talks to the Express API at
`/api/v1` and to nothing else.

## Run it

Install once, from the **repository root**, never from this folder:

```bash
npm install
```

Then copy the settings file and start the app:

```bash
cp client/.env.example client/.env.local
npm run dev -w client
```

Open `http://localhost:3000`. The API is expected on `http://localhost:4000/api/v1`.

The app starts with no API, no database and no Redis. Sign-in shows "Sign-in is not built yet"
until the authentication module lands, and the dashboard tiles show a dash instead of a number.

### The sample session

`NEXT_PUBLIC_PREVIEW_SESSION=true` puts a clearly marked sample session into the shell, so the
header, the campus switcher and the role-aware sidebar can be seen before the login route
exists. The header then shows a "Sample session" chip. Set it to `false` the day sign-in works,
and never set it to `true` outside your own laptop.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev -w client` | Starts the dev server on port 3000 |
| `npm run build -w client` | Production build |
| `npm run start -w client` | Serves the production build |
| `npm run typecheck -w client` | `tsc --noEmit`, no `any` allowed |
| `npm run lint -w client` | ESLint, using the rule set at the repository root |
| `npm run test -w client` | Vitest unit and component tests |

## Where things live

```text
src/
  app/            routes only: thin pages and layouts
    (auth)/       centred card, for anyone without a session
    (dashboard)/  header, role-aware sidebar, content area
  features/       one folder per module: components, hooks, api, schemas
  components/ui/  the primitives every screen uses
  components/layout/  header, sidebar, campus switcher, user menu
  config/         navigation.ts: the menu, as data
  lib/            api-client, permissions, formatters, form helpers
  providers/      query client and session
  middleware.ts   sends a signed-out visitor to /login
```

A `page.tsx` file does three things at most: set the title, read the URL parameters, and render
one feature component. Data loading never happens in a page.

## Add a feature

Take Discounts as the example.

1. Add the screens: `src/features/discounts/` with `components/`, `hooks/`, `api/` and an
   `index.ts` that exports the screens other folders may use.
2. Put one function per endpoint in `api/`, built on `apiFetch` from `@/lib/api-client`. Nothing
   else in the client may call `fetch`.
3. Put the TanStack Query hooks in `hooks/`, with a query key factory in `api/`. The selected
   campus belongs in the key, because the API answers per campus.
4. Add the thin pages under `src/app/(dashboard)/discounts/`.
5. Turn the menu entry on: set `isEnabled: true` for `DSC` in `src/config/navigation.ts`.
6. Wrap every action button in `<Can permission="discounts.create">`. Hiding a button is only
   for comfort; the API checks the same key on every request.

## Rules that do not bend

- No `any`. `npm run typecheck` must stay clean.
- Only `src/lib/env.ts` reads `process.env`. Only `src/lib/api-client.ts` calls `fetch`.
- The access token lives in memory, never in `localStorage` and never in a readable cookie.
- Use the design tokens (`bg-primary`, `text-ink-subtle`, `border-line`), never a raw hex value
  and never `bg-blue-600`. Tenant branding and dark mode both depend on it.
- Money is formatted with `lib/formatters/currency.ts` and never calculated in the browser.
- Every list has a loading, an empty and an error state. A blank data area is a bug.
- Work at 390 px wide first. No sideways scroll on a phone.

## Notes on the design tokens

`src/app/globals.css` holds the colour, type, spacing and radius tokens from the design system
chapter. Colours are stored as HSL triples so a tenant's primary colour can replace one variable
without touching a component. The light values come from the chapter; the dark values are a
working set until the Phase 3 dark-mode pass, and every one of them keeps text at 4.5:1.
