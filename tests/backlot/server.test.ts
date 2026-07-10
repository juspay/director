import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import http from 'http';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';
import { createBacklotServer, resolvePort } from '../../src/backlot/server.ts';

/** Boot the sidecar on an ephemeral port over a freshly-written state fixture. */
async function withServer(fn: (port: number, dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-srv-'));
  await fs.writeFile(
    path.join(dir, 'pipeline-state.json'),
    JSON.stringify({ results: { voiceover: {} }, errors: [] }),
  );
  const srv = createBacklotServer(dir);
  await new Promise<void>((resolve) => srv.listen(0, '127.0.0.1', resolve));
  try {
    await fn((srv.address() as AddressInfo).port, dir);
  } finally {
    await new Promise<void>((resolve) => srv.close(() => resolve()));
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('GET /api/snapshot serves the derived snapshot for the given state dir', async () => {
  await withServer(async (port) => {
    const body = await new Promise<string>((resolve, reject) => {
      http.get({ host: '127.0.0.1', port, path: '/api/snapshot' }, (res) => {
        assert.equal(res.statusCode, 200);
        let b = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { b += c; });
        res.on('end', () => resolve(b));
      }).on('error', reject);
    });
    const snap = JSON.parse(body);
    assert.equal(snap.totalSteps, 7);
    assert.equal(snap.currentStep, 1);
    assert.equal(snap.liveness, 'running'); // fixture was written moments ago
  });
});

test('GET /api/events streams an initial SSE snapshot frame and cleans up on close', async () => {
  await withServer(async (port) => {
    const frame = await new Promise<string>((resolve, reject) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/events' }, (res) => {
        assert.equal(res.headers['content-type'], 'text/event-stream');
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          buf += c;
          const i = buf.indexOf('\n\n');
          if (i >= 0) { req.destroy(); resolve(buf.slice(0, i)); }
        });
      });
      req.on('error', () => { /* expected: destroyed after the first frame */ });
      setTimeout(() => { req.destroy(); reject(new Error('no SSE frame within 5s')); }, 5000).unref();
    });
    assert.match(frame, /^data: /);
    const snap = JSON.parse(frame.slice('data: '.length));
    assert.equal(snap.currentStep, 1);
    assert.equal(snap.liveness, 'running');
    // If the per-connection intervals leaked, srv.close() in withServer would
    // hang this test past its runner timeout — completing IS the cleanup check.
  });
});

test('resolvePort precedence: --port beats env beats default', () => {
  assert.equal(resolvePort(['--port', '5000'], { BACKLOT_PORT: '6000' }), 5000);
  assert.equal(resolvePort([], { BACKLOT_PORT: '6000' }), 6000);
  assert.equal(resolvePort([], {}), 4599);
});

test('GET /api/shot-key/<i> serves the keyframe and guards the route', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-key-'));
  const stateDir = path.join(outDir, '.pipeline-state');
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(path.join(stateDir, 'pipeline-state.json'), JSON.stringify({ results: {}, errors: [] }));
  const pngBytes = Buffer.from('89504e470d0a1a0a', 'hex'); // PNG magic — content is irrelevant to the route
  await fs.writeFile(path.join(outDir, '.broll-dir-key-0.png'), pngBytes);

  const srv = createBacklotServer(stateDir);
  await new Promise<void>((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const port = (srv.address() as AddressInfo).port;
  const get = (p: string): Promise<{ status: number; type: string | undefined; body: Buffer }> =>
    new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port, path: p }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, type: res.headers['content-type'], body: Buffer.concat(chunks) }));
      }).on('error', reject);
    });

  try {
    const ok = await get('/api/shot-key/0');
    assert.equal(ok.status, 200);
    assert.equal(ok.type, 'image/png');
    assert.deepEqual(ok.body, pngBytes);

    assert.equal((await get('/api/shot-key/7')).status, 404, 'missing keyframe → 404');
    assert.equal((await get('/api/shot-key/../secrets')).status, 404, 'non-numeric index falls through to the 404 route');
    assert.equal((await get('/api/shot-key/0abc')).status, 404, 'trailing junk rejected');
  } finally {
    await new Promise<void>((resolve) => srv.close(() => resolve()));
    await fs.rm(outDir, { recursive: true, force: true });
  }
});
