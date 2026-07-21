"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios, { cancelRequest } from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  CreditCard,
  MessageSquareWarning,
  ReceiptText,
  Search,
  ShoppingBag,
  UserRound,
  UsersRound,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SearchTable =
  | "customer"
  | "users"
  | "sale"
  | "payment"
  | "savedinvoices"
  | "customer_parts"
  | "lab_tasks"
  | "complaints"
  | "task";
type SearchFilter = "all" | SearchTable;

type SearchResult = {
  id: number;
  table: SearchTable;
  title: string;
  customer_id: number | null;
  description: string | null;
  route: string;
};

const tableOrder: SearchTable[] = [
  "customer",
  "users",
  "sale",
  "payment",
  "savedinvoices",
  "customer_parts",
  "lab_tasks",
  "complaints",
  "task",
];

const resultMeta = {
  customer: { label: "Customers", icon: UsersRound },
  users: { label: "People", icon: UserRound },
  sale: { label: "Sales", icon: ShoppingBag },
  payment: { label: "Payments", icon: CreditCard },
  savedinvoices: { label: "POS Invoices", icon: ReceiptText },
  customer_parts: { label: "POS Payments", icon: WalletCards },
  lab_tasks: { label: "Repairing & Maintenance", icon: Wrench },
  complaints: { label: "Complaints & Installations", icon: MessageSquareWarning },
  task: { label: "Tasks", icon: ClipboardList },
} satisfies Record<SearchTable, { label: string; icon: typeof UserRound }>;

export default function AppSearch() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const debouncedSearch = useDebounce(search.trim(), 400);
  const { userID, base_route, designation } = useUserDetail();

  useEffect(() => {
    if (!debouncedSearch || !userID) return;

    const cancelKey = `global-search-${userID}`;

    axios
      .get<SearchResult[]>(`/${userID}/search`, {
        params: {
          q: debouncedSearch,
          base_route,
        },
        cancelKey,
      })
      .then((response) => {
        setResults(response.data);
        setLoading(false);
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED") return;
        setResults([]);
       
      }).finally(()=>{
         setLoading(false);
      })

    return () => cancelRequest(cancelKey);
  }, [base_route, debouncedSearch, userID]);

  const availableTables = useMemo(
    () => tableOrder.filter((table) => results.some((item) => item.table === table)),
    [results],
  );

  const effectiveFilter =
    activeFilter === "all" || availableTables.includes(activeFilter)
      ? activeFilter
      : "all";

  const groupedResults = useMemo(
    () =>
      tableOrder
        .filter((table) => effectiveFilter === "all" || table === effectiveFilter)
        .map((table) => ({
          table,
          items: results.filter((result) => result.table === table),
        }))
        .filter((group) => group.items.length > 0),
    [effectiveFilter, results],
  );

  function updateSearch(value: string) {
    const hasSearch = Boolean(value.trim());

    setSearch(value);
    setResults([]);
    setActiveFilter("all");
    setLoading(hasSearch && Boolean(userID));
  }

  function openResult(result: SearchResult) {
    setSheetOpen(false);
    setSearch("");
    setResults([]);
    setActiveFilter("all");
    router.push(result.route);
  }

  if (!designation) return null;

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-64 justify-start gap-2 px-3 font-normal text-muted-foreground lg:w-80"
          aria-label="Open global search"
        >
          <Search className="size-4" />
          <span className="truncate">Global search...</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        className="w-full gap-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg font-semibold tracking-tight">
                Search
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs">
                Find customers, people, serials and order numbers.
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Close search">
                <X className="size-4" />
              </Button>
            </SheetClose>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search..."
              aria-label="Search customers, people and sales"
              autoComplete="off"
              autoFocus
              className="pl-9"
            />
          </div>
        </SheetHeader>

        {availableTables.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b px-4 py-3">
            <Button
              type="button"
              size="sm"
              variant={effectiveFilter === "all" ? "default" : "outline"}
              className="shrink-0 rounded-full"
              onClick={() => setActiveFilter("all")}
            >
              All
              <span className="ml-1 text-xs opacity-75">{results.length}</span>
            </Button>
            {availableTables.map((table) => (
              <Button
                key={table}
                type="button"
                size="sm"
                variant={effectiveFilter === table ? "default" : "outline"}
                className="shrink-0 rounded-full"
                onClick={() => setActiveFilter(table)}
              >
                {resultMeta[table].label}
                <span className="ml-1 text-xs opacity-75">
                  {results.filter((result) => result.table === table).length}
                </span>
              </Button>
            ))}
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1 pr-2">
          <div className="p-3">
            {loading ? (
              <div className="space-y-2" aria-label="Loading search results">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-14 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : !search.trim() ? (
              <SearchMessage
                title="Search across your workspace"
                description="Enter a customer, person, serial or order number."
              />
            ) : groupedResults.length ? (
              groupedResults.map(({ table, items }) => {
                const Icon = resultMeta[table].icon;

                return (
                  <div key={table} className="mb-4 last:mb-0">
                    {effectiveFilter === "all" && (
                      <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {resultMeta[table].label}
                      </p>
                    )}
                    <div className="space-y-1">
                      {items.map((result, index) => (
                        <Link onClick={() => openResult(result)}  key={`${result.table}-${result.id}-${result.title}-${index}`} href={result.route}>
                        
                        <div
                         
                        
                          
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left",
                            "transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                          )}
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {result.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {result.description || resultMeta[table].label}
                            </span>
                          </div>
                        </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <SearchMessage
                title="No results found"
                description="Try a different customer, person, serial or order number."
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SearchMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-56 flex-col items-center justify-center px-6 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
        <Search className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-64 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
