import { randomBytes } from 'node:crypto'
import { getInstagramAuthorizationDebug } from './_shared/meta'
import { handleError, json, methodNotAllowed } from './_shared/responses'

export const config = {
  path: '/.netlify/functions/meta-authorize',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'GET') return methodNotAllowed()

    const url = new URL(request.url)
    if (url.searchParams.get('debug') !== '1') {
      return json({ error: 'debug_required', message: 'Use ?debug=1 para diagnosticar a authorization_url.' }, 400)
    }

    return json(getInstagramAuthorizationDebug(randomBytes(24).toString('base64url')))
  } catch (error) {
    return handleError(error, 'meta-authorize')
  }
}
