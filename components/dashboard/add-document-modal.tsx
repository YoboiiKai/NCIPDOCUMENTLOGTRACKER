'use client'

import React from 'react'

import { useState } from 'react'
import { addDocument, DocumentCategory } from '@/lib/document-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AddDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
}

export default function AddDocumentModal({ isOpen, onClose, onAdd }: AddDocumentModalProps) {
  const [title, setTitle] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Archived'>('Pending')
  const [category, setCategory] = useState<DocumentCategory>('LBC')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !referenceNumber) {
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))

    addDocument({
      title,
      referenceNumber,
      date,
      status,
      category,
      notes,
    })

    setTitle('')
    setReferenceNumber('')
    setDate(new Date().toISOString().split('T')[0])
    setStatus('Pending')
    setCategory('LBC')
    setNotes('')
    setLoading(false)

    onAdd()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>Create a new document log entry</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Document Title
            </label>
            <Input
              id="title"
              placeholder="e.g., Quarterly Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="bg-secondary/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reference" className="text-sm font-medium">
              Reference Number
            </label>
            <Input
              id="reference"
              placeholder="e.g., DOC-2024-001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              disabled={loading}
              className="bg-secondary/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger disabled={loading} className="bg-secondary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LBC">LBC</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Pick-up">Pick-up</SelectItem>
                <SelectItem value="Personal Delivery">Personal Delivery</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="CAR">CAR</SelectItem>
                <SelectItem value="R1">R1</SelectItem>
                <SelectItem value="R2">R2</SelectItem>
                <SelectItem value="R3">R3</SelectItem>
                <SelectItem value="R4">R4</SelectItem>
                <SelectItem value="R5">R5</SelectItem>
                <SelectItem value="R6">R6</SelectItem>
                <SelectItem value="R7">R7</SelectItem>
                <SelectItem value="R8">R8</SelectItem>
                <SelectItem value="R9">R9</SelectItem>
                <SelectItem value="R10">R10</SelectItem>
                <SelectItem value="R11">R11</SelectItem>
                <SelectItem value="R12">R12</SelectItem>
                <SelectItem value="R13">R13</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                className="bg-secondary/30"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger disabled={loading} className="bg-secondary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title || !referenceNumber}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading ? 'Adding...' : 'Add Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
