/**
 * JSON repair utilities for Gemini output — matches dopamine's safeJsonParse.
 *
 * Handles three common Gemini malformations:
 * 1. Markdown code fences (```json ... ```)
 * 2. Trailing commas before } or ]
 * 3. Unescaped literal \n, \r, \t inside strings
 */

/**
 * Parse JSON with automatic repair of common Gemini output issues.
 */
export function safeJsonParse(raw: string): unknown {
  // Step 1: Strip markdown code fences
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    // Remove opening fence (```json or ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing fence
    cleaned = cleaned.replace(/\n?\s*```\s*$/, '');
  }

  // Step 2: Try parsing as-is first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to repair
  }

  // Step 3: Remove trailing commas (,} or ,])
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Step 4: Escape unescaped control characters inside strings
  // This is tricky — we only want to escape inside JSON string values
  cleaned = cleaned.replace(
    /"(?:[^"\\]|\\.)*"/g,
    (match) => {
      return match
        .replace(/(?<!\\)\n/g, '\\n')
        .replace(/(?<!\\)\r/g, '\\r')
        .replace(/(?<!\\)\t/g, '\\t');
    },
  );

  // Step 5: Try parsing again after repairs
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Step 6: Last resort — try to extract JSON object or array
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Fall through
      }
    }

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // Fall through
      }
    }

    throw new Error(
      `safeJsonParse failed after all repair attempts: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
