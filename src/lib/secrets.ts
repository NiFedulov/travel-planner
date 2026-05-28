/**
 * Secrets loader: AWS Secrets Manager в проде, env vars в dev.
 *
 * В Dockerfile / ECS task definition выставляется AWS_SECRETS_ID — имя
 * (или ARN) секрета в Secrets Manager. На старте app тянет JSON оттуда
 * и инжектит в process.env. Все библиотеки (Prisma, ioredis, ...) продолжают
 * читать env как обычно.
 *
 * IAM role у ECS task должна иметь secretsmanager:GetSecretValue на этот secret.
 *
 * Если AWS_SECRETS_ID не задан — пропускаем (dev mode читает .env.local).
 */
import { logger } from './logger'

let initialized = false

export async function loadSecretsIfNeeded(): Promise<void> {
  if (initialized) return
  initialized = true

  const secretId = process.env.AWS_SECRETS_ID
  if (!secretId) {
    logger.info('AWS_SECRETS_ID not set — using process.env directly')
    return
  }

  try {
    // Динамический импорт — AWS SDK тяжёлый, не тянем его в dev
    const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager')
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    })
    const res = await client.send(new GetSecretValueCommand({ SecretId: secretId }))
    if (!res.SecretString) throw new Error('SecretString is empty')

    const parsed = JSON.parse(res.SecretString) as Record<string, string>
    for (const [k, v] of Object.entries(parsed)) {
      // Не перезаписываем уже выставленные — позволяет override через task definition
      if (process.env[k] === undefined && typeof v === 'string') {
        process.env[k] = v
      }
    }
    logger.info('Loaded secrets from AWS Secrets Manager', { count: Object.keys(parsed).length })
  } catch (err) {
    logger.error('Failed to load secrets from AWS Secrets Manager', err)
    // В проде с пустым JWT_SECRET всё равно упадёт при первом use — fail loudly
    throw err
  }
}
