"use client"

import React from 'react'

interface DeleteDocumentModalProps {
	documentId: string
	onClose: () => void
	onDelete?: () => void
}

export default function DeleteDocumentModal({ documentId, onClose, onDelete }: DeleteDocumentModalProps) {
	if (!documentId) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="bg-white dark:bg-[#0b1220] border rounded-lg p-4 shadow-lg w-full max-w-sm">
				<h3 className="text-lg font-semibold text-destructive">Delete Document</h3>
				<p className="text-sm text-muted-foreground mt-2">Are you sure you want to delete document {documentId}?</p>

				<div className="mt-4 flex justify-end gap-2">
					<button
						onClick={() => {
							onDelete?.()
							onClose()
						}}
						className="px-3 py-1.5 rounded bg-destructive text-destructive-foreground"
					>
						Delete
					</button>
					<button onClick={onClose} className="px-3 py-1.5 rounded border">
						Cancel
					</button>
				</div>
			</div>
		</div>
	)
}

