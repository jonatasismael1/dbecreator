import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import type { Script } from '../types/script.types'

export interface ScriptExportOptions {
  includeCover: boolean
  includePillar: boolean
  includeScore: boolean
}

export const DEFAULT_SCRIPT_EXPORT_OPTIONS: ScriptExportOptions = {
  includeCover: true,
  includePillar: true,
  includeScore: true,
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const withLineBreaks = (value: string) => escapeHtml(value).replace(/\n/g, '<br>')

function getFilename(script: Script, extension: string) {
  const slug = script.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()

  return `DBE-${slug || 'roteiro'}.${extension}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getScriptPlainText(script: Script) {
  return [
    `ROTEIRO: ${script.title || 'Sem titulo'}`,
    script.content_pillars ? `Pilar: ${script.content_pillars.title}` : '',
    script.last_analysis_score !== null ? `Score Deby: ${script.last_analysis_score}/10` : '',
    '',
    `Gancho:\n${script.hook || '-'}`,
    '',
    `Desenvolvimento:\n${script.body || '-'}`,
    '',
    `CTA:\n${script.cta || '-'}`,
  ].filter(Boolean).join('\n')
}

export function generateScriptHTML(script: Script, options: Partial<ScriptExportOptions> = {}) {
  const resolved = { ...DEFAULT_SCRIPT_EXPORT_OPTIONS, ...options }
  const pillarColor = script.content_pillars?.color || '#2563EB'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DBE - ${escapeHtml(script.title)}</title>
  <style>
    :root {
      --blue: #2563EB;
      --green: #10B981;
      --ink: #101827;
      --muted: #64748B;
      --paper: #F8FAFC;
      --line: #E2E8F0;
      --pillar: ${pillarColor};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--ink);
      background: var(--paper);
      line-height: 1.55;
    }
    .page { width: min(960px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 60px; }
    .hero, .card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: 0 18px 54px rgba(15, 23, 42, .08);
    }
    .hero { padding: 34px; margin-bottom: 22px; }
    .eyebrow {
      display: inline-flex;
      padding: 7px 11px;
      border-radius: 999px;
      background: rgba(16, 185, 129, .1);
      color: var(--green);
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    h1 { margin: 0; color: var(--blue); font-size: clamp(32px, 5vw, 58px); line-height: 1.05; }
    .meta { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; }
    .pill { padding: 9px 13px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-weight: 700; font-size: 13px; }
    .card { padding: 26px; margin-bottom: 18px; break-inside: avoid; }
    .label { color: var(--blue); font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; margin-bottom: 8px; }
    p { margin: 0; font-size: 17px; }
    .footer { text-align: center; margin-top: 32px; color: var(--muted); font-size: 13px; }
    @media print {
      body { background: #fff; }
      .page { width: 100%; padding: 0; }
      .hero, .card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    ${resolved.includeCover ? `
    <header class="hero">
      <div class="eyebrow">Roteiro DBE Creator</div>
      <h1>${escapeHtml(script.title)}</h1>
      <div class="meta">
        <span class="pill">Status: ${escapeHtml(script.status)}</span>
        ${resolved.includePillar && script.content_pillars ? `<span class="pill">Pilar: ${escapeHtml(script.content_pillars.title)}</span>` : ''}
        ${resolved.includeScore && script.last_analysis_score !== null ? `<span class="pill">Score Deby: ${script.last_analysis_score}/10</span>` : ''}
      </div>
    </header>` : ''}
    <article class="card"><div class="label">Gancho</div><p>${withLineBreaks(script.hook || '-')}</p></article>
    <article class="card"><div class="label">Desenvolvimento</div><p>${withLineBreaks(script.body || '-')}</p></article>
    <article class="card"><div class="label">CTA</div><p>${withLineBreaks(script.cta || '-')}</p></article>
    <footer class="footer">DBE - Dos Bastidores ao Espetaculo</footer>
  </main>
</body>
</html>`
}

export function downloadScriptHtml(script: Script, options?: Partial<ScriptExportOptions>) {
  const html = generateScriptHTML(script, options)
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), getFilename(script, 'html'))
}

export function printScriptAsPdf(script: Script, options?: Partial<ScriptExportOptions>) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  printWindow.document.write(generateScriptHTML(script, options))
  printWindow.document.close()
  printWindow.onload = () => printWindow.print()
  return true
}

export async function downloadScriptDocx(script: Script, options: Partial<ScriptExportOptions> = {}) {
  const resolved = { ...DEFAULT_SCRIPT_EXPORT_OPTIONS, ...options }
  const children: Paragraph[] = []

  if (resolved.includeCover) {
    children.push(
      new Paragraph({
        text: script.title || 'Roteiro DBE',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: 'DBE Creator',
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '' }),
    )
  }

  if (resolved.includePillar && script.content_pillars) {
    children.push(new Paragraph(`Pilar: ${script.content_pillars.title}`))
  }

  if (resolved.includeScore && script.last_analysis_score !== null) {
    children.push(new Paragraph(`Score Deby: ${script.last_analysis_score}/10`))
  }

  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'Gancho', bold: true })] }),
    new Paragraph(script.hook || '-'),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'Desenvolvimento', bold: true })] }),
    new Paragraph(script.body || '-'),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'CTA', bold: true })] }),
    new Paragraph(script.cta || '-'),
  )

  const doc = new Document({ sections: [{ properties: {}, children }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, getFilename(script, 'docx'))
}
