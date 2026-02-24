"use client"

import React, { useState, useEffect } from 'react'
import { addDocument, DocumentCategory } from '@/lib/document-store'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, X, ScanLine } from 'lucide-react'
import CameraScanner from './camera-scanner'

interface AddDocumentModalProps {
	isOpen: boolean
	onClose: () => void
	onAdd?: () => void
}

const categories: DocumentCategory[] = [
	'LBC',
	'Registered',
	'Pick-up',
	'Personal Delivery',
	'Email',
	'CAR',
	'R1',
	'R2',
	'R3',
	'R4',
	'R5',
	'R6',
	'R7',
	'R8',
	'R9',
	'R10',
	'R11',
	'R12',
	'R13',
]

function AddDocumentModal({ isOpen, onClose, onAdd }: AddDocumentModalProps) {
	const [title, setTitle] = useState('')
	const [referenceNumber, setReferenceNumber] = useState('')
	const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
	const [status, setStatus] = useState<'Pending' | 'Approved' | 'Archived'>('Pending')
	const [notes, setNotes] = useState('')
	const [category, setCategory] = useState<DocumentCategory>('Registered')

	// extended table columns
	const [to, setTo] = useState('')
	const [signatory, setSignatory] = useState('')
	const [subject, setSubject] = useState('')
	const [dotsNo, setDotsNo] = useState('')
	const [dateReleased, setDateReleased] = useState<string>('')
	const [remarksCourier, setRemarksCourier] = useState('')
	const [trackingNumber, setTrackingNumber] = useState('')
	const [dateMailed, setDateMailed] = useState<string>('')

	// scanner state
	const [scannerOpen, setScannerOpen] = useState(false)
	const [scannerLabel, setScannerLabel] = useState('')
	const [activeSetter, setActiveSetter] = useState<((v: string) => void) | null>(null)

	const openScanner = (label: string, setter: (v: string) => void) => {
		setScannerLabel(label)
		setActiveSetter(() => setter)
		setScannerOpen(true)
	}

	// lock body scroll when modal is open (mobile friendly)
	useEffect(() => {
		const prev = typeof document !== 'undefined' ? document.body.style.overflow : ''
		if (isOpen) document.body.style.overflow = 'hidden'
		return () => {
			if (typeof document !== 'undefined') document.body.style.overflow = prev
		}
	}, [isOpen])

	if (!isOpen) return null

	const ScanButton = ({ label, setter }: { label: string; setter: (v: string) => void }) => (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			title={`Scan text for ${label}`}
			className="w-10 h-10 shrink-0 rounded-md border border-input flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-colors"
			onClick={() => openScanner(label, setter)}
		>
			<ScanLine className="w-4 h-4 text-blue-500" />
		</Button>
	)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		const doc = {
			title: title || 'Untitled',
			referenceNumber: referenceNumber || `REF-${Date.now()}`,
			date: date ? new Date(date).toISOString() : new Date().toISOString(),
			status,
			notes,
			category,
			to: to || undefined,
			signatory: signatory || undefined,
			subject: subject || title || undefined,
			dotsNo: dotsNo || undefined,
			dateReleased: dateReleased ? new Date(dateReleased).toISOString() : undefined,
			remarksCourier: remarksCourier || undefined,
			trackingNumber: trackingNumber || undefined,
			dateMailed: dateMailed ? new Date(dateMailed).toISOString() : undefined,
		}

		try {
			addDocument(doc)
			onAdd?.()
			onClose()
			// clear form
			setTitle('')
			setReferenceNumber('')
			setDate(new Date().toISOString().slice(0, 10))
			setStatus('Pending')
			setNotes('')
			setCategory('Registered')
			setTo('')
			setSignatory('')
			setSubject('')
			setDotsNo('')
			setDateReleased('')
			setRemarksCourier('')
			setTrackingNumber('')
			setDateMailed('')
		} catch (err) {
			console.error('Failed to add document', err)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="fixed inset-0 bg-black/45" onClick={onClose} />

			<form
				onSubmit={handleSubmit}
				className="relative z-10 w-full max-w-3xl mx-4 my-8 bg-white dark:bg-[#071029] rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
			>
				<div className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#0A2D55] via-[#0C3B6E] to-[#0A2D55] text-white px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-white/10 rounded-md">
							<Plus className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-lg font-semibold">Add Document</h3>
							<p className="text-sm opacity-90">Provide document details to add to the register</p>
						</div>
					</div>
					<button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-white/10">
						<X className="w-4 h-4 text-white/90" />
					</button>
				</div>

				<div className="p-4 overflow-auto flex-1 pb-28 md:pb-0">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* To */}
						<div>
							<label className="text-xs font-medium">To</label>
							<div className="mt-1 flex items-center gap-2">
								<Input placeholder="Recipient" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1" />
						<ScanButton label="To" setter={setTo} />
							</div>
						</div>

						{/* Signatory */}
						<div>
							<label className="text-xs font-medium">Signatory</label>
							<div className="mt-1 flex items-center gap-2">
								<Input placeholder="Signer" value={signatory} onChange={(e) => setSignatory(e.target.value)} className="flex-1" />
						<ScanButton label="Signatory" setter={setSignatory} />
							</div>
						</div>

						{/* Subject */}
						<div>
							<label className="text-xs font-medium">Subject</label>
							<div className="mt-1 flex items-center gap-2">
								<Input placeholder="Subject or summary" value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1" />
						<ScanButton label="Subject" setter={setSubject} />
							</div>
						</div>

						{/* DOTS */}
						<div>
							<label className="text-xs font-medium">DOTS No.</label>
							<div className="mt-1 flex items-center gap-2">
								<Input placeholder="DOTS-xxx" value={dotsNo} onChange={(e) => setDotsNo(e.target.value)} className="flex-1 font-mono" />
						<ScanButton label="DOTS No." setter={setDotsNo} />
							</div>
						</div>

						{/* Date Released */}
						<div>
							<label className="text-xs font-medium">Date Released</label>
							<div className="mt-1 flex items-center gap-2">
								<Input type="date" value={dateReleased} onChange={(e) => setDateReleased(e.target.value)} className="flex-1" />
						<ScanButton label="Date Released" setter={setDateReleased} />
							</div>
						</div>

						{/* Remarks / Courier */}
						<div>
							<label className="text-xs font-medium">Remarks / Courier</label>
							<div className="mt-1 flex items-center gap-2">
								<Input placeholder="Courier or remarks" value={remarksCourier} onChange={(e) => setRemarksCourier(e.target.value)} className="flex-1" />
						<ScanButton label="Remarks / Courier" setter={setRemarksCourier} />
							</div>
						</div>

						{/* Tracking Number */}
						<div>
							<label className="text-xs font-medium">Tracking Number</label>
							<div className="mt-1 flex items-center gap-2">
								<Input placeholder="Tracking #" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="flex-1 font-mono" />
						<ScanButton label="Tracking Number" setter={setTrackingNumber} />
							</div>
						</div>

						{/* Date Mailed */}
						<div>
							<label className="text-xs font-medium">Date Mailed</label>
							<div className="mt-1 flex items-center gap-2">
								<Input type="date" value={dateMailed} onChange={(e) => setDateMailed(e.target.value)} className="flex-1" />
						<ScanButton label="Date Mailed" setter={setDateMailed} />
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/5 sticky bottom-0 bg-opacity-90 backdrop-blur-sm">
					<div className="text-xs text-muted-foreground">All fields can be edited later from the table.</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={onClose}>Cancel</Button>
						<Button type="submit" variant="default">
							<Plus className="w-4 h-4" />
							Add Document
						</Button>
					</div>
				</div>
			</form>

		<CameraScanner
			isOpen={scannerOpen}
			fieldLabel={scannerLabel}
			onClose={() => setScannerOpen(false)}
			onResult={(text) => {
				activeSetter?.(text)
				setScannerOpen(false)
			}}
		/>
		</div>
	)
}

export { AddDocumentModal }
export default AddDocumentModal

