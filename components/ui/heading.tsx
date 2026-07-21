"use client"

import { memo } from "react"
import { LayoutPanelTop, UserPen } from "lucide-react"
import { usePathname } from "next/navigation"
import useUserDetail from "@/hooks/use-user-detail"

type HeadingProps = {
  title: string
  description?: string
  className?: string
  panel?: boolean
}

function Heading({
  title,
  description,
  className,
  panel = false,
}: HeadingProps) {
  const pathname = usePathname()
  const {base_route} = useUserDetail()
  const isExcludeRoutes =
    pathname.includes(`${base_route}/customer`) ||
    pathname.includes(`${base_route}/member`)
  const usePanel =  !isExcludeRoutes

  console.log(usePanel)

  if (usePanel) {
    return (
      <div className={`flex min-w-0 items-center gap-3 ${className ?? ""}`}>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <LayoutPanelTop className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h1>
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">
              Workspace
            </span>
          </div>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default memo(Heading)
