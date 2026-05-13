import { useState } from 'react'
import { Link2, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApprovals } from '../hooks/use-approvals'
import { useScripts } from '@/features/scripts/hooks/use-scripts'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import type { ApprovalStatus } from '../types/approval.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  requested_changes: { label: 'Alterações', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
}

export function ApprovalsPage() {
  const { workspaceId } = useWorkspaceContext()
  const { approvals, isLoading, createApproval, deleteApproval } = useApprovals()
  const { data: scripts = [] } = useScripts(workspaceId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedScript, setSelectedScript] = useState('')
  const [clientName, setClientName] = useState('')
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScript) return
    
    // Default expiration: 7 days from now
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    
    await createApproval.mutateAsync({
      script_id: selectedScript,
      client_name: clientName || 'Cliente',
      client_email: null,
      expires_at: expires.toISOString(),
    })
    
    setIsModalOpen(false)
    setSelectedScript('')
    setClientName('')
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/approval/${token}`
    navigator.clipboard.writeText(url)
    alert('Link copiado para a área de transferência!')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader 
          title="Aprovações de Clientes" 
          description="Gere links públicos temporários para enviar seus roteiros para revisão externa."
        />
        <Button onClick={() => setIsModalOpen(true)}>
          Gerar Novo Link
        </Button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-dbe-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Link2}
            title="Nenhum link gerado"
            description="Crie links de acesso para que clientes possam visualizar e comentar seus roteiros sem precisar de login."
            action={{
              label: "Gerar Link",
              onClick: () => setIsModalOpen(true)
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvals.map(approval => {
            const config = STATUS_CONFIG[approval.status]
            const StatusIcon = config.icon
            
            return (
              <Card key={approval.id} className="p-5 flex flex-col relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="default" className={`font-normal flex items-center gap-1 ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                  <button 
                    onClick={() => deleteApproval.mutateAsync(approval.id)}
                    className="p-1.5 text-dbe-muted hover:text-dbe-red bg-white/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <h3 className="font-semibold text-dbe-text mb-1 truncate" title={approval.script?.title}>
                  {approval.script?.title || 'Roteiro Excluído'}
                </h3>
                <p className="text-sm text-dbe-muted mb-6">
                  Enviado para: <span className="text-dbe-text">{approval.client_name}</span>
                </p>
                
                <div className="mt-auto border-t border-dbe-border pt-4 flex items-center justify-between">
                  <div className="text-xs text-dbe-muted">
                    Gerado em: {format(new Date(approval.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => copyLink(approval.token)}>
                    <Link2 className="h-3.5 w-3.5 mr-2" />
                    Copiar Link
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Basic Create Modal Inline */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dbe-navy border border-dbe-border rounded-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-dbe-text mb-4">Gerar Link de Aprovação</h2>
              
              <form id="create-approval-form" onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dbe-text mb-1">Roteiro</label>
                  <select
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    required
                    className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors appearance-none"
                  >
                    <option value="" disabled>Selecione um roteiro...</option>
                    {scripts.filter((s: any) => s.status === 'ready' || s.status === 'draft').map((script: any) => (
                      <option key={script.id} value={script.id}>{script.title}</option>
                    ))}
                  </select>
                </div>

                
                <div>
                  <label className="block text-sm font-medium text-dbe-text mb-1">Nome do Cliente/Aprovador</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                    placeholder="Ex: João Silva"
                  />
                </div>
                
                <p className="text-xs text-dbe-muted mt-2">
                  O link gerado será válido por 7 dias. Qualquer pessoa com o link poderá visualizar o roteiro e deixar comentários.
                </p>
              </form>
            </div>
            
            <div className="p-4 border-t border-dbe-border flex justify-end gap-3 bg-dbe-navy">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" form="create-approval-form" disabled={createApproval.isPending}>
                Gerar Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
