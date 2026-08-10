# Virtual Gallery

3D virtual exhibitions for artists. Upload paintings, arrange them on the walls of a gallery template, publish a link anyone can walk through. No code. No 3D experience required.

> **Status:** Phase 8 complete — hardening, Stripe billing scaffold, legal pages, launch checklist. Ready for closed beta.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript 5.8 |
| 3D | three · @react-three/fiber · @react-three/drei |
| UI | Tailwind CSS 4 · shadcn/ui |
| State | Zustand (editor) · TanStack Query (server) |
| Backend | Firebase Auth · Firestore · Storage · Cloud Functions |
| Image pipeline | Cloud Run (sharp + KTX2) — Phase 2 |

## Architecture in one paragraph

Firestore holds **metadata**. Publishing compiles an immutable `SceneManifest` to CDN storage. The public viewer performs **zero** Firestore reads. Templates are declarative data (one GLB + one manifest document) so adding a gallery style never requires a deploy. Workspaces are the tenant boundary from day one, even though v1 never shows the word. The shared renderer in `src/three` is mounted by both the editor and the viewer, which is what makes "what you arrange is what they see" true by construction.

See the [architecture canvas](../.cursor/projects/Users-aboyassen-virtualproject/canvases/virtual-gallery-architecture.canvas.tsx) for the full blueprint.

## Layer rule

```
app  →  features  →  infrastructure  →  core
                         ↘ three ↗
```

Dependencies point inward only. `eslint-plugin-boundaries` makes a violation a failed CI run. `src/core` and `src/three` import nothing from React, Firebase, or Next routing — they can be lifted into packages the moment a second consumer appears.

## Scripts

```bash
npm run dev          # Next.js dev server
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint + architecture boundaries
npm run test         # Vitest (domain is 100% unit-tested)
npm run build        # Production build
npm run verify       # typecheck + lint + test + build
npm run emulators    # Firebase Auth / Firestore / Storage / Functions
npm run seed:templates  # Seed template catalogue (emulators only)
npm run seed:demo       # Seed free + pro demo artists + admin (emulators only)
npm run seed:admin      # Seed platform admin only (emulators only)
npm run e2e          # Playwright
```

## Local setup

1. `cp .env.example .env.local` (a demo `.env.local` for emulators is already present).
2. `npm install` and `npm --prefix functions install`
3. Java 11+ on `PATH` (Firestore/Storage emulators). Homebrew: `brew install openjdk@11`
4. Start emulators (needs Java):

```bash
export JAVA_HOME="$(brew --prefix openjdk@11)"
export PATH="$JAVA_HOME/bin:$PATH"
npm run emulators
```

5. Seed local data (emulators must be running):

```bash
npm run seed:templates
npm run seed:demo
```

6. In another terminal: `npm run dev` (binds `0.0.0.0` so LAN works; `allowedDevOrigins` auto-includes local IPs).
7. Open **[http://localhost:3000/sign-in](http://localhost:3000/sign-in)** (prefer localhost over the Network IP — Turbopack/HMR on LAN can leave React unhydrated).

**Public demos (no login):**
- Hub: [http://localhost:3000/demo](http://localhost:3000/demo) — Pro / Walk / Mockups
- Pro hall: [http://localhost:3000/demo/pro](http://localhost:3000/demo/pro) — Mega Wing
- Free room: [http://localhost:3000/demo/walk](http://localhost:3000/demo/walk) — Quiet Rooms / Modern White
- Room mockups: [http://localhost:3000/demo/mockups](http://localhost:3000/demo/mockups)

### Emulator logins

| Account | Email | Password | Role |
| --- | --- | --- | --- |
| Demo artist | `demo@virtualgallery.dev` | `Demo1234!` | Free plan — up to **3 galleries** |
| Pro demo | `pro@virtualgallery.dev` | `ProDemo1234!` | Pro plan — huge halls + up to **10 galleries** (editor; public walk is `/demo/pro`) |
| Platform admin | `admin@virtualgallery.dev` | `Admin1234!` | Ops console at [`/admin`](http://localhost:3000/admin) |

The sign-in page shows both when `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`. Set `ADMIN_EMAILS=admin@virtualgallery.dev` (see `.env.example`).

Sign-in methods: **email + password** (default), magic link, or Google. Magic-link codes still print in the Auth emulator logs / Emulator UI.

Platform admins are gated by `ADMIN_EMAILS` (comma-separated) and/or the Auth custom claim `platformAdmin`. `seed:admin` / `seed:demo` and the admin panel can set the claim.

Firebase projects (`virtual-gallery-dev` / `staging` / `prod`) are declared in `.firebaserc`. Create them in the Firebase console before pointing `.env.local` at a real project.

## Phase map

| Phase | Focus | Exit test |
| --- | --- | --- |
| **0** | Foundations (done) | Boundary violation and perf regression fail CI |
| **1** | Auth + account (done) | New user lands on empty dashboard |
| **2** | Asset pipeline (done) | 40 MB TIFF → ready KTX2 LODs in &lt;30s |
| **3** | Templates + renderer (done) | Hand-written manifest renders a walkable room |
| **4** | Editor MVP (done) | Artist hangs 10 works in &lt;10 minutes, unassisted |
| **5** | Publish pipeline (done) | Publish writes CDN manifest; rollback is one click |
| **6** | Public viewer (done) | &lt;2s first paint and 30fps on a mid-range Android; Lighthouse SEO at 100 |
| **7** | Profile, analytics, leads + 3 more templates (done) | Templates added with zero code |
| **8** | Hardening + launch (done) | 10 real artists publish a gallery they'd put on their site |

## Deploy on Vercel

Next.js is auto-detected — no `vercel.json` required. Use **Node 22** (see `engines` in `package.json`).

1. Create/link a Vercel project (`vercel` CLI or Import on [vercel.com](https://vercel.com)).
2. Set env vars from the **Vercel production** section in `.env.example`. Leave `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` **unset** (never `true`).
3. Paste `FIREBASE_ADMIN_CREDENTIALS` as one-line service-account JSON (required for sessions / server routes).
4. Deploy; then in Firebase Console → Authentication → Authorized domains, add `*.vercel.app` / your custom domain.
5. Deploy Firestore/Storage rules to the same Firebase project (`firebase use prod && firebase deploy --only firestore,storage`).

CLI (if not logged in): `npx vercel login` → `npx vercel` (preview) → `npx vercel --prod`.

## Launch checklist (closed beta)

1. Point `.env.local` at a real Firebase project (Auth, Firestore, Storage rules deployed).
2. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
3. Configure Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_STUDIO`, `STRIPE_WEBHOOK_SECRET`; webhook → `/api/billing/webhook`.
4. Optional: `RESEND_API_KEY` + `EMAIL_FROM` for welcome emails (otherwise logged).
5. Deploy rules/indexes: `firebase deploy --only firestore,storage`.
6. Seed templates: `npm run seed:templates`.
7. Smoke: sign-up → upload → hang → publish → `/g/{slug}` → enquire → inbox → analytics.
8. Invite ~10 artists; collect whether they'd put the link on their own site.
9. Monitor `/api/health` and `[client-error]` / `[email:log]` server logs.

## Decisions locked in Phase 0

1. Scene delivery via compiled CDN manifest (viewer: zero DB reads).
2. Workspaces as the tenant boundary from day one.
3. Single Next.js app with lint-enforced layers (monorepo when a second consumer appears).
4. Full KTX2/Basis LOD ladder on Cloud Run.
5. Plan gates from day one; Stripe Checkout/Portal in Phase 8.
