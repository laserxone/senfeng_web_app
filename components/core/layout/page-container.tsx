"use client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/components/ui/sidebar"
import React from "react"
type Props = {
  children: React.ReactNode
  scrollable?: boolean
  className?: string
}
export default function PageContainer({ children, className }: Props) {
  const { isMobile, state } = useSidebar()
  return (
    <ScrollArea className={`flex h-[calc(100dvh-62px)] flex-1`}>
      <div className="flex flex-1 justify-center">
        <div
          className={`flex flex-1 flex-col px-4 ${isMobile ? "max-w-[calc(100dvw-0px)]" : state === "expanded" ? "max-w-[calc(100dvw-260px)]" : "max-w-[calc(100dvw-60px)]"}`}
        >
          <div className={`flex flex-1 ${className}`}>{children}</div>
        </div>
      </div>
    </ScrollArea>
  )
}
