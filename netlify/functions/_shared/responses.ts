export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export function methodNotAllowed(): Response {
  return json({ error: 'method_not_allowed', message: 'Metodo nao permitido.' }, 405)
}

export function handleError(error: unknown, scope: string): Response {
  if (error instanceof ApiError) {
    console.warn(`[${scope}] ${error.code}: ${error.message}`)
    return json({ error: error.code, message: error.message, details: error.details }, error.status)
  }

  console.error(`[${scope}]`, error instanceof Error ? error.message : error)
  return json({ error: 'internal_error', message: 'Erro interno ao processar a integracao Meta.' }, 500)
}

export function redirectToApp(path: string): Response {
  const baseUrl = getPublicAppUrl()
  return Response.redirect(new URL(path, baseUrl).toString(), 302)
}

function getPublicAppUrl() {
  const fromNetlify = typeof Netlify !== 'undefined' ? Netlify.env.get('VITE_APP_URL') : undefined
  return (fromNetlify || process.env.VITE_APP_URL || 'https://dbecreator.netlify.app').replace(/\/$/, '')
}

declare const Netlify:
  | {
      env: {
        get(name: string): string | undefined
      }
    }
  | undefined
