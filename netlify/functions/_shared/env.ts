import { ApiError } from './responses'

declare const Netlify:
  | {
      env: {
        get(name: string): string | undefined
      }
    }
  | undefined

export function getEnv(name: string, fallbacks: string[] = []): string {
  for (const key of [name, ...fallbacks]) {
    const value = typeof Netlify !== 'undefined' ? Netlify.env.get(key) : process.env[key]
    if (value?.trim()) return value.trim()
  }

  throw new ApiError(500, 'missing_env', `Variavel de ambiente ${name} nao configurada.`)
}

export function getOptionalEnv(name: string, fallbacks: string[] = []): string | null {
  for (const key of [name, ...fallbacks]) {
    const value = typeof Netlify !== 'undefined' ? Netlify.env.get(key) : process.env[key]
    if (value?.trim()) return value.trim()
  }

  return null
}
