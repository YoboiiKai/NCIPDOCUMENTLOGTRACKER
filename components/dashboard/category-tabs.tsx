'use client'

import { DocumentCategory } from '@/lib/document-store'

type CategoryLabel = DocumentCategory | 'Pickup/Delivery'

const CATEGORIES: CategoryLabel[] = [
  'LBC',
  'Registered',
  'Pickup/Delivery',
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

interface CategoryTabsProps {
  selectedCategory: DocumentCategory | 'All' | 'Pickup/Delivery'
  onCategoryChange: (category: DocumentCategory | 'All' | 'Pickup/Delivery') => void
}

export default function CategoryTabs({
  selectedCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-end w-full min-w-max">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`chrome-tab relative flex-1 min-w-[60px] sm:min-w-0 py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-medium text-center transition-all whitespace-nowrap ${
              selectedCategory === category
                ? 'chrome-tab-active'
                : 'chrome-tab-inactive'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .chrome-tab {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          position: relative;
          margin-bottom: -1px;
        }
        
        .chrome-tab-active {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          border: 1px solid hsl(var(--accent));
          border-bottom: 1px solid transparent;
          z-index: 10;
        }
        
        .chrome-tab-inactive {
          background: linear-gradient(to right, #0A2D55, #0C3B6E, #0A2D55);
          color: white;
          border: 1px solid #0C3B6E;
          border-bottom: 1px solid transparent;
        }
        
        .chrome-tab-inactive:hover {
          background: linear-gradient(to right, #0E3A6B, #124881, #0E3A6B);
          color: white;
        }
      `}</style>
    </div>
  )
}
