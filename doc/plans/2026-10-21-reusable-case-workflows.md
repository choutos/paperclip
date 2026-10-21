# Minimal reusable workflows

Implement the approved name-and-prompt workflow model on branch
`codex/reusable-case-workflows`, under `experimental.enableCases`.
Workflow definitions own reusable text; cases retain one primary task and use
its revisioned `workflow` document. Handoffs own explicit adoption/refresh/detach,
captured prompts, and transition history. No interpreter or new execution service.

Acceptance: reuse across cases; same-task A → B → A; shared edits do not change
case copies; retries/restarts do not duplicate revisions; cancelled pending
adoptions and document conflicts preserve instructions; old inline cases,
authorization, and flag behavior remain compatible. Verify through real database,
native tools, existing case UI, and a bounded configured-provider journey.

Endpoint: one reviewable PR with required checks. No merge or deployment requested.
Deferred: workflow authoring UI, deletion/archive, import/export, role binding,
graph validation, and Spec Kit integration.

Status: implementation complete; final verification and PR preparation in progress.

Implementation: schema/migration, definition REST service and optional native
tools, transactional adoption with private prompt snapshots, bounded reads,
case context, Work/history/Audit presentation, contracts, docs and maps are in
place. The arithmetic Product E2E journey now measures A → B → A and observed
workflow-document reads; inline receipt coverage remains.

Verification so far: real-database handoff tests, authenticated native-tool/API
contract tests, 37 case/Audit UI tests, and arithmetic oracle calibration pass.
Repository-wide typecheck and build pass. The full test suite is in progress.
Token gates, migration checks, module boundaries and map structure checks pass. Earlier failed attempts
were an incorrect assertion about conflict wording, missing fresh-worktree
build dependencies, outdated API-schema assertions and generated inventories;
these are retained in temporary logs and corrected before reruns.

Live evidence: the subscription attempt reached kickoff and browser readback,
then the first provider run failed with HTTP 429 (`responseTooManyFailedAttempts`).
That failure is retained separately. An explicitly authorized API-key attempt
uses the same arithmetic procedure, oracle and single-attempt run limits in a
fresh isolated campaign. Both arithmetic credential modes are now selectable.
The first API attempt completed four successful provider runs, A → B → A, and
normal terminal case completion. Its old four-handoff oracle kept waiting for
exactly four rows despite the valid fifth terminal row. The attempt was stopped
with normal launcher cleanup and remains failed. The fixture now explicitly
requires the terminal intent and its retained procedure revision; positive and
negative oracle tests pass. A fresh single-attempt campaign verifies that fix.
The terminal-aware API attempt passed all nine durable workflow checks and the
case Work/history browser assertions. Its final chat-marker assertion failed:
the existing presentation policy chooses the explicit terminal handoff comment
over the later completion summary. The fixture now puts the marker in that
authoritative visible comment and retains the earlier failure separately.

Runner contract checks exposed strict JSON-schema branches and an omitted
public semantic catalog registration for the four tools. Both are corrected;
all 144 affected catalog/discovery tests and 27 prompt/coverage tests pass.
Generated projections were refreshed from a fresh TypeScript build. The
repository-wide suite and final bounded live campaign remain in progress.
