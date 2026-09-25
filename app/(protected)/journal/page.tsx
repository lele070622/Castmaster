import type { Metadata } from 'next'
import { CatchLedger } from '@/components/journal/catch-ledger'

export const metadata: Metadata = { title: 'Catch Journal' }

export default function JournalPage() {
  return (
    <div className="container py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Catch Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Your complete private catch history, filterable by species, water environment, and date range.
        </p>
      </div>
      <CatchLedger />
    </div>
  )
}
