import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useMaterials } from '../hooks/use-materials'
import { MaterialCard } from '../components/material-card'
import { MaterialModal } from '../components/material-modal'
import type { Material, MaterialType } from '../types/material.types'

export function MaterialsPage() {
  const { materials, isLoading, createMaterial, updateMaterial, deleteMaterial } = useMaterials()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'all'>('all')

  const handleOpenModal = (material?: Material) => {
    setEditingMaterial(material || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setEditingMaterial(null)
    setIsModalOpen(false)
  }

  const handleSaveMaterial = async (data: any) => {
    if (editingMaterial) {
      await updateMaterial.mutateAsync({ id: editingMaterial.id, dto: data })
    } else {
      await createMaterial.mutateAsync(data)
    }
    handleCloseModal()
  }

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      await deleteMaterial.mutateAsync(id)
    }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === 'all' || material.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader 
          title="Biblioteca de Materiais" 
          description="Centralize suas referências, links, áudios e anotações."
        />
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Material
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dbe-muted" />
          <input
            type="text"
            placeholder="Buscar por título ou tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dbe-navy border border-dbe-border rounded-lg pl-10 pr-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dbe-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MaterialType | 'all')}
            className="w-full bg-dbe-navy border border-dbe-border rounded-lg pl-10 pr-8 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors appearance-none"
          >
            <option value="all">Todos os tipos</option>
            <option value="link">Links</option>
            <option value="file">Arquivos</option>
            <option value="audio">Áudios</option>
            <option value="video">Vídeos</option>
            <option value="image">Imagens</option>
            <option value="note">Notas</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-dbe-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Filter}
            title={materials.length === 0 ? "Nenhum material salvo" : "Nenhum resultado encontrado"}
            description={materials.length === 0 ? "Salve referências, links e anotações para sua criação." : "Tente ajustar seus filtros de busca."}
            action={materials.length === 0 ? {
              label: "Adicionar Material",
              onClick: () => handleOpenModal()
            } : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              onEdit={handleOpenModal}
              onDelete={handleDeleteMaterial}
            />
          ))}
        </div>
      )}

      <MaterialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMaterial}
        material={editingMaterial}
        isLoading={createMaterial.isPending || updateMaterial.isPending}
      />
    </div>
  )
}
