import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useCampaigns } from '../hooks/use-campaigns'
import { CampaignCard } from '../components/campaign-card'
import { CampaignModal } from '../components/campaign-modal'
import type { Campaign, CreateCampaignDTO } from '../types/campaign.types'

export function CampaignsPage() {
  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign } = useCampaigns()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

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
    }
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
          Nova Campanha
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
    </div>
  )
}
