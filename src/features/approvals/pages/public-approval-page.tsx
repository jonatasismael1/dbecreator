import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicApproval } from '../hooks/use-approvals'
import { CheckCircle2, XCircle, Send, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PublicApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const { approval, comments, isLoading, isError, updateStatus, addComment } = usePublicApproval(token || '')
  
  const [commentText, setCommentText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [hasStartedCommenting, setHasStartedCommenting] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dbe-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-dbe-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !approval) {
    return (
      <div className="min-h-screen bg-dbe-dark flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full p-8 border border-dbe-border bg-dbe-navy rounded-xl">
          <AlertTriangle className="h-12 w-12 text-dbe-red mx-auto mb-4" />
          <h1 className="text-xl font-bold text-dbe-text mb-2">Link Inválido ou Expirado</h1>
          <p className="text-dbe-muted">
            Este link de aprovação não existe ou já expirou. Solicite um novo link ao criador de conteúdo.
          </p>
        </div>
      </div>
    )
  }

  const handleApprove = () => {
    if (confirm('Tem certeza que deseja aprovar este roteiro?')) {
      updateStatus.mutate('approved')
    }
  }

  const handleRequestChanges = () => {
    if (confirm('Deseja solicitar alterações neste roteiro? Lembre-se de deixar um comentário explicando o que deve ser mudado.')) {
      updateStatus.mutate('requested_changes')
    }
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !authorName.trim()) return
    
    addComment.mutate({ content: commentText, authorName }, {
      onSuccess: () => {
        setCommentText('')
      }
    })
  }

  return (
    <div className="min-h-screen bg-dbe-dark text-dbe-text p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Script Viewer */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between border-b border-dbe-border pb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{approval.script?.title || 'Sem título'}</h1>
              <p className="text-sm text-dbe-muted">
                Para revisão de {approval.client_name}
              </p>
            </div>
            
            {/* Status Badge */}
            {approval.status === 'approved' && (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Aprovado
              </span>
            )}
            {approval.status === 'requested_changes' && (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium">
                <XCircle className="h-4 w-4" /> Aguardando Ajustes
              </span>
            )}
            {approval.status === 'pending' && (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-sm font-medium">
                Pendente
              </span>
            )}
          </div>

          <div className="space-y-6 bg-dbe-navy p-6 rounded-xl border border-dbe-border">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-amber-500 font-bold mb-2">Gancho (3s)</h3>
              <p className="whitespace-pre-wrap">{approval.script?.hook}</p>
            </div>
            
            <div className="h-px bg-dbe-border/50" />
            
            <div>
              <h3 className="text-xs uppercase tracking-wider text-dbe-blue font-bold mb-2">Desenvolvimento</h3>
              <p className="whitespace-pre-wrap">{approval.script?.body}</p>
            </div>
            
            <div className="h-px bg-dbe-border/50" />
            
            <div>
              <h3 className="text-xs uppercase tracking-wider text-green-500 font-bold mb-2">Call to Action</h3>
              <p className="whitespace-pre-wrap">{approval.script?.cta}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          {approval.status === 'pending' && (
            <div className="flex gap-4 pt-4">
              <Button 
                variant="secondary" 
                className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                onClick={handleRequestChanges}
              >
                <XCircle className="h-4 w-4 mr-2" /> Solicitar Alteração
              </Button>
              <Button 
                className="flex-1 bg-green-500 hover:bg-green-600 text-black"
                onClick={handleApprove}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Aprovar Roteiro
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Comments */}
        <div className="w-full md:w-80 flex flex-col h-[calc(100vh-4rem)] sticky top-8">
          <div className="bg-dbe-navy border border-dbe-border rounded-xl flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-dbe-border bg-black/20">
              <h2 className="font-semibold">Comentários e Feedbacks</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-dbe-muted text-center py-8">
                  Nenhum comentário ainda. Deixe seu feedback sobre o roteiro.
                </p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="bg-black/20 p-3 rounded-lg border border-dbe-border/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-dbe-blue">{comment.author_name}</span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-dbe-border bg-black/20">
              <form onSubmit={handleAddComment} className="space-y-3">
                {!hasStartedCommenting && (
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    onFocus={() => setHasStartedCommenting(true)}
                    placeholder="Seu Nome"
                    required
                    className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-2 text-sm text-dbe-text focus:outline-none focus:border-dbe-blue"
                  />
                )}
                
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário..."
                  rows={3}
                  required
                  className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-3 py-2 text-sm text-dbe-text focus:outline-none focus:border-dbe-blue resize-none"
                />
                
                <Button 
                  type="submit" 
                  size="sm" 
                  className="w-full"
                  disabled={addComment.isPending || !commentText.trim()}
                >
                  <Send className="h-3 w-3 mr-2" /> Enviar Feedback
                </Button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
