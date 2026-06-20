import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { safeJsonParse, stripTrailingCommas } from '../../src/utils/json-repair.ts';

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

  // Regression: the old blanket /,\s*([}\]])/g replace stripped commas that live
  // INSIDE string values when the trailing-comma repair path was triggered.
  it('preserves ",}" inside a string value while repairing the real trailing comma', () => {
    const r = safeJsonParse('{"pat":",}","b":2,}') as { pat: string; b: number };
    assert.equal(r.pat, ',}', 'comma inside the string value must survive');
    assert.equal(r.b, 2);
  });

  it('preserves ",]" inside a string value while repairing a trailing comma', () => {
    const r = safeJsonParse('{"regex":"foo,]bar","x":1,}') as { regex: string; x: number };
    assert.equal(r.regex, 'foo,]bar');
    assert.equal(r.x, 1);
  });

  it('preserves an escaped-quote string containing a structural-looking comma', () => {
    const r = safeJsonParse('{"q":"say \\"hi\\",}","n":3,}') as { q: string; n: number };
    assert.equal(r.q, 'say "hi",}');
    assert.equal(r.n, 3);
  });
});

describe('stripTrailingCommas', () => {
  it('drops a structural trailing comma before } and ]', () => {
    assert.equal(stripTrailingCommas('{"a":1,}'), '{"a":1}');
    assert.equal(stripTrailingCommas('[1,2,]'), '[1,2]');
    assert.equal(stripTrailingCommas('{"a":1 , }'), '{"a":1  }');
  });

  it('never touches commas inside string literals', () => {
    assert.equal(stripTrailingCommas('{"p":",}"}'), '{"p":",}"}');
    assert.equal(stripTrailingCommas('{"p":"a,]b"}'), '{"p":"a,]b"}');
  });

  it('leaves a non-trailing comma alone', () => {
    assert.equal(stripTrailingCommas('{"a":1,"b":2}'), '{"a":1,"b":2}');
  });
});
