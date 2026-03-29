/**
 * VideoObject JSON-LD schema generator for SEO.
 */

export function generateVideoSchema(opts: {
  name: string;
  description: string;
  durationSeconds: number;
  thumbnailUrl: string;
  contentUrl: string;
  uploadDate?: string;
  embedUrl?: string;
}): Record<string, unknown> {
  const duration = `PT${Math.floor(opts.durationSeconds / 60)}M${opts.durationSeconds % 60}S`;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: opts.name,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl,
    contentUrl: opts.contentUrl,
    uploadDate: opts.uploadDate ?? new Date().toISOString().split('T')[0],
    duration,
    ...(opts.embedUrl ? { embedUrl: opts.embedUrl } : {}),
  };
}

export function generateVideoSchemaHtml(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}
