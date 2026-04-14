import { Loader2 } from "lucide-react"
import type { LucideProps } from "lucide-react"

type SpinnerProps = {
  className?: string
  size?: number
} & LucideProps

const Spinner = ({ className, size, ...props }: SpinnerProps) => {
  return (
    <Loader2
      className={`animate-spin ${className ?? ""}`}
      size={size}
      {...props}
    />
  )
}

export default Spinner