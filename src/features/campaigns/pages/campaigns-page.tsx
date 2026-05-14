import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Target, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useWorkspaceContext } from '@/features/workspaces/context/workspace-context'
import { usePillars } from '@/features/pillars/hooks/use-pillars'
import { ScriptModal } from '@/features/scripts/components/script-modal'
import { useCreateScript, useScriptVersions, useUpdateScript } from '@/features/scripts/hooks/use-scripts'
import { stripHtml } from '@/features/scripts/utils/script-content'
import { useCampaigns } from '../hooks/use-campaigns'
import { CampaignCard } from '../components/campaign-card'
import { CampaignModal } from '../components/campaign-modal'
import { useBatchApprovals } from '@/features/approvals/hooks/use-batch-approvals'
import type { Campaign, CreateCampaignDTO } from '../types/campaign.types'
import type { CreateScriptDTO, Script } from '@/features/scripts/types/script.types'

export function CampaignsPage() {
  const navigate = useNavigate()
  const { workspaceId } = useWorkspaceContext()
  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign } = useCampaigns()
  const { data: pillars = [] } = usePillars(workspaceId)
  const createScript = useCreateScript(workspaceId)
  const updateScript = useUpdateScript(workspaceId)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scriptModalOpen, setScriptModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null
  const { data: versions = [], isLoading: versionsLoading } = useScriptVersions(workspaceId, editingScript?.id)

  const handleOpenModal = (campaign?: Campaign) => {
    setEditingCampaign(campaign || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setEditingCampaign(null)
    setIsModalOpen(false)
  }

  const handleSaveCampaign = async (data: CreateCampaignDTO) => {
    if (editingCampaign) {
      await updateCampaign.mutateAsync({ id: editingCampaign.id, dto: data })
    } else {
      await createCampaign.mutateAsync(data)
    }
    handleCloseModal()
  }

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha? Todos os vínculos com roteiros serão desfeitos, mas os roteiros não serão apagados.')) {
      await deleteCampaign.mutateAsync(id)
      if (selectedCampaignId === id) setSelectedCampaignId(null)
    }
  }

  const handleCreateScript = async (data: CreateScriptDTO) => {
    if (editingScript) {
      await updateScript.mutateAsync({ id: editingScript.id, dto: data })
      setEditingScript(null)
    } else {
      await createScript.mutateAsync({
        ...data,
        campaign_id: selectedCampaignId,
      })
    }
    setScriptModalOpen(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader 
          title="Campanhas" 
          description="Agrupe seus conteúdos por objetivos de negócio."
        />
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova campanha
        </Button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-dbe-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Target}
            title="Nenhuma campanha criada"
            description="Agrupe roteiros e defina metas para lançamentos, promoções ou objetivos específicos."
            action={{
              label: "Criar primeira campanha",
              onClick: () => handleOpenModal()
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onOpen={(item) => setSelectedCampaignId(item.id)}
              onEdit={handleOpenModal}
              onDelete={handleDeleteCampaign}
            />
          ))}
        </div>
      )}

      <CampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCampaign}
        campaign={editingCampaign}
        isLoading={createCampaign.isPending || updateCampaign.isPending}
      />

      {selectedCampaign && (
        <CampaignDetails
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaignId(null)}
          onCreateScript={() => setScriptModalOpen(true)}
          onViewScript={(script) => navigate(`/scripts/${script.id}`)}
          onEditScript={(script) => {
            setEditingScript(script)
            setScriptModalOpen(true)
          }}
        />
      )}

      <ScriptModal
        key={editingScript?.id ?? selectedCampaignId ?? 'campaign-script'}
        open={scriptModalOpen}
        script={editingScript}
        pillars={pillars.filter((pillar) => pillar.is_active)}
        campaigns={campaigns}
        initialCampaignId={selectedCampaignId}
        versions={versions}
        versionsLoading={versionsLoading}
        onClose={() => {
          setScriptModalOpen(false)
          setEditingScript(null)
        }}
        onSave={handleCreateScript}
      />
    </div>
  )
}

function CampaignDetails({
  campaign,
  onClose,
  onCreateScript,
  onViewScript,
  onEditScript,
}: {
  campaign: Campaign
  onClose: () => void
  onCreateScript: () => void
  onViewScript: (script: Script) => void
  onEditScript: (script: Script) => void
}) {
  const scripts = campaign.scripts ?? []
  const { createBatch } = useBatchApprovals()
  const [approvalLink, setApprovalLink] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pillarFilter, setPillarFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at')
  const visibleScripts = scripts
    .filter((script) => statusFilter === 'all' || script.status === statusFilter)
    .filter((script) => pillarFilter === 'all' || script.content_pillar_id === pillarFilter)
    .sort((a, b) => sortBy === 'title' ? a.title.localeCompare(b.title) : new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const pillars = Array.from(
    new Map(scripts.map((script) => script.content_pillars).filter(Boolean).map((pillar) => [pillar!.id, pillar!])).values(),
  )

  const handleSendToApproval = async () => {
    if (scripts.length === 0) return
    const scriptIds = scripts.map((s) => s.id)
    const batch = await createBatch.mutateAsync({ campaignId: campaign.id, scriptIds })
    const link = `${window.location.origin}/aprovacao/lote/${batch.token}`
    setApprovalLink(link)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl p-5 sm:max-w-3xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <Badge variant="blue" className="mb-2">{scripts.length} roteiros</Badge>
            <h2 className="text-xl font-bold text-dbe-text">{campaign.title}</h2>
            {campaign.description && <p className="mt-1 text-sm text-dbe-muted">{campaign.description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-dbe-muted transition-colors hover:bg-white/5 hover:text-dbe-text" aria-label="Fechar detalhes da campanha">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-dbe-border py-4">
          <div>
            <p className="text-xs uppercase text-dbe-muted">Objetivo</p>
            <p className="text-sm text-dbe-text">{campaign.goal || 'Sem objetivo definido'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleSendToApproval} loading={createBatch.isPending} disabled={scripts.length === 0}>
              Enviar campanha para aprovação
            </Button>
            <Button size="sm" onClick={onCreateScript}>
              <Plus className="h-4 w-4" />
              Criar roteiro nesta campanha
            </Button>
          </div>
        </div>

        {approvalLink && (
          <div className="mb-5 rounded-lg border border-dbe-green/30 bg-dbe-green/10 p-4">
            <h4 className="mb-2 text-sm font-semibold text-dbe-green">Link de aprovação gerado!</h4>
            <div className="flex gap-2">
              <input type="text" readOnly value={approvalLink} className="flex-1 rounded border border-dbe-green/20 bg-black/20 px-3 py-1.5 text-xs text-dbe-green outline-none" />
              <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(approvalLink); alert('Copiado!') }}>
                Copiar
              </Button>
            </div>
          </div>
        )}

        {scripts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum roteiro nesta campanha"
            description="Crie um roteiro vinculado para manter a campanha organizada."
            action={{ label: 'Criar roteiro', onClick: onCreateScript }}
          />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 rounded-lg border border-dbe-border bg-dbe-dark/40 p-3 sm:grid-cols-3">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-dbe-border bg-dbe-dark px-3 py-2 text-sm text-dbe-text outline-none">
                <option value="all">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="ready">Pronto</option>
                <option value="in_approval">Em aprovacao</option>
                <option value="approved">Aprovado</option>
                <option value="changes_requested">Ajuste solicitado</option>
                <option value="recorded">Gravado</option>
              </select>
              <select value={pillarFilter} onChange={(event) => setPillarFilter(event.target.value)} className="rounded-lg border border-dbe-border bg-dbe-dark px-3 py-2 text-sm text-dbe-text outline-none">
                <option value="all">Todos os pilares</option>
                {pillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>{pillar.title}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'created_at' | 'title')} className="rounded-lg border border-dbe-border bg-dbe-dark px-3 py-2 text-sm text-dbe-text outline-none">
                <option value="created_at">Mais recentes</option>
                <option value="title">Titulo</option>
              </select>
            </div>

            {visibleScripts.map((script) => (
              <div key={script.id} className="rounded-lg border border-dbe-border bg-dbe-dark/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-dbe-text">{script.title}</h3>
                  <Badge variant={script.status === 'approved' || script.status === 'recorded' ? 'success' : 'default'}>
                    {getScriptStatusLabel(script.status)}
                  </Badge>
                </div>
                {script.content_pillars && (
                  <p className="mt-1 text-xs text-dbe-muted">Pilar: {script.content_pillars.title}</p>
                )}
                <p className="mt-2 line-clamp-2 text-sm text-dbe-muted">{stripHtml(script.hook)}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onViewScript(script)}>Visualizar</Button>
                  <Button size="sm" onClick={() => onEditScript(script)}>Editar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function getScriptStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    ready: 'Pronto',
    in_approval: 'Enviado para aprovação',
    approved: 'Aprovado',
    changes_requested: 'Ajuste solicitado',
    recorded: 'Gravado',
  }

  return labels[status] ?? status
}
