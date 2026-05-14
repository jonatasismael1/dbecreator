import { useEffect, useMemo, useState, type ElementType } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  FlipHorizontal,
  Minus,
  Moon,
  Play,
  Plus,
  Save,
  Settings,
  Sun,
  Timer,
  Type,
  Zap,
} from 'lucide-react'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import type { Script } from '@/features/scripts/types/script.types'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { TeleprompterReader } from '../components/teleprompter-reader'
import type { TeleprompterSettings, TeleprompterTextAlign } from '../types/teleprompter.types'

const SETTINGS_KEY = 'dbe_creator_tp_settings'
const CUSTOM_PRESETS_KEY = 'dbe_creator_tp_custom_presets'
const QUICK_TEXT_ID = '__quick__'

const DEFAULT_SETTINGS: TeleprompterSettings = {
  speed: 2,
  fontSize: 48,
  lineHeight: 1.5,
  width: 80,
  isMirrored: false,
  enableCountdown: true,
  textAlign: 'center',
  theme: 'dark',
  bgColor: '#000000',
  textColor: '#ffffff',
}

const PRESETS = {
  curto: { speed: 3, fontSize: 56, lineHeight: 1.2 },
  aula: { speed: 1.5, fontSize: 42, lineHeight: 1.6 },
  venda: { speed: 2.5, fontSize: 48, lineHeight: 1.4 },
  podcast: { speed: 1.2, fontSize: 38, lineHeight: 1.8 },
}

const ALIGNMENT_OPTIONS: Array<{ value: TeleprompterTextAlign; label: string; icon: ElementType }> = [
  { value: 'center', label: 'Centro', icon: AlignCenter },
  { value: 'justify', label: 'Justificado', icon: AlignJustify },
  { value: 'left', label: 'Esquerda', icon: AlignLeft },
  { value: 'right', label: 'Direita', icon: AlignRight },
]

interface CustomPreset {
  name: string
  settings: TeleprompterSettings
}

function readStoredSettings(): TeleprompterSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function readCustomPresets(): CustomPreset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY)
    return stored ? JSON.parse(stored) as CustomPreset[] : []
  } catch {
    return []
  }
}

function getScriptText(script: Script) {
  return [script.title, script.hook, script.body, script.cta].filter(Boolean).join('\n\n')
}

export function TeleprompterPage() {
  const navigate = useNavigate()
  const { scriptId } = useParams()
  const { workspaceId } = useWorkspaceContext()
  const { data: scripts = [], isLoading, isError } = useScripts(workspaceId)

  const [selectedScriptId, setSelectedScriptId] = useState(scriptId ?? QUICK_TEXT_ID)
  const [quickText, setQuickText] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [settings, setSettings] = useState<TeleprompterSettings>(readStoredSettings)
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(readCustomPresets)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  const selectedScript = scripts.find((script) => script.id === selectedScriptId)

  const readerText = useMemo(() => {
    if (selectedScriptId === QUICK_TEXT_ID) return quickText
    if (selectedScriptId === 'all') return scripts.map(getScriptText).join('\n\n---\n\n')
    return selectedScript ? getScriptText(selectedScript) : ''
  }, [quickText, scripts, selectedScript, selectedScriptId])

  const updateSettings = (partial: Partial<TeleprompterSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }

  const applyPreset = (preset: keyof typeof PRESETS) => {
    updateSettings(PRESETS[preset])
  }

  const saveCustomPreset = () => {
    const name = presetName.trim() || `Preset ${customPresets.length + 1}`
    const next = [{ name, settings }, ...customPresets.filter((item) => item.name !== name)].slice(0, 8)
    setCustomPresets(next)
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(next))
    setPresetName('')
  }

  if (isStarted && readerText.trim()) {
    return (
      <TeleprompterReader
        text={readerText}
        settings={settings}
        onExit={() => setIsStarted(false)}
        updateSettings={updateSettings}
        autoStart
      />
    )
  }

  if (isLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-dbe-muted">Erro ao carregar roteiros. Tente novamente.</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Teleprompter" description="Leia roteiros do workspace ou cole um texto rapido para gravacao.">
        <Button variant="secondary" onClick={() => setSelectedScriptId(QUICK_TEXT_ID)}>
          <Zap className="h-4 w-4" />
          Texto rapido
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Type className="h-4 w-4 text-dbe-blue" />
              <h2 className="text-sm font-semibold text-dbe-text">Conteúdo de leitura</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-medium text-dbe-muted">Roteiro</span>
                <select
                  value={selectedScriptId}
                  onChange={(event) => {
                    setSelectedScriptId(event.target.value)
                    if (event.target.value !== QUICK_TEXT_ID) navigate(`/teleprompter/${event.target.value}`, { replace: true })
                  }}
                  className="w-full rounded-lg border border-dbe-border bg-dbe-dark px-4 py-2.5 text-sm text-dbe-text outline-none focus:border-dbe-blue/50"
                >
                  <option value={QUICK_TEXT_ID}>Texto rapido</option>
                  <option value="all">Todos os roteiros</option>
                  {scripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-lg border border-dbe-border bg-dbe-dark px-4 py-3">
                <p className="text-xs text-dbe-muted">Estimativa</p>
                <p className="mt-1 text-sm font-semibold text-dbe-text">
                  {readerText.trim() ? `${readerText.trim().split(/\s+/).length} palavras` : 'Sem texto selecionado'}
                </p>
              </div>
            </div>
          </Card>

          {selectedScriptId === QUICK_TEXT_ID && (
            <Card className="p-5">
              <label>
                <span className="mb-2 block text-xs font-medium text-dbe-muted">Texto rapido</span>
                <textarea
                  value={quickText}
                  onChange={(event) => setQuickText(event.target.value)}
                  placeholder="Cole o roteiro aqui..."
                  className="min-h-[320px] w-full resize-y rounded-lg border border-dbe-border bg-dbe-dark px-4 py-3 text-base leading-relaxed text-dbe-text outline-none placeholder:text-dbe-muted/50 focus:border-dbe-blue/50"
                />
              </label>
            </Card>
          )}

          {selectedScriptId !== QUICK_TEXT_ID && (
            <Card className="flex min-h-[420px] flex-col p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-dbe-text">Preview</h2>
                  <p className="text-xs text-dbe-muted">{selectedScript?.title ?? 'Todos os roteiros'}</p>
                </div>
                {selectedScript && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/scripts/${selectedScript.id}`)}>
                    Abrir roteiro
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-lg border border-dbe-border bg-black/50 p-6 text-lg leading-relaxed text-dbe-muted">
                {readerText || 'Selecione um roteiro para visualizar o texto.'}
              </div>
            </Card>
          )}
        </div>

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-2">
            <Settings className="h-4 w-4 text-dbe-blue" />
            <h2 className="text-sm font-semibold text-dbe-text">Configurações</h2>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dbe-muted">Presets rapidos</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((preset) => (
                  <Button key={preset} variant="secondary" size="sm" onClick={() => applyPreset(preset)} className="uppercase">
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-dbe-muted">Preset salvo</p>
              <div className="flex gap-2">
                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-dbe-border bg-dbe-dark px-3 py-2 text-sm text-dbe-text outline-none focus:border-dbe-blue/50"
                  placeholder="Nome"
                />
                <Button variant="secondary" size="sm" onClick={saveCustomPreset}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              {customPresets.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {customPresets.map((preset) => (
                    <Button key={preset.name} variant="ghost" size="sm" onClick={() => setSettings({ ...DEFAULT_SETTINGS, ...preset.settings })}>
                      {preset.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <Slider label="Velocidade" value={`${settings.speed.toFixed(1)}x`}>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={settings.speed}
                onChange={(event) => updateSettings({ speed: Number(event.target.value) })}
                className="w-full accent-dbe-blue"
              />
            </Slider>

            <Slider label="Fonte" value={`${settings.fontSize}px`}>
              <input
                type="range"
                min="20"
                max="120"
                value={settings.fontSize}
                onChange={(event) => updateSettings({ fontSize: Number(event.target.value) })}
                className="w-full accent-dbe-blue"
              />
            </Slider>

            <Slider label="Largura" value={`${settings.width}%`}>
              <input
                type="range"
                min="30"
                max="100"
                value={settings.width}
                onChange={(event) => updateSettings({ width: Number(event.target.value) })}
                className="w-full accent-dbe-blue"
              />
            </Slider>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ToggleRow
                icon={FlipHorizontal}
                label="Espelhar"
                active={settings.isMirrored}
                onClick={() => updateSettings({ isMirrored: !settings.isMirrored })}
              />
              <ToggleRow
                icon={Timer}
                label="Contagem"
                active={settings.enableCountdown}
                onClick={() => updateSettings({ enableCountdown: !settings.enableCountdown })}
              />
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dbe-muted">Alinhamento</p>
              <div className="grid grid-cols-2 gap-2">
                {ALIGNMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={settings.textAlign === value ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateSettings({ textAlign: value })}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={settings.theme === 'dark' ? 'primary' : 'secondary'}
                onClick={() => updateSettings({ theme: 'dark', bgColor: '#000000', textColor: '#ffffff' })}
              >
                <Moon className="h-4 w-4" />
                Escuro
              </Button>
              <Button
                variant={settings.theme === 'light' ? 'primary' : 'secondary'}
                onClick={() => updateSettings({ theme: 'light', bgColor: '#ffffff', textColor: '#000000' })}
              >
                <Sun className="h-4 w-4" />
                Claro
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => updateSettings({ speed: Math.max(0.1, settings.speed - 0.5) })}>
                <Minus className="h-4 w-4" />
                Velocidade
              </Button>
              <Button variant="secondary" onClick={() => updateSettings({ speed: Math.min(10, settings.speed + 0.5) })}>
                <Plus className="h-4 w-4" />
                Velocidade
              </Button>
            </div>

            <Button onClick={() => setIsStarted(true)} disabled={!readerText.trim()} className="w-full" size="lg">
              <Play className="h-5 w-5" fill="currentColor" />
              Iniciar leitura
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Slider({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-dbe-muted">{label}</label>
        <span className="text-xs font-bold text-dbe-blue">{value}</span>
      </div>
      {children}
    </div>
  )
}

function ToggleRow({ icon: Icon, label, active, onClick }: { icon: ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-lg border border-dbe-border bg-dbe-dark p-3 text-left transition-colors hover:border-dbe-blue/40"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-dbe-text">
        <Icon className="h-4 w-4 text-dbe-muted" />
        {label}
      </span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${active ? 'bg-dbe-blue' : 'bg-slate-700'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${active ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  )
}
