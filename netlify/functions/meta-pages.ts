import { INSTAGRAM_OAUTH_DEBUG_VERSION } from './_shared/meta'
import { json, methodNotAllowed } from './_shared/responses'

export const config = {
  path: '/api/meta/pages',
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed()

  return json(
    {
      error: 'legacy_facebook_pages_flow_removed',
      message: 'O fluxo antigo baseado em Paginas do Facebook foi removido. Use o OAuth direto do Instagram.',
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      replacement_endpoint: '/api/meta/login',
    },
    410,
  )
}
