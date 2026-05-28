/**
 * Next.js instrumentation hook — запускается ОДИН раз при старте процесса.
 * Идеальное место для bootstrap: secrets, миграции, прогрев кэшей.
 *
 * Docs: node_modules/next/dist/docs/01-app/04-api-reference/04-functions/05-instrumentation.md
 */
import { loadSecretsIfNeeded } from './lib/secrets'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await loadSecretsIfNeeded()
  }
}
