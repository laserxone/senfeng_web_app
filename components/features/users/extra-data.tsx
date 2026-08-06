import { Calendar, Filter, Phone, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const CustomerExtraData = ({
  data,
  option,
  onSelect,
  showold = true,
}: {
  data: any;
  option: string;
  onSelect: (val: string) => void;
  showold?: boolean;
}) => {
  const menuItems = [
    {
      key: "this",
      label: "This Month",
      dataKey: "thisMonth",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      key: "without",
      label: "No Feedback",
      dataKey: "withoutFeedback",

      icon: <Phone className="h-4 w-4" />,
    },
    {
      key: "top",
      label: "Top Follow Up",
      dataKey: "topFollow",
      icon: <Filter className="h-4 w-4" />,
    },
    {
      key: "all",
      label: "All Customers",
      dataKey: "allCustomers",
      icon: <Users className="h-4 w-4" />,
    },
    {
      key: "next",
      label: "Next Month",
      dataKey: "nextMonth",
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          Customer Group
        </h2>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Filter customer records
        </p>
      </div>

      <div className="flex w-full gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {menuItems.map(({ key, label, dataKey, icon }) => {
          const count = data?.[dataKey as keyof typeof data]?.length ?? 0;
          const isActive = option === dataKey;

          return (
            <button
              type="button"
              onClick={() => onSelect(dataKey)}
              key={key}
              className={`group flex min-w-[145px] shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left transition-all duration-200 lg:w-full lg:min-w-0 ${
                isActive
                  ? "border border-blue-200 bg-blue-50 text-blue-800 shadow-sm dark:border-blue-800/70 dark:bg-blue-950/50 dark:text-blue-100"
                  : "border border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              } `}
            >
              <div className="flex items-center gap-2 text-xs">
                {icon}
                <span className="truncate text-xs font-semibold sm:text-sm">
                  {label}
                </span>
              </div>

              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={`h-5 rounded-full px-2 text-[10px] font-bold shadow-none ${
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                  } `}
                >
                  {count > 999 ? "999+" : count}
                </Badge>
              )}
            </button>
          );
        })}

        {showold && (
          <button
            type="button"
            onClick={() => onSelect("record")}
            className={`flex min-w-[145px] shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-all duration-200 lg:w-full lg:min-w-0 ${
              option === "record"
                ? "border border-slate-300 bg-slate-200 text-slate-950 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                : "border border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            } `}
          >
            <span className="truncate text-xs font-semibold sm:text-sm">
              Old Record
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
