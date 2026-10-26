import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const bin = fileURLToPath(new URL('../bin/spec-evidence.mjs', import.meta.url));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'evidence-consumer-'));
  const change = join(root, 'openspec/changes/example');
  mkdirSync(change, { recursive: true });
  writeFileSync(join(root, 'check.txt'), 'Synthetic test artifact.\n');
  writeFileSync(join(change, 'tasks.md'), '- [x] 1.1 Implement the example\n');
  writeFileSync(join(change, 'evidence.md'), evidence());
  return { root, change, close: () => rmSync(root, { recursive: true, force: true }) };
}
function evidence(origin = 'observed-run') {
  return '## Observation Log\n\n| Date / phase | Evidence ID | Task | Command | Actual result | Artifact | Revision | Origin |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n'
    + `| 2026-01-01 RED | EV-01 | 1.1 | node test.mjs | failed: missing behavior | check.txt | example-revision | ${origin} |\n`
    + `| 2026-01-01 GREEN | EV-01 | 1.1 | node test.mjs | passed: expected behavior | check.txt | example-revision | ${origin} |\n`;
}
function cli(root, command, ...args) {
  const selection = args.includes('--change') ? [] : ['--change', 'example'];
  return spawnSync(process.execPath, [bin, command, '--root', root, ...selection, ...args], { encoding: 'utf8', timeout: 10000 });
}

test('scoped CLI accepts observed evidence and diagnoses historical, malformed and unfinished records', () => {
  const f = fixture();
  try {
    mkdirSync(join(f.root, 'openspec/changes/unrelated'));
    assert.equal(cli(f.root, 'lint', '--stage', 'apply').status, 0);
    writeFileSync(join(f.change, 'evidence.md'), evidence('reused-historical: another-ledger'));
    assert.equal(cli(f.root, 'lint', '--stage', 'apply').status, 1);
    writeFileSync(join(f.change, 'tasks.md'), '- [ ] 1.1 Implement the example\n');
    assert.equal(cli(f.root, 'lint', '--stage', 'plan').status, 0);
    assert.equal(cli(f.root, 'lint', '--stage', 'verify').status, 1);
    writeFileSync(join(f.change, 'tasks.md'), '- [x] 1.1 Implement the example\n');
    writeFileSync(join(f.change, 'evidence.md'), evidence().replace('EV-01', 'not-an-id'));
    assert.equal(cli(f.root, 'lint', '--stage', 'apply').status, 1);
  } finally { f.close(); }
});

test('generated view preserves provenance, detects drift and never overwrites a handwritten conclusion', () => {
  const f = fixture();
  try {
    assert.equal(cli(f.root, 'verify').status, 0);
    const target = join(f.change, 'verify.md');
    const original = readFileSync(target, 'utf8');
    assert.match(original, /example-revision/);
    assert.match(original, /semantic.*unverified/i);
    assert.equal(cli(f.root, 'verify', '--check').status, 0);
    writeFileSync(join(f.change, 'evidence.md'), evidence().replace('passed: expected behavior', 'passed: updated observation'));
    assert.equal(cli(f.root, 'verify', '--check').status, 1);
    assert.equal(readFileSync(target, 'utf8'), original);
    writeFileSync(target, '# Handwritten conclusion\nKeep this.\n');
    assert.equal(cli(f.root, 'verify').status, 1);
    assert.equal(readFileSync(target, 'utf8'), '# Handwritten conclusion\nKeep this.\n');
  } finally { f.close(); }
});

test('generated writes and source reads stay within the caller root', () => {
  const f = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'evidence-outside-'));
  try {
    assert.equal(cli(f.root, 'lint', '--stage', 'apply').status, 0);
    const target = join(outside, 'private.md');
    writeFileSync(target, 'private marker\n');
    symlinkSync(target, join(f.change, 'verify.md'));
    assert.equal(cli(f.root, 'verify').status, 1);
    assert.equal(readFileSync(target, 'utf8'), 'private marker\n');
    assert.notEqual(cli(f.root, 'lint', '--change', '../escape').status, 0);
    rmSync(join(f.change, 'verify.md'));
    rmSync(join(f.change, 'evidence.md'));
    symlinkSync(target, join(f.change, 'evidence.md'));
    const run = cli(f.root, 'verify');
    assert.notEqual(run.status, 0);
    assert.doesNotMatch(run.stdout + run.stderr, /private marker/);
  } finally { f.close(); rmSync(outside, { recursive: true, force: true }); }
});

test('status reuses an authored completion record without inventing fresh execution or release', () => {
  const f = fixture();
  try {
    writeFileSync(join(f.change, 'completion.json'), JSON.stringify({
      schemaVersion: 'spec-evidence-completion@1', changeName: 'example', outcome: 'passed', lane: 'provider-free',
      observedAt: '2026-01-01T00:00:00Z', revision: 'older-revision', checks: [{ name: 'offline tests', status: 'passed', artifact: 'check.txt' }]
    }));
    const run = cli(f.root, 'status');
    assert.equal(run.status, 0);
    const result = JSON.parse(run.stdout);
    assert.equal(result.completion, 'recorded-complete');
    assert.equal(result.record.revision, 'older-revision');
    assert.equal(result.rerun, false);
    assert.equal(result.release, 'not-claimed');
    writeFileSync(join(f.change, 'tasks.md'), '- [ ] 1.1 unfinished\n');
    assert.notEqual(JSON.parse(cli(f.root, 'status').stdout).completion, 'recorded-complete');
    writeFileSync(join(f.change, 'completion.json'), '{broken');
    assert.equal(cli(f.root, 'status').status, 1);
  } finally { f.close(); }
});

test('escaped table pipes remain part of an observation command', () => {
  const f = fixture();
  try {
    writeFileSync(join(f.change, 'evidence.md'), evidence().replaceAll('node test.mjs', 'node test.mjs \\| inspect'));
    assert.equal(cli(f.root, 'verify').status, 0);
    assert.match(readFileSync(join(f.change, 'verify.md'), 'utf8'), /inspect/);
  } finally { f.close(); }
});

test('a symlink alias cannot redirect a named change write into another change', () => {
  const f = fixture();
  try {
    assert.equal(cli(f.root, 'lint', '--stage', 'apply').status, 0);
    symlinkSync(f.change, join(f.root, 'openspec/changes/alias'));
    assert.equal(cli(f.root, 'verify', '--change', 'alias').status, 1);
  } finally { f.close(); }
});

test('malformed unchecked task rows cannot disappear from completion accounting', () => {
  const f = fixture();
  try {
    writeFileSync(join(f.change, 'tasks.md'), '- [x] 1.1 Valid checked task\n- [ ] 2.1\n');
    writeFileSync(join(f.change, 'completion.json'), JSON.stringify({
      schemaVersion: 'spec-evidence-completion@1', changeName: 'example', outcome: 'passed', lane: 'provider-free',
      observedAt: '2026-01-01T00:00:00Z', revision: 'older-revision', checks: [{ name: 'offline tests', status: 'passed', artifact: 'check.txt' }]
    }));
    const run = cli(f.root, 'status');
    assert.equal(run.status, 1);
    assert.notEqual(JSON.parse(run.stdout).completion, 'recorded-complete');
    assert.match(run.stdout, /malformed task/);
    assert.equal(cli(f.root, 'lint', '--stage', 'plan').status, 1);
    assert.equal(cli(f.root, 'verify').status, 1);
  } finally { f.close(); }
});
