# Agent Context

This folder owns command routing and execution rules for the app assistant.

- `types.ts`: command union and activity log model
- `schemas.ts`: zod payload validation per command
- `router.ts`: allowlist, validate, confirmation gate, execute, and audit logging
- `parser.ts`: deterministic keyword parser for supported phrases

Safety constraints:

- Only allowlisted commands are accepted.
- Invalid payloads are rejected with `schema-fail`.
- Mutating commands (`setPreference`, `exportAuditLog`) require confirmation.
- Every command attempt is written into `activityLog` with status and optional reason.
