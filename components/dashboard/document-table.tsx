"use client"

import React, { useState } from 'react'
import { Document } from '@/lib/document-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import EditDocumentModal from './edit-document-modal'
import DeleteDocumentModal from './delete-document-modal'

interface Props {
  documents: Document[]
  onUpdate?: () => void
}

export default function DocumentTable({ documents, onUpdate }: Props) {
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  const handleUpdate = () => {
    setEditingDocId(null)
    setDeletingDocId(null)
    onUpdate?.()
  }
  return (
    <div className="rounded-t-none w-full shadow-md border-t-0 bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-accent border-b-2 border-accent-foreground/20">
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">To</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">Signatory</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">Subject</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">DOTS No.</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">Released / Courier</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">Tracking No.</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">Date Mailed</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-center font-semibold text-accent-foreground text-[11px] sm:text-xs uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {documents.map((doc, index) => (
                <tr 
                  key={doc.id} 
                  className="group transition-all duration-300 ease-in-out border-l-4 border-transparent relative"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'hsl(var(--background))' : 'hsl(var(--muted) / 0.08)'
                  }}
                >
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse"></div>
                      <span className="font-semibold text-foreground text-xs sm:text-sm transition-colors">
                        {doc.to || <span className="text-muted-foreground">—</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    <span className="text-foreground/90 text-xs sm:text-sm font-medium">
                      {doc.signatory || <span className="text-muted-foreground">—</span>}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    <span className="text-foreground text-xs sm:text-sm line-clamp-2 transition-colors">
                      {doc.subject || doc.title}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    {doc.dotsNo || doc.referenceNumber ? (
                      <Badge variant="outline" className="font-mono text-[10px] sm:text-xs bg-primary/5 border-primary/20 text-primary font-semibold transition-colors">
                        {doc.dotsNo || doc.referenceNumber}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground/90 text-xs sm:text-sm font-medium">
                        {doc.dateReleased ? new Date(doc.dateReleased).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : <span className="text-muted-foreground">—</span>}
                      </span>
                      {doc.remarksCourier && (
                        <span className="text-muted-foreground text-[10px] sm:text-xs italic bg-muted/30 px-1.5 py-0.5 rounded inline-block">
                          {doc.remarksCourier}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    {doc.trackingNumber ? (
                      <code className="text-[10px] sm:text-xs bg-accent/10 border border-accent/20 text-accent px-2 py-1 rounded font-mono font-semibold transition-colors">
                        {doc.trackingNumber}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    <span className="text-foreground/90 text-xs sm:text-sm font-medium">
                      {doc.dateMailed ? new Date(doc.dateMailed).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : <span className="text-muted-foreground">—</span>}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-md shadow-sm"
                        onClick={() => setEditingDocId(doc.id)}
                        title="Edit document"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-md shadow-sm"
                        onClick={() => setDeletingDocId(doc.id)}
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingDocId && (
          <EditDocumentModal
            documentId={editingDocId}
            onClose={() => setEditingDocId(null)}
            onEdit={handleUpdate}
          />
        )}

        {deletingDocId && (
          <DeleteDocumentModal
            documentId={deletingDocId}
            onClose={() => setDeletingDocId(null)}
            onDelete={handleUpdate}
          />
        )}
    </div>
  )
}
