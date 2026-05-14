import { Badge } from "../ui/badge";

export const CustomerExtraData = ({ data, option, onSelect, showold = true }: { data: any, option: string, onSelect: (val: string) => void, showold?: boolean }) => {
  const menuItems = [
    { key: "this", label: "This Month", dataKey: "thisMonth" },
    { key: "without", label: "No Feedback", dataKey: "withoutFeedback" },
    { key: "top", label: "Top Follow Up", dataKey: "topFollow" },
    { key: "all", label: "All Customers", dataKey: "allCustomers" },
    { key: "next", label: "Next Month", dataKey: "nextMonth" },
  ];

  return (

    <div className="flex flex-col gap-4 mt-5">
      <div className="py-2 px-5 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold tracking-tight">
          {"Customer Group"}
        </h2>
      </div>
      <>
        {menuItems.map(({ key, label, dataKey }) => {
          const count = data?.[dataKey as keyof typeof data]?.length ?? 0;
          return (
            <div
              onClick={() => {
                onSelect(dataKey);
              }}
              key={key}
              className={`flex items-center justify-between py-2 px-5 cursor-pointer rounded-lg transition-all duration-300
          ${option === dataKey
                  ? "bg-[hsl(180,85%,30%)] text-white"
                  : "hover:bg-[hsl(180,85%,90%)] hover:text-[hsl(180,85%,30%)]"
                }
        `}
            >
              <h1 className="text-lg font-medium">{label}</h1>
              {data?.[dataKey as keyof typeof data]?.length > 0 && (
                <Badge variant={option === dataKey ? "secondary" : "default"}>
                  {count > 999 ? "999+" : count}
                </Badge>
              )}
            </div>
          )
        })}
        {showold &&
          <div
            onClick={() => {
              onSelect("record");
            }}
            className={`flex items-center justify-between py-2 px-5 cursor-pointer rounded-lg transition-all duration-300
          ${"hover:bg-[hsl(180,85%,90%)] hover:text-[hsl(180,85%,30%)]"}
        `}
          >
            <h1 className="text-lg font-medium">Old Record</h1>
          </div>
        }
      </>
    </div>
  );
};
