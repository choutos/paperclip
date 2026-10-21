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
No complete live-provider result or PR readiness claimed yet.
