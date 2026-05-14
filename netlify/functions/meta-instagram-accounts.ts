import { INSTAGRAM_OAUTH_DEBUG_VERSION } from './_shared/meta'
import { json, methodNotAllowed } from './_shared/responses'

export const config = {
  path: '/api/meta/instagram-accounts',
}

export default async function handler(request: Request): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method)) return methodNotAllowed()

  return json(
    {
      error: 'legacy_instagram_accounts_flow_removed',
      message: 'O fluxo antigo de selecao por Paginas do Facebook foi removido. Use o OAuth direto do Instagram.',
      debug_version: INSTAGRAM_OAUTH_DEBUG_VERSION,
      replacement_endpoint: '/api/meta/login',
    },
    410,
  )
}
