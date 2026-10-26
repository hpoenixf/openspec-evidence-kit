# OpenSpec Evidence Kit

Make completion claims easier to inspect: connect tasks to recorded checks, generate a provenance view, and preserve the original context of a recorded completion.

[中文使用说明](README.zh-CN.md) · [Evidence format](docs/evidence-format.md) · [MIT license](LICENSE)

Zero runtime dependencies. Requires Node **26.11.1–26.x**; tests and CI use the pinned **26.11.1**. Works with an ordinary local directory; OpenSpec is optional.

**Engineering walkthrough:** [Why a Spec Is Not a Completion Claim: the Evidence Kit](https://hpoenixf.github.io/eff-agent-article/en/articles/026-agent-spec-evidence-workflow) ([中文](https://hpoenixf.github.io/eff-agent-article/articles/026-agent-spec-evidence-workflow)). The article explains the original design and the portable CLI's scope; this README and the evidence-format reference define its usage.

## Try it offline

```sh
git clone https://github.com/hpoenixf/openspec-evidence-kit.git
cd openspec-evidence-kit
node bin/spec-evidence.mjs lint --root examples --changes-dir changes --change example --stage apply
node bin/spec-evidence.mjs verify --root examples --changes-dir changes --change example
node bin/spec-evidence.mjs verify --root examples --changes-dir changes --change example --check
node bin/spec-evidence.mjs status --root examples --changes-dir changes --change example
```

The example is fictional. Its observation and completion records illustrate the format; they are not this project's actual test results.

## Install into another project

```sh
npm install --save-dev github:hpoenixf/openspec-evidence-kit#v0.1.0
npx --no-install spec-evidence lint --change my-change --stage apply
npx --no-install spec-evidence verify --change my-change
```

No npm registry release is required. The default change location is `openspec/changes/<name>/`; use `--root` and `--changes-dir` for another layout.

## Commands

| Command | Result |
| --- | --- |
| `lint --stage plan` | Check task labels and duplicate IDs while work is still planned |
| `lint --stage apply` | Check ordered observations for completed tasks and local artifact existence |
| `lint --stage verify` | Also check incomplete tasks, the verification file and generated-view drift |
| `verify` | Generate or refresh a tool-owned `verify.md`; preserve handwritten conclusions |
| `verify --check` | Inspect the view without writing |
| `status` | Read task progress and an optional authored `completion.json` without rerunning anything |

Commands print JSON. Exit `0` means the requested structural operation passed; `1` reports a diagnostic or error. A status such as `tasks-incomplete` is progress information, not a release verdict.

## What the results mean

The tool checks authored records and local files. It does not authenticate that a command ran, grade an answer, establish test sufficiency, certify a release or call models. `observed-run` is an authored label. `recorded-complete` means an existing typed completion record was found with completed tasks; its original date and revision are preserved. Old temporary artifacts are not required for this read-only record inspection.

Checks are scoped to the selected change. Generated writes stay in that change and refuse symlink traversal or replacement of handwritten files. The CLI uses normal filesystem permissions; it is not a process sandbox.

## Optional OpenSpec schema

With OpenSpec installed in the target project, copy `schema/evidence-driven` to `openspec/schemas/evidence-driven`, then select `schema: evidence-driven` in that project's OpenSpec configuration. This compact schema connects proposal, specs, evidence, tasks and verification. The schema supplies writing guidance; use the CLI in local checks or CI for structural checks.

The schema is independently written. See [provenance and related projects](NOTICE.md) for OpenSpec and community influences.

## Contribute

Run `npm test`. Tests exercise actual CLI processes with synthetic files, including valid input, malformed/historical observations, stale views, handwritten output and path protection. Package locally with `npm pack --ignore-scripts`. Keep product-specific test runners and semantic approval policies in the consuming project.
