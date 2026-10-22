"use client";
import FilterSheet from "@/components/features/users/filter-sheet";
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import { UserSearch } from "@/components/shared/search/user-search";
import PageTable from "@/components/shared/tables/app-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer, MyCustomerResolved } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Trash2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function MemberMainPage({
  onReturn,
}: {
  onReturn: (val: number) => void;
}) {
  const [additionalFilter, setAdditionalFilter] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState<MyCustomerResolved[]>([]);
  const { userID, isAdmin, customer_delete_access } = useUserDetail();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [numCount, setNumCount] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    if (userID)
      fetchData().then(() => {
        setLoading(false);
      });
  }, [userID]);

  async function fetchData(
    startDate?: string,
    endDate?: string,
    user?: number,
  ) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/customer?machines=true&member=true&start_date=${
            startDate || ""
          }&end_date=${endDate || ""}&user=${user || ""}`,
        )
        .then((response) => {
          const apiData: MyCustomer[] = response.data;

          const temp = apiData
            .map((item) => {
              return {
                ...item,
                machines: item?.machines?.join(", "),
                order_nums: item?.machine_order_numbers?.join(", "),
                orignalNumber: item?.number,
                number: item?.number?.join(", "),
                sorting: item.owner || item.name,
              };
            })
            .filter((item) => item?.member);
          setData([...temp]);
        })
        .finally(() => {
          resolve(true);
        });
    });
  }

  const sortableHeader = (title: string) => {
    return function SortableHeader({
      column,
    }: {
      column: {
        getIsSorted: () => false | "asc" | "desc";
        toggleSorting: (descending?: boolean) => void;
      };
    }) {
      return (
        <Button
          variant="ghost"
          className="h-8 px-0 text-[11px] font-bold tracking-wide text-slate-700 uppercase hover:bg-transparent dark:text-zinc-200"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {title}
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      );
    };
  };

  const columns: ColumnDef<MyCustomerResolved>[] = [
    {
      id: "customer",
      header: sortableHeader("Company / Customer"),
      accessorFn: (item) => `${item.name || ""} ${item.owner || ""}`.trim(),
      size: 200,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium break-words">{row.original.name || "—"}</p>
          <p className="text-[11px] break-words text-muted-foreground">
            {row.original.owner || "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "ownership_name",
      header: sortableHeader("Assigned to"),
      size: 150,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          title={row.original.ownership_name || "Unassigned"}
          className={`h-fit max-w-full text-[10px] leading-4 ${
            row.original.ownership_name
              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          }`}
        >
          <span className="min-w-0 truncate">
            {row.original.ownership_name || "Unassigned"}
          </span>
        </Badge>
      ),
    },
    ...(isAdmin
      ? [
          {
            accessorKey: "lead_name",
            header: sortableHeader("Lead by"),
            size: 145,
            cell: ({ row }) => (
              <span className="break-words">
                {row.original.lead_name || "—"}
              </span>
            ),
          } satisfies ColumnDef<MyCustomerResolved>,
        ]
      : []),
    {
      accessorKey: "number",
      header: sortableHeader("Number"),
      size: 155,
      cell: ({ row }) => (
        <span className="break-words">{row.original.number || "—"}</span>
      ),
    },
    {
      accessorKey: "industry",
      header: sortableHeader("Industry"),
      size: 135,
      cell: ({ row }) => <span>{row.getValue<string>("industry") || "—"}</span>,
    },
    {
      accessorKey: "location",
      header: sortableHeader("Location"),
      size: 145,
      cell: ({ row }) => <span>{row.original.location || "—"}</span>,
    },
    {
      accessorKey: "customer_group",
      header: sortableHeader("Group"),
      size: 130,
      cell: ({ row }) => {
        const group = row.getValue<string>("customer_group");
        return group ? group : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "machines",
      header: sortableHeader("Machines"),
      size: 210,
      cell: ({ row }) => {
        const machines =
          row.original.machines?.split(", ").filter(Boolean) || [];
        return machines.length ? (
          <div
            className="flex min-w-0 flex-wrap gap-1"
            title={row.original.machines}
          >
            {machines.slice(0, 2).map((machine, index) => (
              <Badge
                key={`${machine}-${index}`}
                variant="outline"
                className="max-w-full border-emerald-200 bg-emerald-50 text-[10px] whitespace-normal break-words text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                {machine}
              </Badge>
            ))}
            {machines.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{machines.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: sortableHeader("Added"),
      size: 125,
      cell: ({ row }) => {
        const added = row.getValue<string>("created_at");
        return added ? moment(added).format("DD MMM YYYY") : "—";
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 90,
      cell: ({ row }) => {
        if (!(isAdmin || customer_delete_access === true)) return null;

        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg bg-destructive px-2.5 text-white hover:bg-destructive/90 hover:text-white"
            aria-label={`Delete ${row.original.name || row.original.owner || "member"}`}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedCustomerId(row.original.id);
              setShowConfirmation(true);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        );
      },
    },
  ];

  function handleClear() {
    setAdditionalFilter("");
    setSelectedUser(null);
  }

  async function handleDelete(id: number | null) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/${userID}/customer/${id}`);
      toast.success("Customer Deleted");
      await fetchData();
    } finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setSelectedCustomerId(null);
    }
  }

  const filteredData = data
    .filter((item) =>
      additionalFilter == "duplicate"
        ? item.orignalNumber?.some((num) => numCount[num] > 1)
        : additionalFilter === "mycustomers"
          ? item.ownership === userID ||
            item.sell_by?.includes(Number(userID)) ||
            item?.lead === userID
          : true,
    )
    .filter((item) =>
      selectedUser
        ? item?.ownership === selectedUser || item?.lead === selectedUser
        : true,
    );
  useEffect(() => {
    if (data.length > 0) {
      const numberCount: any = {};

      data.forEach((item) => {
        if (item.orignalNumber) {
          item.orignalNumber.forEach((num) => {
            numberCount[num] = (numberCount[num] || 0) + 1;
          });
        }
      });
      setNumCount(numberCount);
    }
  }, [data]);

  const filterItems = isAdmin
    ? [
        { value: "mycustomers", label: "My Customers" },
        { value: "duplicate", label: "Duplicate" },
      ]
    : [{ value: "mycustomers", label: "My Customers" }];

  return (
    <>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between">
          <Heading title="All Members" description="Manage your members" />
        </div>

        <PageTable
          columns={columns}
          loading={loading}
          download={true}
          data={
            additionalFilter === "duplicate"
              ? filteredData.sort((a, b) =>
                  (a?.sorting || "")
                    ?.toLowerCase()
                    ?.localeCompare(b?.sorting?.toLowerCase() || ""),
                )
              : filteredData
          }
          onRowClick={(val, e) => {
            if (val.id) {
              onReturn(val.id);
            }
          }}
          filter
          onFilterPress={() => setFilterVisible(true)}
          reset
          resetLoading={resetLoading}
          onResetPress={async () => {
            setResetLoading(true);
            fetchData().then(() => {
              setResetLoading(false);
            });
          }}
        >
          <div className="flex flex-wrap justify-between">
            <div className="flex flex-wrap gap-4">
              {isAdmin && (
                <div className="w-[300px]">
                  <UserSearch
                    placeholder="Filter user..."
                    value={selectedUser}
                    onReturn={setSelectedUser}
                  />
                </div>
              )}

              <Select
                onValueChange={setAdditionalFilter}
                value={additionalFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Additional filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filterItems.map((framework) => (
                      <SelectItem
                        key={framework.value}
                        value={framework.value}
                        onClick={() => {
                          if (framework.value === additionalFilter) {
                            setAdditionalFilter("");
                          } else {
                            setAdditionalFilter(framework.value);
                          }
                        }}
                      >
                        {framework.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  handleClear();
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </PageTable>
      </div>

      <ConfirmationDialog
        loading={deleteLoading}
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove customer from the system"}
        onPressYes={() => handleDelete(selectedCustomerId)}
        onPressCancel={() => setShowConfirmation(false)}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val?.user);
        }}
      />
    </>
  );
}
