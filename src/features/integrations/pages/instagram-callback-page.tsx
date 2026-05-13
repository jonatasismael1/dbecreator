import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera as Instagram } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { integrationsService } from '../services/integrations.service'

export function InstagramCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Conectando sua conta Instagram...')

  useEffect(() => {
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error_message') || params.get('error_description') || params.get('error')
    const expectedState = sessionStorage.getItem('instagram_oauth_state')
    const workspaceId = sessionStorage.getItem('instagram_oauth_workspace_id')
    const redirectUri = sessionStorage.getItem('instagram_oauth_redirect_uri')

    async function complete() {
      try {
        if (error) throw new Error(error)
        if (!code) throw new Error('Meta nao retornou codigo de autorizacao.')
        if (!workspaceId || !redirectUri) throw new Error('Sessao de conexao expirada. Tente conectar novamente.')
        if (!state || state !== expectedState) throw new Error('Estado OAuth invalido. Tente conectar novamente.')

        await integrationsService.completeInstagramOAuth({ workspaceId, code, redirectUri })

        sessionStorage.removeItem('instagram_oauth_state')
        sessionStorage.removeItem('instagram_oauth_workspace_id')
        sessionStorage.removeItem('instagram_oauth_redirect_uri')

        setStatus('success')
        setMessage('Instagram conectado com sucesso.')
        window.setTimeout(() => navigate('/settings'), 1200)
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Nao foi possivel conectar o Instagram.')
      }
    }

    void complete()
  }, [navigate, params])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-dbe-purple/10">
          <Instagram className="h-6 w-6 text-dbe-purple" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-dbe-text">
          {status === 'loading' ? 'Conectando Instagram' : status === 'success' ? 'Conectado' : 'Falha na conexao'}
        </h1>
        <p className="mt-2 text-sm text-dbe-muted">{message}</p>
        {status === 'error' && (
          <Button className="mt-5" onClick={() => navigate('/settings')}>
            Voltar para configuracoes
          </Button>
        )}
      </Card>
    </div>
  )
}
