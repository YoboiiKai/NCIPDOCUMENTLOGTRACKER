'use client'

import { useState, useEffect } from 'react'
import { Document, getDocuments, DocumentCategory } from '@/lib/document-store'
import AddDocumentModal from '@/components/dashboard/add-document-modal'
import SearchAndFilter from '@/components/dashboard/search-and-filter'
import CategoryTabs from '@/components/dashboard/category-tabs'
import EmptyState from '@/components/dashboard/empty-state'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'All' | 'Pickup/Delivery'>('All')
  const [loading, setLoading] = useState(true)

  // Load documents on mount
  useEffect(() => {
    const docs = getDocuments()
    setDocuments(docs)
    setFilteredDocuments(docs)
    setLoading(false)
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = documents

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(term) ||
          doc.referenceNumber.toLowerCase().includes(term) ||
          doc.notes.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((doc) => doc.status === statusFilter)
    }

    if (categoryFilter !== 'All') {
      if (categoryFilter === 'Pickup/Delivery') {
        filtered = filtered.filter(
          (doc) => doc.category === 'Pick-up' || doc.category === 'Personal Delivery'
        )
      } else {
        filtered = filtered.filter((doc) => doc.category === categoryFilter)
      }
    }

    setFilteredDocuments(filtered)
  }, [documents, searchTerm, statusFilter, categoryFilter])

  const handleAddDocument = () => {
    const docs = getDocuments()
    setDocuments(docs)
  }

  const handleDeleteDocument = () => {
    const docs = getDocuments()
    setDocuments(docs)
  }

  const handleEditDocument = () => {
    const docs = getDocuments()
    setDocuments(docs)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0A2D55] via-[#0C3B6E] to-[#0A2D55] p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Document Logs</h1>
            <p className="text-white/80 mt-1">
              Manage and track all your documents in one place
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Document
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs selectedCategory={categoryFilter} onCategoryChange={setCategoryFilter} />

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddDocument}
      />
    </div>
  )
}
