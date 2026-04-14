# Mobile Platform Lead — Take-Home

An anchored chat flyout drives three screens through a validated, auditable command router. State changes go through one `dispatch()`; mutations require confirmation; every attempt is logged.

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

- Expo (prebuild) + `expo-router` tabs. Flyout mounted in `app/_layout.tsx` inside `absoluteFillObject`, outside `<Stack>`, so it survives tab switches.
- `src/agent/` owns every state mutation: `parser.ts` → `schemas.ts` → `router.ts` → Zustand + `FileModule`.
- `dispatch()` = allowlist → zod → confirm gate → execute → log.
- Six commands; `setPreference` and `exportAuditLog` are confirm-gated.
- `FileModule` (Swift `FileManager` / Kotlin `java.io.File`) writes under `.documentDirectory` / `filesDir`. No `expo-file-system`.
- `ProposedActionCard` reads `pendingCommand` and only calls `confirmPendingCommand` / `cancelPendingCommand`.

## Key decisions

- Expo with prebuild over bare RN — fastest path to iOS + Android + a custom native module.
- `create-expo-module --local FileModule` — the native write is the module's reason to exist, not a shim.
- Deterministic parser, not an LLM — no network dep on the 5-minute run gate; seam at `src/agent/parser.ts`.
- Zustand + `persist` over Redux — 40 lines; prefs survive reload.
- Zod schemas colocated with the router — one source of truth for shape + validation.
- Router owns every side effect — `src/agent/ui/**` never calls `setState` or `expo-router.navigate`.
- Two confirm-gated commands — `setPreference` mandated; `exportAuditLog` added because it touches the device.
- Parser rules are intentionally dumb (~6 regex patterns) — correctness sits on the router.
- `__tests__/router.test.ts` proves off-allowlist rejection, schema rejection, and that `setPreference` parks as `pending` without mutating state.

## AI disclosure

- **Tools:** Claude Code (Sonnet 4.6).
- **Used for:** scaffolding, Zod typing, Swift + Kotlin bodies (reviewed line-by-line), test scaffolding.
- **Workflow:** drafted the command contract, confirmation policy, and log shape on paper first (`docs/APPROACH.md` — personal playbook, not a deliverable); Claude typed from that spec.
- **Mine:** architecture, router semantics, stack tradeoffs, all written prose.

## Demo script

1. Cold start → Home. Flyout handle anchored at the bottom.
2. Tap handle → "what can you do?" → transcript lists supported commands.
3. "go to explore" → Explore opens; log row `executed`.
4. "dark mode" → `ProposedActionCard` → Confirm → Profile toggle flips; log row `pending` → `executed`.
5. "Dispatch Invalid Command" button → rejected row, reason `not-in-allowlist`.
6. Profile → Activity Log shows executed / rejected / pending rows with timestamps.
7. Profile → Export Audit Log → Confirm → native module writes JSON → alert shows absolute path.

## Submission checklist

- [x] Repo named `mobile-platform-homework-<first-last>`, default branch `main`
- [x] README includes Setup commands for iOS + Android
- [x] README word count ≤ 500 (excluding commands / checkboxes)
- [x] `agent/CONTEXT.md` included
- [x] `artifacts/decisions.md` included (≤ 400 words)
- [x] `artifacts/architecture.md` included
- [ ] `artifacts/demo-ios.mp4` and `artifacts/demo-android.mp4` included
- [x] One meaningful test included and described
- [x] AI disclosure included (tools + how + what was mine)
