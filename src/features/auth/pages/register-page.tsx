import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/context/auth-context'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null)
    const { error } = await signUp(data.email, data.password, data.fullName)
    if (error) {
      setServerError(error.message || 'Erro ao criar conta. Tente novamente.')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <div className="rounded-full bg-success/10 border border-success/20 p-4 mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">Conta criada com sucesso.</h2>
        <p className="max-w-sm text-sm text-text-muted">
          Enviamos um e-mail de confirmação. Clique no link recebido para liberar o acesso à sua conta.
        </p>
        <Button className="mt-6" onClick={() => navigate('/login')}>
          Entrar na minha conta
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text mb-2">Crie sua conta</h2>
      <p className="text-sm text-text-muted mb-8">Comece a criar conteúdo estratégico agora.</p>

      {serverError && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 mb-5">
          <AlertCircle className="h-4 w-4 text-danger shrink-0" />
          <p className="text-sm text-danger">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-text-muted mb-2">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
            <Input
              id="register-name"
              type="text"
              placeholder="Seu nome"
              {...register('fullName')}
              className="pl-10 h-11"
            />
          </div>
          {errors.fullName && <p className="mt-1.5 text-xs text-danger">{errors.fullName.message}</p>}
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-text-muted mb-2">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
            <Input
              id="register-email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              className="pl-10 h-11"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-text-muted mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
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
          Criar conta
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-sm text-text-muted text-center mt-6">
        Já tem conta?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Fazer login
        </Link>
      </p>
    </div>
  )
}
