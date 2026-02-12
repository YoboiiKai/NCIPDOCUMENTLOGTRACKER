'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'

interface EmptyStateProps {
  searchTerm: string
  onAddClick: () => void
}

export default function EmptyState({ searchTerm, onAddClick }: EmptyStateProps) {
  return (
    <Card className="p-12 md:p-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <FileText size={40} className="text-primary/60" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {searchTerm ? 'No documents found' : 'No documents yet'}
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {searchTerm
          ? 'Try adjusting your search terms or filters to find what you are looking for.'
          : 'Start by adding your first document to the system.'}
      </p>

      <Button
        onClick={onAddClick}
        className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
      >
        <Plus size={20} />
        Add First Document
      </Button>
    </Card>
  )
}
