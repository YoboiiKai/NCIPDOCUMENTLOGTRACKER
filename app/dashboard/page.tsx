'use client'

import { useState, useEffect, useRef } from 'react'
import { Document, getDocuments, DocumentCategory, saveDocuments, addDocument } from '@/lib/document-store'
import AddDocumentModal from '@/components/dashboard/add-document-modal'
import SearchAndFilter from '@/components/dashboard/search-and-filter'
import CategoryTabs from '@/components/dashboard/category-tabs'
import EmptyState from '@/components/dashboard/empty-state'
import DocumentTable from '@/components/dashboard/document-table'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'All' | 'Pickup/Delivery'>('All')
  const [loading, setLoading] = useState(true)
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Load documents on mount
  useEffect(() => {
    const docs = getDocuments()
    if (docs && docs.length > 0) {
      // normalize documents to ensure new fields exist (migrate older stored items)
      const normalized = docs.map((doc) => ({
        ...doc,
        to: (doc as any).to || 'Unknown',
        signatory: (doc as any).signatory || 'Unknown',
        subject: (doc as any).subject || doc.title,
        dotsNo: (doc as any).dotsNo || doc.referenceNumber,
        dateReleased: (doc as any).dateReleased || doc.date,
        remarksCourier: (doc as any).remarksCourier || '-',
        trackingNumber: (doc as any).trackingNumber || doc.referenceNumber,
        dateMailed: (doc as any).dateMailed || doc.date,
      }))
      setDocuments(normalized)
      setFilteredDocuments(normalized)
      try {
        saveDocuments(normalized)
      } catch (e) {}
    } else {
      // fallback mock data when no stored documents
        const mock: Document[] = [
        {
          id: '1',
          title: 'Land Title Transfer',
          referenceNumber: 'LT-2026-001',
          date: new Date().toISOString(),
          status: 'Pending',
          notes: 'Urgent processing required',
          category: 'Registered',
          to: 'Office of Records',
          signatory: 'A. Santos',
          subject: 'Title transfer for Lot 12',
          dotsNo: 'DOTS-001',
          dateReleased: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          remarksCourier: 'LBC',
          trackingNumber: 'LBC-555-001',
          dateMailed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        },
        {
          id: '2',
          title: 'Parcel Delivery',
          referenceNumber: 'PD-2026-042',
          date: new Date().toISOString(),
          status: 'Approved',
          notes: 'Delivered to client',
          category: 'Pick-up',
          to: 'Client Services',
          signatory: 'R. dela Cruz',
          subject: 'Parcel for Client X',
          dotsNo: 'DOTS-042',
          dateReleased: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          remarksCourier: 'JRS',
          trackingNumber: 'JRS-2026-042',
          dateMailed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        },
        {
          id: '3',
          title: 'Email Correspondence',
          referenceNumber: 'EM-2026-100',
          date: new Date().toISOString(),
          status: 'Archived',
          notes: 'Archived after 1 year',
          category: 'Email',
          to: 'Records Archive',
          signatory: 'M. Reyes',
          subject: 'Monthly report submission',
          dotsNo: 'DOTS-100',
          dateReleased: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          remarksCourier: 'Email Service',
          trackingNumber: 'EM-2026-100',
          dateMailed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 29).toISOString(),
        },
      ]
      setDocuments(mock)
      setFilteredDocuments(mock)
      // persist initial mock data so table shows on subsequent loads
      try {
        saveDocuments(mock)
      } catch (e) {
        // ignore storage errors in non-browser environments
      }
    }
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

  const handleUpdateDocument = () => {
    const docs = getDocuments()
    setDocuments(docs)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        const rows: Document[] = Array.isArray(parsed) ? parsed : [parsed]
        rows.forEach((doc) => addDocument(doc))
        const updated = getDocuments()
        setDocuments(updated)
      } catch {
        setImportError('Invalid JSON file. Please export documents first and re-import.')
      }
    }
    reader.readAsText(file)
    // reset so the same file can be re-imported
    e.target.value = ''
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0A2D55] via-[#0C3B6E] to-[#0A2D55] p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Document Logs</h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              Manage and track all your documents in one place
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => importInputRef.current?.click()}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 font-semibold gap-2 w-full sm:w-auto text-sm sm:text-base"
            >
              <Upload size={16} className="sm:w-4 sm:h-4" />
              Import JSON
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              Add Document
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>

      {/* Import error banner */}
      {importError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
          <span>{importError}</span>
          <button type="button" onClick={() => setImportError(null)} className="ml-3 hover:text-red-900 font-bold text-base leading-none">&times;</button>
        </div>
      )}

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Category Tabs + Table (no gap) */}
      <div className="space-y-0">
        <CategoryTabs selectedCategory={categoryFilter} onCategoryChange={setCategoryFilter} />
        <DocumentTable documents={filteredDocuments} onUpdate={handleUpdateDocument} />
      </div>

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddDocument}
      />
    </div>
  )
}
