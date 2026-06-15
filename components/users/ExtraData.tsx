import { Badge } from "../ui/badge";

export const CustomerExtraData = ({
  data,
  option,
  onSelect,
  showold = true,
}: {
  data: any
  option: string
  onSelect: (val: string) => void
  showold?: boolean
}) => {
  const menuItems = [
    { key: "this", label: "This Month", dataKey: "thisMonth" },
    { key: "without", label: "No Feedback", dataKey: "withoutFeedback" },
    { key: "top", label: "Top Follow Up", dataKey: "topFollow" },
    { key: "all", label: "All Customers", dataKey: "allCustomers" },
    { key: "next", label: "Next Month", dataKey: "nextMonth" },
  ]

  return (
    <div className="mt-3 flex flex-col gap-3 lg:mt-5">
      <div className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
          Customer Group
        </h2>
      </div>

      <div className="flex w-full gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {menuItems.map(({ key, label, dataKey }) => {
          const count = data?.[dataKey as keyof typeof data]?.length ?? 0

          return (
            <div
              onClick={() => onSelect(dataKey)}
              key={key}
              className={`flex min-w-[160px] shrink-0 cursor-pointer items-center justify-between rounded-lg px-4 py-2 transition-all duration-300 lg:min-w-0 lg:w-full
                ${
                  option === dataKey
                    ? "bg-[hsl(180,85%,30%)] text-white"
                    : "hover:bg-[hsl(180,85%,90%)] hover:text-[hsl(180,85%,30%)]"
                }
              `}
            >
              <h1 className="truncate text-sm font-medium sm:text-base lg:text-lg">
                {label}
              </h1>

              {count > 0 && (
                <Badge variant={option === dataKey ? "secondary" : "default"}>
                  {count > 999 ? "999+" : count}
                </Badge>
              )}
            </div>
          )
        })}

        {showold && (
          <div
            onClick={() => onSelect("record")}
            className="flex min-w-[160px] shrink-0 cursor-pointer items-center justify-between rounded-lg px-4 py-2 transition-all duration-300 hover:bg-[hsl(180,85%,90%)] hover:text-[hsl(180,85%,30%)] lg:min-w-0 lg:w-full"
          >
            <h1 className="truncate text-sm font-medium sm:text-base lg:text-lg">
              Old Record
            </h1>
          </div>
        )}
      </div>
    </div>
  )
}
