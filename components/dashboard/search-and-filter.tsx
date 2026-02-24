'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface SearchAndFilterProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
}

const STATUS_OPTIONS = [
  { value: 'All',      label: 'All Statuses' },
  { value: 'Pending',  label: 'Pending'       },
  { value: 'Approved', label: 'Approved'      },
  { value: 'Archived', label: 'Archived'      },
]

export default function SearchAndFilter({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: SearchAndFilterProps) {
  const isFiltered = searchTerm.trim() !== '' || statusFilter !== 'All'

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
      <div className="flex flex-col sm:flex-row gap-3">

        {/* ── Search input ── */}
        <div className="relative flex-1 group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0C3B6E] transition-colors pointer-events-none"
          />
          <Input
            placeholder="Search by title, reference number, or notes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 h-9 bg-slate-50 border-slate-200 rounded-lg text-sm
                       placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0C3B6E]
                       focus-visible:border-[#0C3B6E] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Divider (visible on larger screens) ── */}
        <div className="hidden sm:block w-px bg-slate-200 self-stretch my-0.5" />

        {/* ── Status filter ── */}
        <div className="flex items-center gap-2 sm:min-w-[190px]">
          <SlidersHorizontal size={15} className="shrink-0 text-slate-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="flex-1 h-9 bg-slate-50 border-slate-200 rounded-lg text-sm
                         focus:ring-1 focus:ring-[#0C3B6E] focus:border-[#0C3B6E] transition-all"
            >
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {value !== 'All' && (
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        value === 'Pending'  ? 'bg-amber-400'  :
                        value === 'Approved' ? 'bg-emerald-500' :
                                               'bg-slate-400'
                      }`}
                    />
                  )}
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* ── Active-filter badge ── */}
      {isFiltered && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Active filters:</span>
          {searchTerm.trim() && (
            <span className="inline-flex items-center gap-1 bg-[#0C3B6E]/8 text-[#0C3B6E] text-xs px-2 py-0.5 rounded-full border border-[#0C3B6E]/20 font-medium">
              &ldquo;{searchTerm.trim()}&rdquo;
              <button type="button" onClick={() => setSearchTerm('')} className="ml-0.5 hover:text-[#0A2D55]">
                <X size={11} />
              </button>
            </span>
          )}
          {statusFilter !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-[#0C3B6E]/8 text-[#0C3B6E] text-xs px-2 py-0.5 rounded-full border border-[#0C3B6E]/20 font-medium">
              Status: {statusFilter}
              <button type="button" onClick={() => setStatusFilter('All')} className="ml-0.5 hover:text-[#0A2D55]">
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
