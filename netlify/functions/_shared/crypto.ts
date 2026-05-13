import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { getEnv, getOptionalEnv } from './env'
import { ApiError } from './responses'

const ALGORITHM = 'aes-256-gcm'

export function encryptToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `v1:${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`
}

export function decryptToken(payload: string | null | undefined): string {
  if (!payload) {
    throw new ApiError(409, 'integration_not_connected', 'Instagram ainda nao esta conectado.')
  }

  const [version, ivValue, authTagValue, encryptedValue] = payload.split(':')
  if (version !== 'v1' || !ivValue || !authTagValue || !encryptedValue) {
    throw new ApiError(500, 'invalid_encrypted_token', 'Token salvo em formato invalido.')
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivValue, 'base64url'))
    decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    throw new ApiError(500, 'token_decrypt_failed', 'Nao foi possivel descriptografar a integracao.')
  }
}

function getEncryptionKey(): Buffer {
  const secret = getOptionalEnv('META_TOKEN_ENCRYPTION_KEY') || getEnv('META_APP_SECRET')
  return createHash('sha256').update(secret).digest()
}
