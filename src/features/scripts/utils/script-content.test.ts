import { describe, expect, it } from 'vitest'
import { stripHtml } from './script-content'

describe('script content helpers', () => {
  it('strips rich text markup for teleprompter and exports', () => {
    expect(stripHtml('<p>Gancho <strong>forte</strong></p>')).toBe('Gancho forte')
  })

  it('keeps plain text untouched', () => {
    expect(stripHtml('linha 1\nlinha 2')).toBe('linha 1\nlinha 2')
  })
})
