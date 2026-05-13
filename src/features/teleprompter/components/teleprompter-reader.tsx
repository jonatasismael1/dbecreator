import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Eye,
  EyeOff,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Smartphone,
  X,
} from 'lucide-react'
import { useTeleprompterKeys } from '../hooks/use-teleprompter-keys'
import type { TeleprompterSettings } from '../types/teleprompter.types'

interface TeleprompterReaderProps {
  text: string
  settings: TeleprompterSettings
  onExit: () => void
  updateSettings: (settings: Partial<TeleprompterSettings>) => void
  autoStart?: boolean
}

export function TeleprompterReader({
  text,
  settings,
  onExit,
  updateSettings,
  autoStart = false,
}: TeleprompterReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [scrollPos, setScrollPos] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRotatedCSS, setIsRotatedCSS] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [maxScroll, setMaxScroll] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<number>(0)
  const lastTimeRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const hasAutoStartedRef = useRef(false)
  const isPlayingRef = useRef(isPlaying)
  const settingsRef = useRef(settings)
  const touchStartY = useRef<number | null>(null)
  const initialScrollPos = useRef(0)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / Math.max(90, 150 * Math.max(settings.speed, 0.5))))
  const progress = Math.min(100, Math.max(0, (scrollPos / maxScroll) * 100))

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    const updateMaxScroll = () => {
      const contentHeight = scrollRef.current?.scrollHeight || 1
      setMaxScroll(Math.max(1, contentHeight - window.innerHeight))
    }

    updateMaxScroll()
    window.addEventListener('resize', updateMaxScroll)
    return () => window.removeEventListener('resize', updateMaxScroll)
  }, [text, settings.width, settings.fontSize, settings.lineHeight])

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const deltaTime = time - lastTimeRef.current
        const pixelsPerMs = (settings.speed * 50) / 1000
        setScrollPos((prev) => prev + pixelsPerMs * deltaTime)
      }

      lastTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = null
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [isPlaying, settings.speed])

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setCountdown(null)
  }, [])

  const startPlayback = useCallback(() => {
    if (!settingsRef.current.enableCountdown) {
      setIsPlaying(true)
      return
    }

    cancelCountdown()
    setCountdown(3)
    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          if (countdownRef.current !== null) {
            window.clearInterval(countdownRef.current)
            countdownRef.current = null
          }
          setIsPlaying(true)
          return null
        }
        return prev - 1
      })
    }, 700)
  }, [cancelCountdown])

  const handleTogglePlay = useCallback(() => {
    if (countdown !== null) {
      cancelCountdown()
      return
    }

    if (isPlayingRef.current) {
      setIsPlaying(false)
      return
    }

    startPlayback()
  }, [cancelCountdown, countdown, startPlayback])

  const handleScrollUp = useCallback(() => {
    setScrollPos((prev) => Math.max(0, prev - 150))
  }, [])

  const handleScrollDown = useCallback(() => {
    setScrollPos((prev) => prev + 150)
  }, [])

  const handleSpeedDown = useCallback(() => {
    updateSettings({ speed: Math.max(0.1, settingsRef.current.speed - 0.5) })
  }, [updateSettings])

  const handleSpeedUp = useCallback(() => {
    updateSettings({ speed: Math.min(10, settingsRef.current.speed + 0.5) })
  }, [updateSettings])

  useEffect(() => {
    if (!autoStart || hasAutoStartedRef.current) return
    hasAutoStartedRef.current = true
    startPlayback()
  }, [autoStart, startPlayback])

  useEffect(() => () => cancelCountdown(), [cancelCountdown])

  useTeleprompterKeys({
    active: true,
    containerRef,
    onScrollUp: handleScrollUp,
    onScrollDown: handleScrollDown,
    onSpeedDown: handleSpeedDown,
    onSpeedUp: handleSpeedUp,
    onTogglePlayPause: handleTogglePlay,
  })

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: OrientationLockType) => Promise<void>
          unlock?: () => void
        }
        if (orientation.lock) {
          try {
            await orientation.lock('landscape')
          } catch {
            // Some mobile browsers expose orientation lock but block it.
          }
        }
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
        screen.orientation?.unlock?.()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReset = () => {
    setScrollPos(0)
    setIsPlaying(false)
    cancelCountdown()
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0].clientY
    initialScrollPos.current = scrollPos
    setIsPlaying(false)
  }

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const deltaY = touchStartY.current - event.touches[0].clientY
    setScrollPos(Math.max(0, initialScrollPos.current + deltaY * 1.5))
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={`fixed z-50 flex select-none flex-col overflow-hidden outline-none ${!isRotatedCSS ? 'inset-0' : ''}`}
      style={{
        backgroundColor: settings.bgColor,
        color: settings.textColor,
        ...(isRotatedCSS
          ? {
              width: '100vh',
              height: '100vw',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(90deg)',
            }
          : {}),
      }}
    >
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-zinc-900">
        <div className="h-full bg-dbe-blue transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="absolute left-4 top-4 z-20 flex gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 backdrop-blur">
          {estimatedMinutes} min
        </span>
        <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 backdrop-blur">
          {Math.round(progress)}%
        </span>
      </div>

      {countdown !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="text-8xl font-black tabular-nums text-white">{countdown}</div>
        </div>
      )}

      <div className="pointer-events-none absolute left-0 top-1/2 z-10 h-1 w-full -translate-y-1/2 bg-dbe-blue/30" />
      <div className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2">
        <div className="h-0 w-0 border-b-[10px] border-l-[15px] border-t-[10px] border-b-transparent border-l-dbe-blue border-t-transparent" />
      </div>

      <div
        className="flex flex-1 cursor-pointer touch-none flex-col items-center overflow-hidden"
        onClick={() => {
          if (touchStartY.current === null) handleTogglePlay()
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => {
          touchStartY.current = null
        }}
      >
        <div
          ref={scrollRef}
          className="whitespace-pre-wrap font-sans"
          style={{
            width: `${settings.width}%`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            transform: `translateY(${-scrollPos}px) ${settings.isMirrored ? 'scaleX(-1)' : ''}`,
            paddingTop: '50vh',
            paddingBottom: '50vh',
            textAlign: settings.textAlign,
            fontWeight: 600,
            transition: isPlaying ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {text}

          <div className="mt-32 flex w-full justify-center pb-[50vh]">
            <button
              onClick={onExit}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-widest text-zinc-500 shadow-xl shadow-black/50 transition-all hover:bg-zinc-800 hover:text-white"
            >
              Fim - voltar
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-6 left-1/2 z-20 flex w-auto max-w-[95vw] -translate-x-1/2 flex-col items-center gap-3"
          >
            <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl sm:gap-3">
              <IconButton onClick={handleReset} title="Reiniciar">
                <RotateCcw size={18} />
              </IconButton>
              <div className="mx-0.5 h-6 w-px bg-zinc-800 sm:h-8" />
              <IconButton onClick={handleSpeedDown} title="Diminuir velocidade">
                <Minus size={18} />
              </IconButton>
              <button
                onClick={handleTogglePlay}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-dbe-blue text-white shadow-lg shadow-dbe-blue/40 transition-all hover:bg-blue-600 active:scale-90 sm:h-14 sm:w-14"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <IconButton onClick={handleSpeedUp} title="Aumentar velocidade">
                <Plus size={18} />
              </IconButton>
              <div className="mx-0.5 h-6 w-px bg-zinc-800 sm:h-8" />
              <IconButton
                onClick={() => updateSettings({ isMirrored: !settings.isMirrored })}
                title="Espelhar"
                active={settings.isMirrored}
              >
                <FlipHorizontal size={18} />
              </IconButton>
              <IconButton onClick={toggleFullscreen} title="Tela cheia">
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </IconButton>
              <IconButton onClick={() => setIsRotatedCSS((prev) => !prev)} title="Girar tela" active={isRotatedCSS}>
                <Smartphone size={18} className={isRotatedCSS ? 'rotate-90' : ''} />
              </IconButton>
              <IconButton onClick={onExit} title="Sair" danger>
                <X size={18} />
              </IconButton>
            </div>

            <div className="rounded-full border border-zinc-800 bg-black/60 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400 backdrop-blur-sm sm:text-[10px]">
              {settings.speed.toFixed(1)}x | {settings.fontSize}px | {estimatedMinutes} min
              {isPlaying && <span className="ml-2 animate-pulse text-amber-400">gravando</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowControls((prev) => !prev)}
        className="absolute bottom-4 right-4 z-20 rounded-full bg-zinc-900/50 p-4 text-zinc-500 backdrop-blur-md transition-all hover:text-white sm:bottom-8 sm:right-8"
      >
        {showControls ? <EyeOff size={24} /> : <Eye size={24} />}
      </button>
    </div>
  )
}

function IconButton({
  active,
  danger,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; danger?: boolean }) {
  return (
    <button
      className={[
        'rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white sm:p-3',
        active ? 'bg-dbe-blue/10 text-dbe-blue' : '',
        danger ? 'hover:bg-dbe-red/20 hover:text-dbe-red' : '',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
