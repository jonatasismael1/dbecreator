import { ApiError } from './responses'
import { getOptionalEnv } from './env'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_RE.test(value.trim())) {
    throw new ApiError(400, 'invalid_payload', `${field} invalido.`)
  }

  return value.trim()
}

export function normalizeClientName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new ApiError(400, 'invalid_payload', 'Informe o nome do cliente com pelo menos 2 caracteres.')
  }

  return value.trim()
}

export function buildPublicApprovalUrl(token: string, requestUrl: string): string {
  const baseUrl = getPublicAppUrl(requestUrl)
  return `${baseUrl}/aprovacao/${encodeURIComponent(token)}`
}

export function getPublicAppUrl(requestUrl: string): string {
  const configuredUrl = getOptionalEnv('VITE_APP_URL')

  if (configuredUrl?.trim()) return configuredUrl.trim().replace(/\/$/, '')

  const url = new URL(requestUrl)
  return `${url.protocol}//${url.host}`.replace(/\/$/, '')
}
