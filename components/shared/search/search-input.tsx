"use client"

import { useKBar } from "kbar"
import { Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SearchInput() {
  const { query } = useKBar()

  return (
    <Button
      type="button"
      size="sm"
      className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium shadow-sm"
      onClick={() => query?.toggle()}
      aria-label="Jump to another page"
      title="Open quick navigation (Ctrl+K)"
    >
      <Navigation className="h-3.5 w-3.5" />
      <span>Jump to</span>
      <kbd className="pointer-events-none ml-1 inline-flex h-5 items-center rounded border border-primary-foreground/25 bg-primary-foreground/10 px-1.5 font-mono text-[10px] leading-none font-medium select-none">
        ⌘ K
      </kbd>
    </Button>
  )
}
