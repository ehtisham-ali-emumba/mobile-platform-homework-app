# Execution Playbook — Tactical Steps

> Companion to `APPROACH.md`. That file is the *why*. This file is the *what to type*.
> Work top-to-bottom. Don't skip the "done when" gate on any phase.

---

## 0. Problem breakdown (so I don't lose the plot)

The brief boils down to **seven hard requirements** and one stretch. Every phase below maps to at least one of these:

| # | Requirement | Where it lives in the build |
|---|---|---|
| R1 | 3 screens: Home / Explore (filter) / Profile (toggle) | Phase 3 |
| R2 | Anchored agent flyout (bottom sheet, persists across tabs) | Phase 5 |
| R3 | Command Router: allowlist + zod + confirmation + audit log | Phase 4 |
| R4 | 6 commands wired end-to-end | Phase 6 |
| R5 | Custom native module (Swift + Kotlin) for filesystem write | Phase 2 |
| R6 | `agent/CONTEXT.md` + `artifacts/` + demo videos | Phase 8 |
| R7 | One meaningful e2e test | Phase 7 |
| S1 | (Stretch) Web portal + deep links | Only if ahead at 4:15 |

**Reject triggers to re-read before every phase:** thin chat UI with no validation, state changes without confirmation, native module copy-pasted without real use, README that reads generic.

---

## 1. Prerequisites (verify BEFORE starting the 6h clock)

Run these in a throwaway terminal. If any fail, fix before starting the timer.

```bash
node -v                # >= 20
pnpm -v                # >= 9  (if missing: npm i -g pnpm)
xcodebuild -version    # Xcode installed + CLI tools
xcrun simctl list devices | grep Booted   # or have a sim ready to boot
java -version          # JDK 17 for RN 0.74+
# Android Studio installed, ANDROID_HOME set, at least one AVD created
echo $ANDROID_HOME
adb devices            # emulator or device visible
watchman -v            # optional but recommended
```

**iOS:** first `pod install` of the project is the slowest step of the whole day. Budget 5–10 min in Phase 1.
**Android:** first Gradle build is 5–15 min. Same warning.

Start the 6h timer only after the blank app boots on both platforms (end of Phase 1).

---

## 2. Phase 1 — Scaffold (0:00–0:30)

**Goal:** empty Expo + TypeScript app, prebuilt for iOS and Android, both booting to a blank screen.

```bash
cd /Users/ehtishamemumba/Documents/assignments/react-native-lead-task

# Scaffold — use the blank TS template, not tabs (we want our own nav)
pnpm create expo-app@latest mobile-platform-homework-ehtisham-emumba -t blank-typescript
cd mobile-platform-homework-ehtisham-emumba

# Set bundle id / package NOW (painful to change after prebuild)
# Edit app.json: ios.bundleIdentifier = "io.permission.homework"
#                android.package       = "io.permission.homework"

# Generate native projects
pnpm expo prebuild --clean

# First runs — these are the slow ones
pnpm expo run:ios
pnpm expo run:android
```

**Done when:** both simulators show the default "Open up App.tsx" screen. Commit: `chore: scaffold expo app with prebuild`.

**Gotchas:**
- If iOS pod install hangs: `cd ios && pod install --repo-update && cd ..`
- If Android Gradle fails on JDK: `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`
- pnpm + Expo sometimes needs `.npmrc` with `node-linker=hoisted`. Add it if you hit "cannot find module" on native build.

---

## 3. Phase 2 — Native module (0:30–1:15)

**Do this second, not last.** Native build failures are the #1 timebox killer.

```bash
# From project root
pnpm create expo-module@latest --local AuditLogExporter

# This generates:
#   modules/audit-log-exporter/
#     ios/AuditLogExporterModule.swift
#     android/src/main/java/.../AuditLogExporterModule.kt
#     src/index.ts
#     src/AuditLogExporter.types.ts
#     expo-module.config.json
```

**Edit `modules/audit-log-exporter/ios/AuditLogExporterModule.swift`:**

```swift
import ExpoModulesCore
import Foundation

public class AuditLogExporterModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AuditLogExporter")

    AsyncFunction("writeLog") { (contents: String, filename: String) -> String in
      let dir = FileManager.default.urls(
        for: .documentDirectory, in: .userDomainMask
      ).first!
      let url = dir.appendingPathComponent(filename)
      try contents.write(to: url, atomically: true, encoding: .utf8)
      return url.path
    }
  }
}
```

**Edit `modules/audit-log-exporter/android/src/main/java/expo/modules/auditlogexporter/AuditLogExporterModule.kt`:**

```kotlin
package expo.modules.auditlogexporter

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class AuditLogExporterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AuditLogExporter")

    AsyncFunction("writeLog") { contents: String, filename: String ->
      val ctx = appContext.reactContext
        ?: throw Exception("No React context")
      val file = File(ctx.filesDir, filename)
      file.writeText(contents, Charsets.UTF_8)
      file.absolutePath
    }
  }
}
```

**Edit `modules/audit-log-exporter/src/index.ts`:**

```ts
import AuditLogExporterModule from './AuditLogExporterModule';

export async function writeLog(contents: string, filename: string): Promise<string> {
  return await AuditLogExporterModule.writeLog(contents, filename);
}
```

**Rebuild both platforms to link the module:**

```bash
pnpm expo run:ios
pnpm expo run:android
```

**Smoke-test immediately.** Drop a temporary debug button in `App.tsx`:

```tsx
import { Button, Alert } from 'react-native';
import { writeLog } from './modules/audit-log-exporter';

<Button title="Test native write" onPress={async () => {
  const path = await writeLog('hello world', 'smoke.txt');
  Alert.alert('wrote file', path);
}} />
```

**Done when:** tapping the button on both iOS and Android shows an alert with an absolute path. Commit: `feat: native AuditLogExporter module (iOS + Android)`.

---

## 4. Phase 3 — Libraries, store, screens, navigation (1:15–2:00, overlaps with Phase 4)

**Install everything in one go:**

```bash
# Navigation — use expo install so versions match the SDK
pnpm expo install @react-navigation/native \
  @react-navigation/bottom-tabs \
  @react-navigation/native-stack \
  react-native-screens \
  react-native-safe-area-context

# Bottom sheet + its peer deps
pnpm expo install @gorhom/bottom-sheet \
  react-native-reanimated \
  react-native-gesture-handler

# State + persistence
pnpm add zustand
pnpm expo install @react-native-async-storage/async-storage

# Validation
pnpm add zod

# Rebuild once — reanimated + gesture-handler need native linking
pnpm expo run:ios
pnpm expo run:android
```

**Wire reanimated** — first line of `babel.config.js` plugins array: `'react-native-reanimated/plugin'` (must be last in the plugins list, actually). Check the reanimated docs if you hit "Reanimated 2 failed to create a worklet".

**Create this structure:**

```
src/
  screens/
    HomeScreen.tsx
    ExploreScreen.tsx       # filter + sort pills
    ProfileScreen.tsx       # dark mode toggle + activity log list + Export button
  navigation/
    RootNavigator.tsx       # BottomTabs wrapped in NavigationContainer
  store/
    useAppStore.ts          # zustand + persist middleware
  theme.ts                  # 10 tokens: colors, spacing, radius
App.tsx                     # GestureHandlerRootView > NavigationContainer > Nav + <AgentFlyout/>
```

**Zustand store shape (minimum):**

```ts
type State = {
  preferences: { darkMode: boolean };
  activityLog: ActivityEntry[];
  flyoutState: { open: boolean; prefilledPrompt?: string };
  exploreFilter: { filter: string; sort: 'asc' | 'desc' };
  // setters below...
};
```

**Done when:** bottom tabs navigate between 3 screens; Explore has a dummy filter pill row; Profile has a dark-mode switch; store persists across app reload. Commit: `feat: 3 screens + zustand store + navigation`.

---

## 5. Phase 4 — Command Router (2:00–2:45) — THE STAR

Create `src/agent/` as the isolated module. The router is the contract everything flows through.

```
src/agent/
  types.ts          # Command union, ActivityEntry
  schemas.ts        # zod schemas, one per command
  router.ts         # dispatch(command) -> allowlist → validate → confirm? → execute → log
  parser.ts         # NL string → Command (deterministic, regex-based)
  CONTEXT.md        # the required context file
```

**`router.ts` pseudocode (keep it this tight):**

```ts
export async function dispatch(cmd: Command): Promise<Result> {
  // 1. allowlist
  if (!ALLOWED_TYPES.has(cmd.type)) return logReject(cmd, 'not-in-allowlist');
  // 2. validate
  const parsed = SCHEMAS[cmd.type].safeParse(cmd.payload);
  if (!parsed.success) return logReject(cmd, 'schema-fail', parsed.error);
  // 3. confirmation gate
  if (NEEDS_CONFIRM.has(cmd.type)) {
    return logPending(cmd);  // UI surfaces ProposedActionCard; confirmCommand() resumes
  }
  // 4. execute + 5. log
  return executeAndLog(cmd);
}
```

**Invariant to enforce manually (grep before commit):** no file under `src/agent/` may import `useNavigation`, `useAppStore.setState`, or any store setter directly. The router owns all side effects. The agent emits intents.

**Done when:** I can call `dispatch({ type: 'navigate', payload: { screen: 'explore' } })` from a debug button and the Explore tab opens; calling `dispatch({ type: 'nope' } as any)` appends a rejected entry to the activity log. Commit: `feat: command router with allowlist + zod + audit log`.

---

## 6. Phase 5 — Agent flyout + parser (2:45–3:30)

**Components:**

```
src/agent/ui/
  AgentFlyout.tsx          # @gorhom/bottom-sheet, snap points [12%, 50%, 90%]
  ChatTranscript.tsx       # FlatList of messages
  Composer.tsx             # TextInput + send
  ProposedActionCard.tsx   # shows pending command, Confirm/Cancel buttons
```

**Mount `<AgentFlyout />` in `App.tsx` OUTSIDE the `NavigationContainer`'s screen tree** so it survives tab switches — that's what "anchored" means in the brief.

**Parser rules (dumb on purpose):**

```ts
// parser.ts — keyword + regex, ~6-8 patterns per command
// e.g. /go to (home|explore|profile)/i            → navigate
//      /(dark|light) mode/i                       → setPreference
//      /export (the )?(audit )?log/i              → exportAuditLog
//      /sort .* (newest|oldest|asc|desc)/i        → applyExploreFilter
// Default: respond with help text listing the 6 commands.
```

The parser returns `{ command, confidence, needsConfirm }`. Script the demo around phrases you *know* it handles.

**Done when:** typing "go to explore" in the flyout navigates to Explore; typing "turn on dark mode" surfaces a ProposedActionCard; confirming it flips the Profile toggle. Commit: `feat: agent flyout + deterministic intent parser`.

---

## 7. Phase 6 — Wire all 6 commands (3:30–4:15)

Go down the list and prove each one works from the flyout:

- [ ] `navigate(screen)` — uses `navigationRef.current?.navigate(...)` (set a ref on NavigationContainer)
- [ ] `openFlyout()` / `closeFlyout()` — `store.setFlyoutState({ open })`; bottom-sheet ref snaps to index
- [ ] `applyExploreFilter(filter, sort?)` — updates `store.exploreFilter`; Explore screen reads it
- [ ] `setPreference(key, value)` — **confirm required**, then updates `store.preferences`
- [ ] `showAlert(title, message)` — `Alert.alert(title, message)`
- [ ] `exportAuditLog()` — **confirm required**, serializes `store.activityLog`, calls `AuditLogExporter.writeLog(json, 'audit-<ts>.json')`, then dispatches a `showAlert` with the returned path

**Profile screen** shows the activity log as a list: timestamp, command type, status (executed/rejected/pending), reason if any. This is a review-gate item.

**Done when:** the full demo script (Section 8 of APPROACH.md) runs end-to-end on iOS, no crashes. Commit: `feat: wire all 6 commands through router`.

---

## 8. Phase 7 — Test + polish (4:15–4:45)

**The one required test** — router rejects an off-allowlist command and logs the rejection:

```bash
pnpm add -D jest @types/jest jest-expo @testing-library/react-native
# package.json: "test": "jest", "jest": { "preset": "jest-expo" }
```

```ts
// src/agent/__tests__/router.test.ts
test('router rejects off-allowlist command and logs rejection', async () => {
  const result = await dispatch({ type: 'deleteDatabase' } as any);
  expect(result.status).toBe('rejected');
  expect(result.reason).toBe('not-in-allowlist');
  const log = useAppStore.getState().activityLog;
  expect(log.at(-1)?.status).toBe('rejected');
});
```

```bash
pnpm test
```

**Polish pass (no new features):** flyout spacing, card shadows, empty states on activity log, dark mode actually looks dark.

**Done when:** test is green; happy path feels tight. Commit: `test: router rejects + logs off-allowlist commands`.

---

## 9. Phase 8 — Artifacts, demo, submit (4:45–6:00)

**Files to create (all written by me, not Claude):**

```
agent/CONTEXT.md             # moved/symlinked from src/agent/CONTEXT.md so it's at the required path
artifacts/
  decisions.md               # ≤400 words, 5 decisions
  architecture.md            # mermaid diagram + component map
  demo-ios.mp4               # 30-60s, script from APPROACH.md §8
  demo-android.mp4
README.md                    # ≤500 words excluding code blocks + checklist
```

**Record the demo videos:**

```bash
# iOS — QuickTime: File → New Movie Recording → camera dropdown → Simulator
# or command line:
xcrun simctl io booted recordVideo artifacts/demo-ios.mov
# ^C to stop. Then:
ffmpeg -i artifacts/demo-ios.mov -vcodec h264 -acodec aac artifacts/demo-ios.mp4

# Android
adb shell screenrecord /sdcard/demo.mp4   # ^C to stop
adb pull /sdcard/demo.mp4 artifacts/demo-android.mp4
```

**README word count check:**

```bash
# excludes fenced code blocks and checklist lines
awk '/^```/{f=!f;next} !f && !/^- \[/' README.md | wc -w
```

**Clean-clone dry run (non-negotiable):**

```bash
cd /tmp
git clone <repo-url> test-clone
cd test-clone
pnpm install
pnpm expo run:ios     # must work first try
pnpm expo run:android # must work first try
```

If this fails on a clean clone, the grader will reject. Fix whatever's missing in README setup commands and re-run.

**Push and submit:**

```bash
git remote add origin <github-url>
git branch -M main
git push -u origin main
```

---

## 10. Commands cheat sheet (everything in one block)

```bash
# Scaffold
pnpm create expo-app@latest mobile-platform-homework-ehtisham-emumba -t blank-typescript
cd mobile-platform-homework-ehtisham-emumba
pnpm expo prebuild --clean

# Libraries (one shot)
pnpm expo install @react-navigation/native @react-navigation/bottom-tabs \
  @react-navigation/native-stack react-native-screens react-native-safe-area-context \
  @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler \
  @react-native-async-storage/async-storage
pnpm add zustand zod
pnpm add -D jest @types/jest jest-expo @testing-library/react-native

# Native module
pnpm create expo-module@latest --local AuditLogExporter

# Run
pnpm expo run:ios
pnpm expo run:android

# Test
pnpm test

# Demo capture
xcrun simctl io booted recordVideo artifacts/demo-ios.mov
adb shell screenrecord /sdcard/demo.mp4
```

---

## 11. Fail-fast gates (if any of these break, STOP and fix)

| Gate | When | What to do if broken |
|---|---|---|
| Both platforms boot blank app | End of Phase 1 | Fix pods / gradle before writing any feature code |
| Native module smoke test passes both platforms | End of Phase 2 | Debug Swift/Kotlin errors NOW, not at hour 5 |
| Router dispatches + logs from debug button | End of Phase 4 | Router is the grade — don't move on until it's solid |
| Happy path demo runs end-to-end | End of Phase 6 | If something's broken, cut stretch/polish, not router correctness |
| Clean-clone `pnpm install && pnpm expo run:ios` works | End of Phase 8 | Non-negotiable — this is the review gate |

---

**Remember:** the APPROACH.md risk register is the other half of this document. Re-read it at the start of each phase.
