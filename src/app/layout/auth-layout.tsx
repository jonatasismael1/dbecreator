import { Outlet } from 'react-router-dom'
import { Zap, BarChart2, CalendarCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    label: 'Deby AI',
    desc: 'Analisa e reescreve roteiros com lógica de conversão.',
  },
  {
    icon: BarChart2,
    label: 'Métricas reais',
    desc: 'Conecte o Instagram e veja o que de fato performou.',
  },
  {
    icon: CalendarCheck,
    label: 'Fluxo completo',
    desc: 'Da ideia ao calendário, sem sair da plataforma.',
  },
]

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-[#070809]">

      {/* ── Left hero panel ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] xl:w-[54%]">

        {/* Background grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 64px),
              repeating-linear-gradient(0deg,  rgba(255,255,255,0.03) 0 1px, transparent 1px 64px)
            `,
          }}
        />

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0E8FCC]/16 via-transparent to-[#00C85A]/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#070809] to-transparent" />

        {/* Vertical accent line */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        {/* Ambient glow spots */}
        <div className="pointer-events-none absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-[#0E8FCC]/12 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-1/3 right-0 h-60 w-60 rounded-full bg-[#00C85A]/10 blur-[60px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between px-14 py-14 xl:px-16">

          {/* Top: brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-[#0E8FCC] to-[#00C85A]" />
            <span className="text-[13px] font-semibold tracking-[0.18em] text-white/50 uppercase">
              DBE Creator
            </span>
          </div>

          {/* Middle: headline + features */}
          <div>
            <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0E8FCC]/80">
              Sistema operacional para criadores
            </p>

            <h1
              className="mb-8 font-serif leading-[1.06] text-white"
              style={{ fontSize: 'clamp(38px, 3.6vw, 56px)', fontWeight: 600, letterSpacing: '-0.02em' }}
            >
              Transforme ideias em{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #0E8FCC, #5BB8EA)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                conteúdo
              </span>{' '}
              que{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #00C85A, #34E880)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                converte.
              </span>
            </h1>

            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, label, desc }, i) => (
                <div
                  key={label}
                  className="flex items-start gap-4"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
                    <Icon className="h-4 w-4 text-white/60" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white/90">{label}</p>
                    <p className="text-[12px] leading-relaxed text-white/40">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: social proof */}
          <div className="flex items-center gap-6 border-t border-white/6 pt-8">
            <div>
              <p className="text-xl font-bold text-white">500+</p>
              <p className="text-[11px] text-white/35 mt-0.5">Criadores ativos</p>
            </div>
            <div className="h-8 w-px bg-white/8" />
            <div>
              <p className="text-xl font-bold text-white">12k+</p>
              <p className="text-[11px] text-white/35 mt-0.5">Roteiros criados</p>
            </div>
            <div className="h-8 w-px bg-white/8" />
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#00C85A] shadow-[0_0_6px_#00C85A]" />
              <p className="text-[11px] font-medium text-white/50">Deby AI online</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:bg-[#0A0C0F]">
        <div className="w-full max-w-[380px]">

          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="h-1 w-5 rounded-full bg-gradient-to-r from-[#0E8FCC] to-[#00C85A]" />
            <span className="text-[13px] font-semibold tracking-[0.16em] text-white/50 uppercase">
              DBE Creator
            </span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
