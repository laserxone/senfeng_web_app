import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { Badge } from "@/components/ui/badge";

type TabsProps = {
    value: string,
    label: string,
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>,
    count: number | null,
}[]
const UserTabs = ({ tabs, routeTo, activeTab }: { tabs: TabsProps, routeTo: (val: string) => void, activeTab: string }) => {


    return (
        <div className="flex flex-1 gap-1.5 pt-2">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;

                return (
                    <button
                        key={tab.value}
                        onClick={() => routeTo(tab.value)}
                        className={`
          cursor-pointer group inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold
          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40
          ${isActive
                                ? "border-primary/25 bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                                : "border-border bg-card/80 text-muted-foreground hover:border-primary/25 hover:bg-muted/70 hover:text-foreground"
                            }
        `}
                    >
                        <span
                            className={`
            flex size-5 items-center justify-center rounded-full transition
            ${isActive ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"}
          `}
                        >
                            <Icon className="size-3" />
                        </span>

                        <span className="whitespace-nowrap">{tab.label}</span>

                        {tab.count !== null && tab.count !== undefined && (
                            <Badge
                                variant="secondary"
                                className={`
              ml-0.5 h-4 min-w-4 rounded-full border px-1.5 text-[10px] font-bold
              ${isActive ? "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground" : "border-border bg-muted text-muted-foreground group-hover:text-foreground"}
            `}
                            >
                                {tab.count > 999 ? "999+" : tab.count}
                            </Badge>
                        )}
                    </button>
                );
            })}
        </div>
    )
}

export default UserTabs
