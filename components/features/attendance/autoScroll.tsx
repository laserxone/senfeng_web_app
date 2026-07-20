import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AutoScrollMembers = ({onUpdate} : {onUpdate ?: (item : boolean)=> void}) => {
  const { userID, base_route } = useUserDetail()
  const [localData, setLocalData] = useState<{ id: number, member: boolean, name: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile()

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(
          `/${userID}/scroll`
        );
        const customers = res.data || [];

        const temp = [...customers]
          .filter((item) => item.name?.trim() || item.owner?.trim())
          .map((item) => ({
            ...item,
            name:
              item.name?.trim() ||
              `${item.owner?.trim() || ""} ${item.location?.trim() || ""
                }`.trim(),
          }))
          .filter((item) => !!item.name)
          .sort((a, b) => a.name.localeCompare(b.name));

        setLocalData(temp);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    }

    if (userID) {
      fetchData();
    }
  }, [userID]);

  useEffect(()=>{
    onUpdate?.(localData.length > 0)
  
  },[localData.length, onUpdate])

  useEffect(() => {
    if (localData.length === 0) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const interval = window.setInterval(() => {
      if (isHovered) return;

      if (
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight
      ) {
        scrollContainer.scrollTop = 0;
        return;
      }

      scrollContainer.scrollTop += 1;
    }, 18);

    return () => {
      window.clearInterval(interval);
    };
  }, [isHovered, localData.length]);

  const colors = [
    "bg-red-500",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-amber-500",
    "bg-violet-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-orange-500",
  ];

  if (localData.length == 0) return null;

  const duplicatedList = [...localData];

  if (isMobile) return null
  return (
    <div className="w-[240px] shrink-0">
      <div className="fixed mt-1 w-[240px] overflow-hidden rounded-md border bg-background/95 shadow-sm ring-1 ring-border/40 backdrop-blur">
        <div className="border-b bg-gradient-to-r from-muted/45 via-background to-muted/25 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold tracking-tight">
              Customers
            </div>
            <span className="rounded-md border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {localData.length}
            </span>
          </div>
        </div>
        <div className="p-2">
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-[calc(100dvh-158px)] space-y-1 overflow-y-auto pr-1 no-scrollbar"
          >
              {duplicatedList.map((item, index) => {
                const randomColor = colors[index % colors.length];
                return (
                  <Link
                    key={`${item.id}-${index}`}
                    className="group flex h-[42px] min-w-0 cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 transition hover:border-border hover:bg-muted/45"
                    href={`/${base_route}/${item.member ? "member" : "customer"
                      }/${item.id}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/60">
                      <AvatarImage src="/" alt="Customer Picture" />
                      <AvatarFallback className={`text-[11px] font-bold uppercase text-white ${randomColor}`}>
                        {item?.name?.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold leading-4 text-foreground">
                        {item?.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {item.member ? "Member" : "Customer"}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoScrollMembers;
