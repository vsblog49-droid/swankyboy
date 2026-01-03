import { jsonResponse } from '../lib/response';
import type { Env } from '../index';

export function handleHealth(env: Env): Response {
  return jsonResponse({ ok: true, db: !!env.DB });
}
