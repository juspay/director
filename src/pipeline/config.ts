/**
 * Pipeline configuration — centralized constants matching dopamine's pattern.
 * All values overridable via environment variables.
 */
import 'dotenv/config';
import path from 'path';

// Directories
export const PROJECT_DIR = path.resolve(import.meta.dirname, '..', '..');
export const LIBRARY_DIR = path.join(PROJECT_DIR, 'video-production', 'library');
export const OUTPUT_DIR = path.join(PROJECT_DIR, 'output');
export const STATE_DIR = path.join(PROJECT_DIR, '.pipeline-state');

// Product context (used in scoring prompts)
export const PRODUCT_NAME = process.env.PRODUCT_NAME ?? 'Tara';
export const PRODUCT_DESCRIPTION =
  process.env.PRODUCT_DESCRIPTION ?? 'an AI coding agent that lives in Slack';

// AI Model
export const MODEL = process.env.MODEL ?? 'gemini-2.5-flash';
export const VERTEX_PROJECT = process.env.VERTEX_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? '';
export const VERTEX_LOCATION = process.env.VERTEX_LOCATION ?? 'us-central1';

// Rate limiting
export const DELAY_BETWEEN_REQUESTS_MS = parseInt(process.env.DELAY_MS ?? '2000', 10);
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES ?? '5', 10);
export const RETRY_BASE_DELAY_MS = parseInt(process.env.RETRY_BASE_DELAY_MS ?? '10000', 10);

// Video scoring
export const VIDEO_SCORE_TARGET = parseFloat(process.env.VIDEO_SCORE_TARGET ?? '9.0');
export const SCRIPT_SCORE_TARGET = parseFloat(process.env.SCRIPT_SCORE_TARGET ?? '9.0');
export const VMAF_REGRESSION_THRESHOLD = parseFloat(process.env.VMAF_THRESHOLD ?? '2.0');

// Video size threshold for thumbnail fallback (bytes, 0 = always use thumbnail)
export const VIDEO_SIZE_THRESHOLD_BYTES = parseInt(
  process.env.VIDEO_SIZE_THRESHOLD ?? '52428800', // 50 MB default
  10,
);

// Scoring tiers
export const SCORING_TIERS = {
  dev: { model: 'gemini-2.5-flash', runs: 1, maxTokens: 4096 },
  official: { model: 'gemini-2.5-pro', runs: 3, maxTokens: 8192 },
} as const;

// Observability
export const REPORTER_INTERVAL_MS = parseInt(process.env.REPORTER_INTERVAL_MS ?? '40000', 10);
export const OBSERVABILITY_LOG_DIR = path.join(PROJECT_DIR, '.observability');

// Pipeline phases
export const PIPELINE_PHASES = [
  'voiceover',
  'avatar',
  'broll',
  'music',
  'render',
  'assembly',
  'captions',
] as const;

export type PipelinePhase = (typeof PIPELINE_PHASES)[number];

export const CONFIG = {
  MODEL,
  VERTEX_PROJECT,
  VERTEX_LOCATION,
  DELAY_BETWEEN_REQUESTS_MS,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
  VIDEO_SIZE_THRESHOLD_BYTES,
  VIDEO_SCORE_TARGET,
  SCRIPT_SCORE_TARGET,
} as const;
