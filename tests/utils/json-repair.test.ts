import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { safeJsonParse } from '../../src/utils/json-repair.ts';

describe('safeJsonParse', () => {
  it('parses clean JSON', () => {
    assert.deepEqual(safeJsonParse('{"a":1}'), { a: 1 });
  });

  it('strips ```json fences', () => {
    const input = '```json\n{"ok": true}\n```';
    assert.deepEqual(safeJsonParse(input), { ok: true });
  });

  it('strips bare ``` fences', () => {
    const input = '```\n[1,2,3]\n```';
    assert.deepEqual(safeJsonParse(input), [1, 2, 3]);
  });

  it('repairs trailing commas in objects', () => {
    assert.deepEqual(safeJsonParse('{"a":1,"b":2,}'), { a: 1, b: 2 });
  });

  it('repairs trailing commas in arrays', () => {
    assert.deepEqual(safeJsonParse('[1,2,3,]'), [1, 2, 3]);
  });

  it('escapes literal newlines inside strings', () => {
    const input = '{"msg":"line1\nline2"}';
    const result = safeJsonParse(input) as { msg: string };
    assert.equal(result.msg, 'line1\nline2');
  });

  it('extracts object from surrounding text as last resort', () => {
    const input = 'Here is the result: {"score": 9} — done.';
    assert.deepEqual(safeJsonParse(input), { score: 9 });
  });

  it('throws on completely invalid input', () => {
    assert.throws(() => safeJsonParse('this is not json at all'), /safeJsonParse failed/);
  });

  it('handles nested structures with all malformations combined', () => {
    const input = '```json\n{"items":[{"id":1,},{"id":2,},],}\n```';
    assert.deepEqual(safeJsonParse(input), { items: [{ id: 1 }, { id: 2 }] });
  });
});
