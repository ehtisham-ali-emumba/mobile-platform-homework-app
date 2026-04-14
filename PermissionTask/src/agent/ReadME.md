# Agent Context (pointer)

Canonical file: [`../../agent/CONTEXT.md`](../../agent/CONTEXT.md) at the repo root.

This folder implements the contract described there:

- `types.ts` — `Command` union, `ActivityEntry`, `DispatchResult`
- `schemas.ts` — zod payload validation per command
- `router.ts` — allowlist, zod, confirmation gate, execute, log
- `parser.ts` — deterministic keyword → `Command` mapping
- `ui/` — flyout UI; never mutates state, only calls `dispatch` / confirm / cancel
