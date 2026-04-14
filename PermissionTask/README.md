# Mobile Platform Lead — Take-Home

An anchored chat flyout drives three screens through one validated, auditable command router. Every state change goes through `dispatch()`; mutations confirm; every attempt is logged.

## Setup

Prereqs: Node ≥ 20, npm ≥ 10, Xcode, Android Studio with JDK 17, a booted simulator or emulator.

```bash
npm install
npx expo prebuild --clean    # generates ios/ and android/ (gitignored by design — CNG)
npm run ios
npm run android
npm test

# if iOS Pods stall:
cd ios && pod install --repo-update && cd ..

# if Android Gradle fails on JDK:
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

## Architecture (TL;DR)

- Expo (prebuild) + `expo-router` tabs. Flyout mounted in `app/_layout.tsx` outside `<Stack>` so it survives tab switches.
- `src/agent/`: `parser.ts` → `schemas.ts` → `router.ts` → Zustand + `FileModule`.
- `dispatch()` = allowlist → zod → confirm gate → execute → log.
- Six commands; `setPreference` and `exportAuditLog` confirm-gated.
- `FileModule` (Swift `FileManager` / Kotlin `java.io.File`) writes under `.documentDirectory` / `filesDir`. No `expo-file-system`.

## Deep linking (stretch — not built)

Not built in the 6h box. See [`artifacts/deep-linking.md`](./artifacts/deep-linking.md): three URLs from the brief, dispatched through the **same** Command Router so links inherit allowlist + zod + confirm + audit. iOS AASA + Android `autoVerify` App Links via `app.json`.

## Key decisions

- Expo prebuild over bare RN — fastest path to iOS + Android + a custom native module.
- `create-expo-module --local FileModule` — the native write is the module's reason to exist, not a shim.
- Deterministic parser, not an LLM — no network dep on the 5-min run gate; seam at `src/agent/parser.ts`.
- Zustand + `persist` over Redux — 40 lines; prefs survive reload.
- Zod schemas colocated with the router — one source of truth for shape + validation.
- Router owns every side effect — `src/agent/ui/**` never calls `setState` or `expo-router.navigate`.
- Confirm-gated: `setPreference` (mandated) and `exportAuditLog` (touches the device).
- `__tests__/router.test.ts` proves three `dispatch()` invariants: off-allowlist commands reject with `not-in-allowlist`, malformed payloads reject via zod, and `setPreference` parks as `pendingCommand` without mutating state until confirmation. Run with `npm test`.

## AI disclosure

- **Tools:** Claude Code (Sonnet 4.6).
- **Used for:** scaffolding, Zod typing, Swift + Kotlin bodies (reviewed line-by-line), test scaffolding.
- **Workflow:** drafted the command contract, confirmation policy, and log shape first; Claude typed from that spec.
- **Mine:** architecture, router semantics, stack tradeoffs, all written prose.

## Demo script

1. Cold start → Home; flyout handle anchored at bottom.
2. Tap handle → "what can you do?" → transcript lists supported commands.
3. "go to explore" → Explore opens; log row `executed`.
4. "dark mode" → `ProposedActionCard` → Confirm → toggle flips; log `pending` → `executed`.
5. "Dispatch Invalid Command" button → rejected row, reason `not-in-allowlist`.
6. Profile → Activity Log shows executed / rejected / pending rows with timestamps.
7. Profile → Export Audit Log → Confirm → native module writes JSON; alert shows path.

## Next steps

- **Web portal + deep links** — wire the three URLs from `artifacts/deep-linking.md`; tag log rows with `CommandSource: 'deepLink'`.
- **LLM behind the router** — swap `parser.ts` for an intent classifier; router contract unchanged; deterministic parser becomes offline fallback.
- **Android export UX** — `FileModule` writes to app-private `filesDir`; move to SAF / `MediaStore.Downloads` so users can find the JSON.
- **Expand command surface** — `resetPreferences` (confirm-gated), zod enums for `applyExploreFilter`.

## Submission checklist

- [x] Repo named `mobile-platform-homework-<first-last>`, default branch `main`
- [x] README includes Setup commands for iOS + Android
- [x] README word count ≤ 500 (excluding commands / checkboxes)
- [x] `agent/CONTEXT.md` included
- [x] `artifacts/decisions.md` included (≤ 400 words)
- [x] `artifacts/architecture.md` included
- [x] `artifacts/demo-ios.mp4` and `artifacts/demo-android.mp4` included
- [x] One meaningful test included and described
- [x] AI disclosure included (tools + how + what was mine)
