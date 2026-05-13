import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Em construção"
        description={`O módulo "${title}" será implementado nas próximas etapas do roadmap.`}
      />
    </div>
  )
}
