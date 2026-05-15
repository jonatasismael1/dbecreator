import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  disabled?: boolean
}

const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
]

export function RichTextEditor({ value, onChange, placeholder, minHeight = 120, disabled = false }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled)
    }
  }, [disabled])

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return

    const editor = document.createElement('div')
    containerRef.current.appendChild(editor)

    const quill = new Quill(editor, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: toolbarOptions },
    })

    quill.root.style.minHeight = `${minHeight}px`
    quill.root.innerHTML = value || ''
    quill.on('text-change', () => {
      const html = quill.root.innerHTML
      onChangeRef.current(html === '<p><br></p>' ? '' : html)
    })
    quillRef.current = quill
  }, [minHeight, placeholder, value])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return
    const nextValue = value || ''
    if (quill.root.innerHTML !== nextValue) {
      const selection = quill.getSelection()
      quill.root.innerHTML = nextValue
      if (selection) quill.setSelection(selection)
    }
  }, [value])

  return <div ref={containerRef} className="rich-text-editor overflow-hidden rounded-lg border border-dbe-border bg-dbe-dark text-dbe-text" />
}
