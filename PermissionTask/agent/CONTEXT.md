# Agent Context

## What this app is

A three-screen Expo app (Home / Explore / Profile) whose primary UX is an anchored chat flyout that drives the UI through a validated, auditable command router. The content on each screen is placeholder — the command pipeline is the product.

## What the agent can do

- Navigate between the three tabs.
- Open and close its own flyout.
- Apply a filter and/or sort on Explore.
- Toggle the `darkMode` preference on Profile (after confirmation).
- Show a native alert.
- Export the in-memory activity log to a file on the device via the custom `FileModule`.

## What the agent cannot do

- Mutate app state outside the router. Every side effect goes through `src/agent/router.ts#dispatch`; anything else is a bug and is grep-able.
- Take state-changing actions without confirmation. `setPreference` and `exportAuditLog` must surface a `ProposedActionCard` first.
- Call a network or an LLM. The parser (`src/agent/parser.ts`) is deterministic keyword/regex matching — swap it if needed, but do not add latency to the 5-minute run gate.
- Touch files outside app-private storage. `FileModule` resolves paths under `FileManager.documentDirectory` on iOS and `context.filesDir` on Android — never external storage.

## Command contract

| Command | Payload | Confirm? | Notes |
|---|---|---|---|
| `navigate` | `{ screen: 'home' \| 'explore' \| 'profile' }` | no | reversible view change |
| `openFlyout` | `{ prefilledPrompt? }` | no | UI affordance |
| `closeFlyout` | `{}` | no | UI affordance |
| `applyExploreFilter` | `{ filter: string, sort?: 'asc' \| 'desc' }` | no | reversible view state |
| `setPreference` | `{ key: 'darkMode', value: boolean }` | **yes** | persists, user-visible — brief-mandated |
| `showAlert` | `{ title, message }` | no | informational |
| `exportAuditLog` | `{}` | **yes** | writes a file to device storage |

Zod schemas live in `src/agent/schemas.ts`; the `Command` union and `ActivityEntry` in `src/agent/types.ts`. Anything off-allowlist is rejected with reason `not-in-allowlist`. Anything with a malformed payload is rejected with reason `schema-fail`. Both are logged.

## Confirmation policy

- The brief requires confirmation on `setPreference`.
- `exportAuditLog` is added to the confirmation set because it writes a file to the device — app-private or not, a user should opt in.
- Flow: `dispatch(cmd)` → router returns `pending` and writes a `pending` entry → `pendingCommand` is parked on Zustand → `ProposedActionCard` renders Confirm/Cancel → `confirmPendingCommand()` executes and logs `executed`; `cancelPendingCommand()` logs `cancelled` with reason `user-cancelled`.

## Golden paths

**1. Navigate (no confirmation)**

> User: `go to explore`
> `parser.parseInput` → `{ type: 'navigate', payload: { screen: 'explore' } }`
> `router.dispatch` → allowlist ✓ → zod ✓ → not gated → `expo-router.navigate('/(tabs)/explore')` → log `executed`.

**2. Gated preference change**

> User: `dark mode`
> `parser.parseInput` → `{ type: 'setPreference', payload: { key: 'darkMode', value: true } }`
> `router.dispatch` → allowlist ✓ → zod ✓ → **needs confirm** → `pendingCommand` set, log `pending` → `ProposedActionCard` appears → user taps Confirm → `confirmPendingCommand()` → store updates, log `executed`.
> Alternate: user taps Cancel → `cancelPendingCommand()` → log `cancelled`, preference unchanged.

**3. Export + native write**

> User: `export the audit log`
> `router.dispatch` → gated → log `pending` → `ProposedActionCard` → user Confirms.
> Router serializes `useAppStore.getState().activityLog` to JSON → `FileModule.writeLog(json, 'audit-<ts>.json')` → iOS writes under `Documents/`, Android under `filesDir/` → router fires `Alert.alert('Audit log exported', path)` → log `executed`.
