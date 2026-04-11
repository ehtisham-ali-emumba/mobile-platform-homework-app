# Take-Home Approach — Mobile Platform Lead (Permission.io)

> Personal playbook. Not a deliverable. Not for the repo.
> Timebox: **6 hours, today.**

---

## 1. Decoding the brief (what they're *really* asking)

The surface ask is "build an agent chat app." The actual evaluation targets:

| Signal they're grading | Where it shows up | My read |
|---|---|---|
| **Command safety & auditability** | Command Router section + reject triggers | This is the *product*. The chat is the wrapper. |
| **Native module competence** | Ban on `expo-file-system` / `react-native-fs` | They want to see you can cross the RN bridge on purpose, not as a library consumer. |
| **Lead-level judgment & voice** | "≤500 words", "no AI slop" stated 3× | They have read 50 AI-generated READMEs this week. Terse, opinionated, app-specific is the only way through. |
| **Can you actually ship** | 5-min run gate | If `pnpm install && pnpm ios` doesn't work first try, you're rejected before they read a word. |

Three **reject triggers** worth re-reading:
- *"The agent is a thin chat UI with no command validation/auditability"* → router must be real.
- *"State changes happen without explicit confirmation rules"* → confirmation is a hard gate, not a nice-to-have.
- *"Native module is copy-pasted without explanation or real use"* → must actually be exercised by the export flow.

---

## 2. Stack decisions (opinionated, with rejected alternatives)

### Framework: **Expo (prebuild) + Expo Modules API**
- **Why:** fastest path to a working iOS + Android build that also lets me write custom Swift/Kotlin. `npx create-expo-module` generates both native sides with TS typing already wired.
- **Rejected: bare RN CLI.** More boilerplate for Android build config, slower first-run. I'd pick it if the task required deep Metro/Hermes config, which it doesn't.
- **Rejected: Expo managed (no prebuild).** Blocks the native module requirement entirely.
- **Watch-out:** Expo Modules ≠ `expo-file-system`. Writing my own `AuditLogExporter` module is explicitly allowed and is in fact what they're asking for.

### State: **Zustand**
- Tiny, no provider tree, persists via middleware. Store holds `preferences`, `activityLog`, `flyoutState`, `exploreFilter`. ~40 lines.
- **Rejected: Redux Toolkit.** Boilerplate cost is unjustified for 3 screens.
- **Rejected: React Context.** Gets ugly once the agent needs to read + dispatch across screens.

### Navigation: **React Navigation (bottom tabs + native stack)**
- Bottom tabs for Home/Explore/Profile; stack for any modals. Standard.
- Bottom-sheet flyout lives **outside** the navigator so it survives tab switches (that's what "anchored" means in the brief).

### Bottom sheet: **@gorhom/bottom-sheet**
- Only serious option. Native-feel snap points, keyboard handling solved.

### Agent "intelligence": **deterministic intent parser, not an LLM call**
- **Why:** (a) no secrets in the repo, (b) graders run the app locally — a flaky network call is a failure mode I don't need, (c) the grade is on the *router*, not on model quality. A rule-based parser with regex + keyword matching + slot extraction returns a `Command` object that flows through the same validation pipeline an LLM would use. Swappable later.
- **Rejected: live Anthropic/OpenAI call.** Adds env var setup to the 5-min run gate. Only worth it if I finish early and gate it behind `EXPO_PUBLIC_AGENT_MODE=llm`.
- **Framing in README:** "The parser is swappable. The router is the contract. Replacing the parser with a function-calling LLM is a one-file change — I've marked the seam at `agent/parser.ts`." This turns a shortcut into a lead-level decision.

### Persistence: **AsyncStorage via Zustand `persist` middleware**
- Already in every RN project. Good enough for prefs + activity log.
- Export to disk uses the native module (that's the point of the native module).

### Validation: **Zod**
- Command schemas live next to the router. Zod is the cheapest way to get runtime validation + TS types from one source.

### Styling: **StyleSheet + a 10-token design file** (`theme.ts`)
- NativeWind is nicer but adds a Metro config tweak I don't want to debug under time pressure.

---

## 3. Architecture (the one diagram that matters)

```
┌──────────────────────────────────────────────────────────┐
│  Screens: Home  │  Explore  │  Profile                    │
│                                                           │
│  ┌─────────────────── AgentFlyout ───────────────────┐   │
│  │  ChatTranscript │ ProposedActionCard │ Composer   │   │
│  └─────────────────────────┬──────────────────────────┘  │
└────────────────────────────┼─────────────────────────────┘
                             │ user text
                             ▼
                   ┌──────────────────┐
                   │ agent/parser.ts  │  (NL → Command)
                   └────────┬─────────┘
                            ▼
                   ┌──────────────────┐
                   │ agent/router.ts  │   ← THE STAR
                   │  1. allowlist    │
                   │  2. zod validate │
                   │  3. needsConfirm?│─── yes ──▶ ProposedActionCard
                   │  4. execute      │                │
                   │  5. log          │ ◀─ user confirms ┘
                   └────────┬─────────┘
                            ▼
              ┌─────────────┴──────────────┐
              ▼                            ▼
     zustand store (UI state)     activityLog (append-only)
                                            │
                                            ▼
                              Native module: AuditLogExporter
                              (Swift FileManager / Kotlin File)
                              → <Documents>/audit-<ts>.json
```

**The rule I will not break:** every UI mutation goes through `router.dispatch(command)`. The agent flyout never imports `useNavigation` or `setPreference` directly. Grep-able invariant — I'll add a lint rule if time permits, otherwise call it out in the README.

---

## 4. Command contract (draft — will live in `agent/CONTEXT.md`)

```ts
type Command =
  | { type: 'navigate';           payload: { screen: 'home'|'explore'|'profile' } }
  | { type: 'openFlyout';         payload: { prompt?: string } }
  | { type: 'closeFlyout';        payload: {} }
  | { type: 'applyExploreFilter'; payload: { filter: string; sort?: 'asc'|'desc' } }
  | { type: 'setPreference';      payload: { key: string; value: boolean|string } }
  | { type: 'showAlert';          payload: { title: string; message: string } }
  | { type: 'exportAuditLog';     payload: {} };
```

**Confirmation policy (documented):**
| Command | Confirm? | Why |
|---|---|---|
| `navigate` | no | reversible, no data change |
| `openFlyout` / `closeFlyout` | no | UI affordance |
| `applyExploreFilter` | no | reversible view state |
| `showAlert` | no | informational |
| `setPreference` | **yes** | persists, user-visible setting |
| `exportAuditLog` | **yes** | writes to disk, side-effect on device |

Brief only mandates confirmation on `setPreference`. I'm adding `exportAuditLog` because it touches the filesystem — that's a lead-level call I'll justify in one line in `decisions.md`.

**Activity log entry shape:**
```ts
{ id, ts, command, status: 'executed'|'rejected'|'pending'|'confirmed', reason? }
```

---

## 5. Native module design

Module name: `AuditLogExporter`. Single exported function:
```ts
AuditLogExporter.writeLog(contents: string, filename: string): Promise<string>
// resolves with absolute path
```

### iOS (Swift)
```swift
// Expo module — not a third-party lib
let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
let url = dir.appendingPathComponent(filename)
try contents.write(to: url, atomically: true, encoding: .utf8)
return url.path
```

### Android (Kotlin)
```kotlin
val dir = context.filesDir            // app-private Documents
val file = File(dir, filename)
file.writeText(contents, Charsets.UTF_8)
return file.absolutePath
```

**Why this is the right demo of the native module requirement:**
- Uses `FileManager` / `File` — the *platform* APIs, no RN/Expo wrapper.
- Exercised by a real user flow (Profile → Export button → log flows through router → native write → path shown in alert via `showAlert` command).
- Same interface on both platforms; the TS consumer doesn't branch.

**What I will call out in the README** (because "copy-pasted native module" is a reject trigger): why I picked `.documentDirectory` vs `.cachesDirectory` on iOS, why `filesDir` vs `getExternalFilesDir` on Android (both: app-private, survives reinstall on iOS but not Android — acceptable tradeoff for an audit log whose source of truth is still the in-app store).

---

## 6. Six-hour execution plan

I track this as a checklist and don't let any cell go over its budget. **If I'm behind at 4h, I cut the web portal and polish, not the router.**

| Time | Block | Output | Guardrail |
|---|---|---|---|
| 0:00–0:30 | **Scaffold** | `npx create-expo-app`, `expo prebuild`, RN Navigation + 3 empty screens, Zustand store, theme tokens. Both platforms boot. | iOS + Android must both run before I move on. This is the gate for everything. |
| 0:30–1:15 | **Native module** | `npx create-expo-module --local AuditLogExporter`. Swift + Kotlin `writeLog`. TS wrapper. Test-call from a debug button. | Do this *early* — native build issues are the #1 timebox killer. |
| 1:15–2:30 | **Command router** | `agent/router.ts`, Zod schemas for all 6 commands, allowlist, confirmation gate, activity log append. Unit test: invalid command → rejected + logged. | This is the star. Don't skimp. |
| 2:30–3:30 | **Agent flyout + parser** | `@gorhom/bottom-sheet`, chat transcript, composer, ProposedActionCard, deterministic intent parser with 6–8 phrase patterns per command. | Parser stays dumb on purpose. Patterns, not NLP. |
| 3:30–4:15 | **Wire all 6 commands** | navigate, open/close flyout, applyExploreFilter, setPreference (with confirm), showAlert, exportAuditLog (with confirm → native module). Profile shows activity log. | End of this block = happy path works end-to-end. |
| 4:15–4:45 | **Test + polish** | The one required test (router rejects an off-allowlist command and logs the rejection). Visual polish pass on flyout + cards. | No new features after this. |
| 4:45–5:15 | **Artifacts** | `agent/CONTEXT.md`, `artifacts/decisions.md`, `artifacts/architecture.md` (mermaid). | Written by me. Claude can lint for word count, not draft. |
| 5:15–5:45 | **Demo videos** | iOS + Android, 30–60s each. Script from Section 8. | QuickTime screen record → trim → commit to repo. |
| 5:45–6:00 | **README + submit** | Setup commands verified on a clean clone, word count check, checklist ticked, push. | Clean-clone run-through is non-negotiable. |

**Stretch only if I hit 4:15 green:** one-file web portal (`portal/index.html`) with 3 deep-link buttons + a linking config in the app. If not, I write the "how I would build it" paragraph in the README and move on.

---

## 7. How I'll use Claude Code (without triggering the AI-slop filter)

The brief is aggressive about AI usage: allowed, expected, and ruthlessly filtered. My rule:

> **Claude writes the code I already know how to write.** **I write every word a human will read.**

**Claude Code, yes for:**
- Scaffolding Expo project + Expo module boilerplate
- Zod schemas from the `Command` union
- React Navigation wiring
- Styling passes, list/card components
- Swift + Kotlin `writeLog` (I'll review every line — this is the one the reviewer will read closely)
- Mermaid architecture diagram
- The one e2e test
- A word-count check + a "does this sound generic?" review pass on my README

**Claude Code, no for:**
- README prose, `decisions.md`, `CONTEXT.md` — these are the "voice" deliverables.
- The command router logic decisions (allowlist shape, confirmation rules, log schema). I decide; Claude types.
- The demo script narration.

**AI disclosure section I will actually write** (draft so I don't forget):
> **Tools:** Claude Code (Sonnet 4.6) for scaffolding + native module code review. **Workflow:** I designed the command router contract and confirmation policy on paper first, then used Claude to generate the TS/Swift/Kotlin from my spec. I wrote all prose (README, decisions, CONTEXT) myself — Claude only ran word-count checks. **Mine:** architecture, router semantics, confirmation policy, stack decisions, all written content.

That paragraph is specific, honest, and unfakeable — exactly what they're looking for.

---

## 8. Demo script (5–8 bullets — reuse for both iOS and Android)

1. Cold start → Home. Flyout handle visible anchored at bottom.
2. Tap handle → flyout expands → type *"what can you do?"* → agent lists its 6 commands grounded in this app.
3. Type *"show me explore sorted by newest"* → agent proposes `applyExploreFilter` → executes → Explore tab opens filtered.
4. Type *"turn on dark mode"* → **ProposedActionCard** appears → tap Confirm → Profile toggle flips.
5. Type *"cancel that"* on a second setPreference proposal → rejected path logged.
6. Navigate to Profile → scroll to Activity Log → executed + rejected entries visible with timestamps.
7. Tap **Export** → confirm → native module writes file → alert shows absolute path on device.
8. (iOS only) Show path in Files app / (Android) `adb shell run-as` the file to prove it's real.

---

## 9. Pre-submission checklist (mine, not theirs)

- [ ] `rm -rf node_modules ios/Pods && pnpm install && pnpm ios` works on a clean clone
- [ ] Same for Android
- [ ] Grep for `useNavigation(` in agent code — must return zero hits
- [ ] Grep for `expo-file-system` / `react-native-fs` — must return zero hits
- [ ] README word count ≤ 500 (excluding code blocks + checklist)
- [ ] `decisions.md` word count ≤ 400
- [ ] Both demo videos committed under `artifacts/`
- [ ] `agent/CONTEXT.md` command contract matches `agent/router.ts` allowlist exactly
- [ ] Repo renamed `mobile-platform-homework-ehtisham-emumba` (or whatever matches my legal name on the submission), default branch `main`
- [ ] AI disclosure section present and specific
- [ ] One test runs green; README has 2–4 sentences describing what it proves

---

## 10. Risk register (what kills me under time pressure)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Native module build fails on one platform | high | Do it in block 2, not block 5. Smoke-test with a debug button. |
| Bottom sheet + keyboard layout jank | medium | Use `@gorhom/bottom-sheet`'s built-in `KeyboardAvoidingView`. Don't reinvent. |
| Intent parser looks dumb in the demo | medium | Script the demo around phrases the parser *definitely* handles. Document the limitation honestly in decisions.md. |
| README reads generic | high | Write it last. Read it aloud. Every sentence must reference a file path or a specific decision. |
| 5-min run gate fails for grader | **critical** | Clean-clone dry run before pushing. Non-negotiable. |

---

## 11. What I will *not* build (and will say so)

Explicitly out of scope, called out in `Next steps`:
- Live LLM integration (parser is swappable — seam at `agent/parser.ts`)
- Web portal + deep links (unless I'm ahead at 4:15)
- Encrypted log at rest
- Remote command allowlist (feature flag to enable/disable commands without app update)
- Agent multi-turn memory beyond last N messages

Naming these things is half of what "lead-level" means here — showing I know what good looks like and chose to cut it on purpose.

---

**Start the clock when `pnpm ios` shows a blank screen with the tab bar. Everything before that is setup, not the 6 hours.**
