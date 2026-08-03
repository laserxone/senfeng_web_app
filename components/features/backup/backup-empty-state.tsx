import { Card, CardContent } from "@/components/ui/card"

export default function EmptyState({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>

        <h3 className="mb-1 text-lg font-medium">{title}</h3>

        <p className="max-w-sm text-center text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
