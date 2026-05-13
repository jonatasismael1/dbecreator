export type TeleprompterTextAlign = 'center' | 'justify' | 'left' | 'right'

export interface TeleprompterSettings {
  speed: number
  fontSize: number
  lineHeight: number
  width: number
  isMirrored: boolean
  enableCountdown: boolean
  textAlign: TeleprompterTextAlign
  theme: 'dark' | 'light'
  bgColor: string
  textColor: string
}
