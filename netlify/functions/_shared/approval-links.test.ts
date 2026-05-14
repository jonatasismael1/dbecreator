import { describe, expect, it } from 'vitest'
import { ApiError } from './responses'
import { assertUuid, buildPublicApprovalUrl, normalizeClientName } from './approval-links'

describe('approval link helpers', () => {
  it('validates UUID values used for script lookup', () => {
    expect(assertUuid('2d853c8f-d9c1-47a4-8994-4e21b8bb9df9', 'script_id')).toBe('2d853c8f-d9c1-47a4-8994-4e21b8bb9df9')
  })

  it('rejects invalid UUID values with an API error', () => {
    expect(() => assertUuid('not-a-uuid', 'script_id')).toThrow(ApiError)
  })

  it('requires a real client name', () => {
    expect(normalizeClientName('  Maria  ')).toBe('Maria')
    expect(() => normalizeClientName('A')).toThrow(ApiError)
  })

  it('builds public approval URLs from the current app origin when no app URL is configured', () => {
    const configuredUrl = process.env.VITE_APP_URL
    delete process.env.VITE_APP_URL

    expect(buildPublicApprovalUrl('abc123', 'https://preview.example.com/api/approvals/generate-link')).toBe('https://preview.example.com/aprovacao/abc123')

    if (configuredUrl === undefined) delete process.env.VITE_APP_URL
    else process.env.VITE_APP_URL = configuredUrl
  })
})
