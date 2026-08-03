import { Badge } from "@/components/ui/badge"

const NotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null

  return (
    <div className="animate-pulse-opacity relative">
      <Badge
        variant={"destructive"}
        className="bg-destructive text-[11px] text-white"
      >
        {/* <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold leading-none tracking-normal"> */}
        {count}
        {/* </span> */}
      </Badge>
    </div>
  )
}

export default NotificationBadge
