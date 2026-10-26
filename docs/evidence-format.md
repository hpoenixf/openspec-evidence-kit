# Evidence format

## Tasks

Use stable task labels: `- [ ] 1.1 Describe one cohesive workstream`. Mark completed work with `[x]`.

The default completed-task lifecycle is ordered `RED` then `GREEN`. Explicit task markers select other structural lifecycles: `[check-only]` requires `CHECK`; `[baseline-green]` requires `BASELINE` then `VERIFY`; `[tests-after]` requires `VERIFY` and documents that tests came later. Choosing a marker is the author's responsibility; it does not grant an exception to a consuming project's policy.

## Observation ledger

In `evidence.md`, write a `## Observation Log` section with eight columns in this order:

| Date / phase | Evidence ID | Task | Command | Actual result | Artifact | Revision | Origin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-01-01 CHECK | EV-01 | 1.1 | node test.mjs | passed: expected result | check.txt | example-revision | observed-run |

This row is a fictional format example. Actual records are written after the observation. Dates must be real calendar dates. Evidence IDs begin with `EV-`; multiple IDs may be separated by `/`, `,` or `;`. Escape table pipes as `\|`. Artifact paths are relative to `--root` and must identify a local file. Symlink paths are refused. Results begin with `failed:` for RED or `passed:` for the other supported phases.

Use `observed-run` only for an actual recorded execution. A historical import can use `reused-historical: <source>`; it remains visible in generated views and does not satisfy a newly completed task. Missing prerequisites and planned results remain explicit records; they do not count as successful task observations. Keep baselines, expected outcomes and unknowns in surrounding prose instead of inventing a measurement.

## Generated view

`verify.md` contains a generated marker and an input digest. Its text is deterministically derived from the task and ledger files. `verify --check` reports drift without rewriting anything. A handwritten file is outside the generator's ownership; the check reports it with `generated: false`, and generation preserves it.

## Recorded completion

An optional `completion.json` uses the following small portable record. It replaces application-specific runner wiring; the tool never creates a passing completion record for you.

```json
{
  "schemaVersion": "spec-evidence-completion@1",
  "changeName": "example",
  "outcome": "passed",
  "lane": "provider-free",
  "observedAt": "2026-01-01T00:00:00Z",
  "revision": "example-revision",
  "checks": [
    { "name": "offline tests", "status": "passed", "artifact": "check.txt" }
  ]
}
```

Lanes are `provider-free`, `diagnostic` and `formal`; none grants release authority. `status` inspects this authored record and completed task state, preserving the original metadata even after the project moves forward. It does not revalidate old artifacts, compare current source to old tests, authenticate execution or perform a new close. Any future acceptance decision remains with the consumer's existing owner and policy.
