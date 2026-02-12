export type DocumentCategory =
  | 'LBC'
  | 'Registered'
  | 'Pick-up'
  | 'Personal Delivery'
  | 'Email'
  | 'CAR'
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'R5'
  | 'R6'
  | 'R7'
  | 'R8'
  | 'R9'
  | 'R10'
  | 'R11'
  | 'R12'
  | 'R13'

export interface Document {
  id: string
  title: string
  referenceNumber: string
  date: string
  status: 'Pending' | 'Approved' | 'Archived'
  notes: string
  category: DocumentCategory
  // optional fields for extended table columns
  to?: string
  signatory?: string
  subject?: string
  dotsNo?: string
  dateReleased?: string
  remarksCourier?: string
  trackingNumber?: string
  dateMailed?: string
}

const STORAGE_KEY = 'documents'

export function getDocuments(): Document[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveDocuments(documents: Document[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
}

export function addDocument(document: Omit<Document, 'id'>): Document {
  const documents = getDocuments()
  const newDocument: Document = {
    ...document,
    id: Date.now().toString(),
  }
  documents.push(newDocument)
  saveDocuments(documents)
  return newDocument
}

export function updateDocument(
  id: string,
  updates: Partial<Omit<Document, 'id'>>
): Document | null {
  const documents = getDocuments()
  const index = documents.findIndex((doc) => doc.id === id)
  if (index === -1) return null
  documents[index] = { ...documents[index], ...updates }
  saveDocuments(documents)
  return documents[index]
}

export function deleteDocument(id: string): boolean {
  const documents = getDocuments()
  const index = documents.findIndex((doc) => doc.id === id)
  if (index === -1) return false
  documents.splice(index, 1)
  saveDocuments(documents)
  return true
}
