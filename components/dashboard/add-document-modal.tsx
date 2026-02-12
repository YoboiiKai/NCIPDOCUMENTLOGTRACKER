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
  
  // New fields to match table columns
  const [to, setTo] = useState('')
  const [signatory, setSignatory] = useState('')
  const [subject, setSubject] = useState('')
  const [dotsNo, setDotsNo] = useState('')
  const [dateReleased, setDateReleased] = useState(new Date().toISOString().split('T')[0])
  const [remarksCourier, setRemarksCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [dateMailed, setDateMailed] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!to || !signatory || !subject || !dotsNo) {
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))

    addDocument({
      title: subject, // Use subject as title
      referenceNumber: dotsNo, // Use dotsNo as reference number
      date: dateMailed, // Use dateMailed as the main date
      status,
      category,
      notes,
      to,
      signatory,
      subject,
      dotsNo,
      dateReleased,
      remarksCourier,
      trackingNumber,
      dateMailed,
    })

    setTitle('')
    setReferenceNumber('')
    setDate(new Date().toISOString().split('T')[0])
    setStatus('Pending')
    setCategory('LBC')
    setNotes('')
    setTo('')
    setSignatory('')
    setSubject('')
    setDotsNo('')
    setDateReleased(new Date().toISOString().split('T')[0])
    setRemarksCourier('')
    setTrackingNumber('')
    setDateMailed(new Date().toISOString().split('T')[0])
    setLoading(false)

    onAdd()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>Create a new document log entry</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="to" className="text-sm font-medium">
                TO <span className="text-destructive">*</span>
              </label>
              <Input
                id="to"
                placeholder="e.g., Office of Records"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={loading}
                className="bg-secondary/30"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signatory" className="text-sm font-medium">
                SIGNATORY <span className="text-destructive">*</span>
              </label>
              <Input
                id="signatory"
                placeholder="e.g., A. Santos"
                value={signatory}
                onChange={(e) => setSignatory(e.target.value)}
                disabled={loading}
                className="bg-secondary/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              SUBJECT <span className="text-destructive">*</span>
            </label>
            <Input
              id="subject"
              placeholder="e.g., Title transfer for Lot 12"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              className="bg-secondary/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dotsNo" className="text-sm font-medium">
              DOTS NO. <span className="text-destructive">*</span>
            </label>
            <Input
              id="dotsNo"
              placeholder="e.g., DOTS-001"
              value={dotsNo}
              onChange={(e) => setDotsNo(e.target.value)}
              disabled={loading}
              className="bg-secondary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="dateReleased" className="text-sm font-medium">
                DATE RELEASED
              </label>
              <Input
                id="dateReleased"
                type="date"
                value={dateReleased}
                onChange={(e) => setDateReleased(e.target.value)}
                disabled={loading}
                className="bg-secondary/30"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="remarksCourier" className="text-sm font-medium">
                REMARKS / COURIER
              </label>
              <Input
                id="remarksCourier"
                placeholder="e.g., LBC"
                value={remarksCourier}
                onChange={(e) => setRemarksCourier(e.target.value)}
                disabled={loading}
                className="bg-secondary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="trackingNumber" className="text-sm font-medium">
                TRACKING NO.
              </label>
              <Input
                id="trackingNumber"
                placeholder="e.g., LBC-555-001"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={loading}
                className="bg-secondary/30"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dateMailed" className="text-sm font-medium">
                DATE MAILED via JRMP
              </label>
              <Input
                id="dateMailed"
                type="date"
                value={dateMailed}
                onChange={(e) => setDateMailed(e.target.value)}
                disabled={loading}
                className="bg-secondary/30"
              />
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

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !to || !signatory || !subject || !dotsNo}
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
