export async function reportErrorToSentry(dsn: string, payload: any) {
  try {
    // Simple pattern: send event to Sentry via the ingest API
    // For full coverage use @sentry/cloudflare in production; this is a lightweight helper.
    const url = `https://sentry.io/api/0/projects/your-org/your-project/envelope/`;
    // NOTE: the above URL is a placeholder. Encourage user to configure Sentry integration for workers.
    console.warn('Sentry report placeholder called. Configure worker Sentry SDK for production.');
  } catch (err) {
    console.error('Failed to report to Sentry', err);
  }
}

export function structuredLog(level: 'info'|'warn'|'error', message: string, extra?: Record<string, any>) {
  const payload = { level, message, ts: new Date().toISOString(), ...extra };
  // In Cloudflare Workers, console.* is captured by Logpush or other systems.
  if (level === 'error') console.error(JSON.stringify(payload));
  else console.log(JSON.stringify(payload));
}
