/**
 * Remotion renderer — local and Lambda rendering via CLI.
 */
import { execa } from 'execa';
import path from 'path';

export async function renderLocal(
  composition: string,
  outputPath: string,
  options: { codec?: string; crf?: number; concurrency?: number; remotionDir?: string } = {},
): Promise<string> {
  const dir = options.remotionDir ?? 'remotion';
  const args = [
    'remotion', 'render', composition, outputPath,
    '--codec', options.codec ?? 'h264',
    '--crf', String(options.crf ?? 18),
    '--concurrency', String(options.concurrency ?? 4),
  ];

  console.log(`[Remotion] Rendering ${composition} → ${outputPath}`);
  await execa('npx', args, { cwd: dir, stdio: 'inherit' });
  console.log(`[Remotion] Done: ${outputPath}`);
  return outputPath;
}

export async function renderOnLambda(
  composition: string,
  outputPath: string,
  options: {
    functionName?: string;
    serveUrl?: string;
    region?: string;
    codec?: string;
    crf?: number;
  } = {},
): Promise<string> {
  const fn = options.functionName ?? process.env.REMOTION_FUNCTION_NAME ?? '';
  const url = options.serveUrl ?? process.env.REMOTION_SERVE_URL ?? '';
  if (!fn || !url) throw new Error('Set REMOTION_FUNCTION_NAME and REMOTION_SERVE_URL');

  const args = [
    'remotion', 'lambda', 'render',
    '--function-name', fn, '--serve-url', url,
    '--composition', composition,
    '--codec', options.codec ?? 'h264',
    '--crf', String(options.crf ?? 18),
    '--region', options.region ?? 'us-east-1',
  ];

  console.log(`[Lambda] Rendering ${composition} on ${fn}...`);
  const { stdout } = await execa('npx', args);

  // Extract S3 URL from output
  const urlMatch = stdout.match(/https:\/\/[^\s]+\.s3\.[^\s]+/);
  if (urlMatch) {
    await execa('curl', ['-sL', '-o', outputPath, urlMatch[0]]);
    console.log(`[Lambda] Downloaded: ${outputPath}`);
  }

  return outputPath;
}

export async function deploySite(remotionDir: string, siteName: string = 'director-video'): Promise<string> {
  const { stdout } = await execa('npx', [
    'remotion', 'lambda', 'sites', 'create', '--site-name', siteName, remotionDir,
  ]);
  const url = stdout.match(/https:\/\/[^\s]+/)?.[0] ?? '';
  console.log(`[Lambda] Site deployed: ${url}`);
  return url;
}
