import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/context/auth-context'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      const message = error.message.toLowerCase()
      setServerError(
        message.includes('email not confirmed') || message.includes('not confirmed')
          ? 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
          : 'E-mail ou senha incorretos. Tente novamente.'
      )
    } else {
      navigate('/')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text mb-2">Bem-vindo de volta</h2>
      <p className="text-sm text-text-muted mb-8">Entre na sua conta para continuar criando.</p>

      {serverError && (
        <div className="mb-5 flex items-center gap-2 rounded-[var(--r-md)] border border-danger/20 bg-danger/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-danger shrink-0" />
          <p className="text-sm text-danger">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-text-muted mb-2">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
            <Input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              className="pl-10 h-11"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-text-muted mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="pl-10 pr-10 h-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Entrar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-sm text-text-muted text-center mt-6">
        Não tem conta?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Criar conta grátis
        </Link>
      </p>
    </div>
  )
}
