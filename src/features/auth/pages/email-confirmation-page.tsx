import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

type ConfirmationState =
  | { status: 'loading'; message: string }
  | { status: 'success'; message: string; hasSession: boolean }
  | { status: 'error'; message: string }

export function EmailConfirmationPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<ConfirmationState>({
    status: 'loading',
    message: 'Confirmando seu e-mail...',
  })

  useEffect(() => {
    let mounted = true

    async function confirmEmail() {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const errorDescription =
        url.searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        hashParams.get('error')

      if (errorDescription) {
        if (mounted) {
          setState({
            status: 'error',
            message: decodeURIComponent(errorDescription).replace(/\+/g, ' '),
          })
        }
        return
      }

      const code = url.searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (mounted) {
            setState({
              status: 'error',
              message: 'Link inválido ou expirado. Solicite um novo e-mail de confirmação.',
            })
          }
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      const hasSession = Boolean(data.session)

      if (mounted) {
        setState({
          status: 'success',
          message: 'E-mail confirmado com sucesso. Agora você já pode acessar sua conta.',
          hasSession,
        })
      }
    }

    confirmEmail()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-dbe-dark px-4 py-10 text-dbe-text">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-dbe-border bg-dbe-navy p-8 text-center shadow-2xl">
          {state.status === 'loading' && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-dbe-blue/20 bg-dbe-blue/10">
                <Loader2 className="h-7 w-7 animate-spin text-dbe-blue" />
              </div>
              <h1 className="text-xl font-bold">Confirmação de e-mail</h1>
              <p className="mt-3 text-sm text-dbe-muted">{state.message}</p>
            </>
          )}

          {state.status === 'success' && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-dbe-green/20 bg-dbe-green/10">
                <CheckCircle2 className="h-7 w-7 text-dbe-green" />
              </div>
              <h1 className="text-xl font-bold">E-mail confirmado</h1>
              <p className="mt-3 text-sm text-dbe-muted">{state.message}</p>
              <Button className="mt-6 w-full" onClick={() => navigate(state.hasSession ? '/' : '/login')}>
                {state.hasSession ? 'Ir para o dashboard' : 'Entrar na minha conta'}
              </Button>
            </>
          )}

          {state.status === 'error' && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-dbe-red/20 bg-dbe-red/10">
                <AlertCircle className="h-7 w-7 text-dbe-red" />
              </div>
              <h1 className="text-xl font-bold">Não foi possível confirmar</h1>
              <p className="mt-3 text-sm text-dbe-muted">{state.message}</p>
              <Button className="mt-6 w-full" variant="secondary" onClick={() => navigate('/login')}>
                Voltar para o login
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
