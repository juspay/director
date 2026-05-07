import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
// NeuroLink 9.61's ImageGenService routes Vertex Imagen through generateText()
// which doesn't fit the Imagen REST endpoint. Direct fetch as workaround until
// upstream fix lands. See BLOCKERS.md.
const region = process.env.IMAGEN_REGION ?? 'us-central1';
const project = process.env.GOOGLE_CLOUD_PROJECT ?? 'dev-ai-beta';
const model = process.env.IMAGEN_MODEL ?? 'imagen-3.0-generate-001';
const out = process.argv[2] ?? 'out/tier1/portrait-generated.jpg';
const prompt = process.argv[3] ?? 'Professional portrait of an AI assistant: friendly woman, neutral expression, plain background, head-and-shoulders, cinematic lighting';

const { stdout: token } = await execa('gcloud', ['auth', 'print-access-token']);
const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:predict`;
const r = await fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token.trim()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '1:1' } }),
});
if (!r.ok) { console.error(`Imagen ${r.status}:`, (await r.text()).slice(0, 300)); process.exit(1); }
const data = await r.json();
const b64 = data.predictions?.[0]?.bytesBase64Encoded;
if (!b64) { console.error('No image in response:', JSON.stringify(data).slice(0, 300)); process.exit(1); }
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, Buffer.from(b64, 'base64'));
console.log('saved', out, `(${(b64.length * 0.75 / 1024).toFixed(0)} KB)`);
