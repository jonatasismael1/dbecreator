import { useCallback, useEffect, useRef, type RefObject } from 'react'

export const KEY_MAP = {
  scrollUp: ['ArrowUp', 'PageUp', 'AudioVolumeUp', 'VolumeUp'],
  scrollDown: ['ArrowDown', 'PageDown', 'AudioVolumeDown', 'VolumeDown'],
  speedDown: ['ArrowLeft', 'MediaTrackPrevious'],
  speedUp: ['ArrowRight', 'MediaTrackNext'],
  togglePlayPause: ['Enter', ' ', 'MediaPlayPause', 'MediaPlay', 'F5', 'F8', 'AudioPlay'],
} as const

export type TeleprompterAction = keyof typeof KEY_MAP

const KEYCODE_MAP: Record<number, TeleprompterAction> = {
  38: 'scrollUp',
  37: 'speedDown',
  33: 'scrollUp',
  175: 'scrollUp',
  40: 'scrollDown',
  39: 'speedUp',
  34: 'scrollDown',
  174: 'scrollDown',
  13: 'togglePlayPause',
  32: 'togglePlayPause',
  179: 'togglePlayPause',
}

interface UseTeleprompterKeysOptions {
  active: boolean
  containerRef?: RefObject<HTMLElement | null>
  onScrollUp?: () => void
  onScrollDown?: () => void
  onSpeedDown?: () => void
  onSpeedUp?: () => void
  onTogglePlayPause?: () => void
}

function isTypingTarget(el: EventTarget | null) {
  if (!el || !(el instanceof HTMLElement)) return false
  const tag = el.tagName.toLowerCase()
  return ['input', 'textarea', 'select'].includes(tag) || el.isContentEditable
}

function resolveActionByKey(key: string): TeleprompterAction | null {
  if (!key || key === 'Unidentified') return null

  for (const [action, keys] of Object.entries(KEY_MAP)) {
    if ((keys as readonly string[]).includes(key)) return action as TeleprompterAction
  }

  return null
}

export function useTeleprompterKeys(options: UseTeleprompterKeysOptions) {
  const {
    active,
    containerRef,
    onScrollUp,
    onScrollDown,
    onSpeedDown,
    onSpeedUp,
    onTogglePlayPause,
  } = options

  const cbRef = useRef({
    onScrollUp,
    onScrollDown,
    onSpeedDown,
    onSpeedUp,
    onTogglePlayPause,
  })
  const activeRef = useRef(active)

  useEffect(() => {
    cbRef.current = { onScrollUp, onScrollDown, onSpeedDown, onSpeedUp, onTogglePlayPause }
  }, [onScrollUp, onScrollDown, onSpeedDown, onSpeedUp, onTogglePlayPause])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  const triggerAction = useCallback((action: TeleprompterAction) => {
    switch (action) {
      case 'scrollUp':
        cbRef.current.onScrollUp?.()
        break
      case 'scrollDown':
        cbRef.current.onScrollDown?.()
        break
      case 'speedDown':
        cbRef.current.onSpeedDown?.()
        break
      case 'speedUp':
        cbRef.current.onSpeedUp?.()
        break
      case 'togglePlayPause':
        cbRef.current.onTogglePlayPause?.()
        break
    }
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!activeRef.current || isTypingTarget(event.target)) return

    const action = resolveActionByKey(event.key) ?? KEYCODE_MAP[event.keyCode] ?? null
    if (!action) return

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    triggerAction(action)
  }, [triggerAction])

  useEffect(() => {
    const opts = { capture: true, passive: false } as AddEventListenerOptions
    window.addEventListener('keydown', handleKeyDown, opts)
    document.addEventListener('keydown', handleKeyDown, opts)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, opts)
      document.removeEventListener('keydown', handleKeyDown, opts)
    }
  }, [handleKeyDown])

  useEffect(() => {
    if (!active) return
    const el = containerRef?.current
    if (!el) return

    const tid = window.setTimeout(() => el.focus({ preventScroll: true }), 200)
    return () => window.clearTimeout(tid)
  }, [active, containerRef])

  useEffect(() => {
    if (!active) return

    let animationFrameId = 0
    const prevButtonStates = new Map<string, boolean | string>()

    const pollGamepads = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : []

      for (const gamepad of gamepads) {
        if (!gamepad) continue

        gamepad.buttons.forEach((button, index) => {
          const key = `${gamepad.index}-${index}`
          const wasPressed = Boolean(prevButtonStates.get(key))

          if (button.pressed && !wasPressed) {
            let action: TeleprompterAction | null = null
            if (index === 12) action = 'scrollUp'
            if (index === 13) action = 'scrollDown'
            if ([14, 4].includes(index)) action = 'speedDown'
            if ([15, 5].includes(index)) action = 'speedUp'
            if ([0, 1, 2, 3, 9].includes(index)) action = 'togglePlayPause'
            if (action) triggerAction(action)
          }

          prevButtonStates.set(key, button.pressed)
        })

        gamepad.axes.forEach((axisValue, index) => {
          const isPushed = Math.abs(axisValue) > 0.5
          const direction = axisValue < -0.5 ? 'neg' : axisValue > 0.5 ? 'pos' : 'center'
          const key = `axis-${gamepad.index}-${index}`
          const prevDir = prevButtonStates.get(key) || 'center'

          if (isPushed && prevDir === 'center') {
            let action: TeleprompterAction | null = null
            if (index === 0) action = direction === 'neg' ? 'speedDown' : 'speedUp'
            if (index === 1) action = direction === 'neg' ? 'scrollUp' : 'scrollDown'
            if (action) triggerAction(action)
          }

          prevButtonStates.set(key, isPushed ? direction : 'center')
        })
      }

      animationFrameId = requestAnimationFrame(pollGamepads)
    }

    animationFrameId = requestAnimationFrame(pollGamepads)
    return () => cancelAnimationFrame(animationFrameId)
  }, [active, triggerAction])
}
