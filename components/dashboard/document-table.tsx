"use client"

import React from 'react'
import { Document } from '@/lib/document-store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Props {
  documents: Document[]
}

export default function DocumentTable({ documents }: Props) {
  return (
    <Card className="rounded-t-none w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[800px]">
            <thead>
              <tr className="bg-muted/20">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground text-[10px] sm:text-xs">TO</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground text-[10px] sm:text-xs">SIGNATORY</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground text-[10px] sm:text-xs">SUBJECT</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground text-[10px] sm:text-xs">DOTS NO.</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground text-[10px] sm:text-xs">DATE RELEASED REMARKS./COURIER</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground text-[10px] sm:text-xs">TRACKING NO.</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground text-[10px] sm:text-xs">DATE MAILED via JRMP</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-muted/30">
              {documents.map((doc) => (
                <tr key={doc.id} className="odd:bg-transparent even:bg-muted/5 hover:bg-muted/10">
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-black font-medium text-xs sm:text-sm">{doc.to || '-'}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-black text-xs sm:text-sm">{doc.signatory || '-'}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-black text-xs sm:text-sm">{doc.subject || doc.title}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-black text-xs sm:text-sm">{doc.dotsNo || doc.referenceNumber}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-black text-xs sm:text-sm">
                    {doc.dateReleased ? new Date(doc.dateReleased).toLocaleDateString() : '-'}
                    {doc.remarksCourier ? ` / ${doc.remarksCourier}` : ''}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-black text-xs sm:text-sm">{doc.trackingNumber || '-'}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-4 text-black text-xs sm:text-sm">{doc.dateMailed ? new Date(doc.dateMailed).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </Card>
  )
}
