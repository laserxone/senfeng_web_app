import React, { ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Order } from "@/lib/types"

function SortableCard({
  order,
  children,
  dragHandle,
}: {
  order: Order | null
  children: ReactNode
  dragHandle: React.ReactElement
}) {
  if (!order?.id) return

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: order.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex w-full gap-2">
      {dragHandle &&
        React.cloneElement(dragHandle, { ...attributes, ...listeners })}

      {children}
    </div>
  )
}

export default SortableCard
