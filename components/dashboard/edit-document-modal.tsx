"use client"

import React from 'react'

interface EditDocumentModalProps {
	documentId: string
	onClose: () => void
	onEdit?: () => void
}

export default function EditDocumentModal({ documentId, onClose, onEdit }: EditDocumentModalProps) {
	if (!documentId) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="bg-white dark:bg-[#0b1220] border rounded-lg p-4 shadow-lg w-full max-w-md">
				<h3 className="text-lg font-semibold">Edit Document</h3>
				<p className="text-sm text-muted-foreground mt-2">Editing: {documentId}</p>

				<div className="mt-4 flex justify-end gap-2">
					<button
						onClick={() => {
							onEdit?.()
							onClose()
						}}
						className="px-3 py-1.5 rounded bg-accent text-accent-foreground"
					>
						Save
					</button>
					<button onClick={onClose} className="px-3 py-1.5 rounded border">
						Cancel
					</button>
				</div>
			</div>
		</div>
	)
}

