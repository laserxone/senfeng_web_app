"use client";
import AddQuickAction from "@/components/features/customers/actions/add-quick-action";
import AddCustomerDialog from "@/components/features/customers/components/add-customer";
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import { UserSearch } from "@/components/shared/search/user-search";
import PageTable from "@/components/shared/tables/app-table";
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
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Trash2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CustomerMainPage({
  onReturn,
}: {
  onReturn: (val: number) => void;
}) {
  const [additionalFilter, setAdditionalFilter] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState<MyCustomer[]>([]);
  const [addCustomer, setAddCustomer] = useState(false);
  const {
    userID,
    isAdmin,
    designation,
    customer_add_access,
    customer_delete_access,
    office,
    route_branch,
  } = useUserDetail();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [quickAction, setQuickAction] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [numCount, setNumCount] = useState<any>({});
  const [myLoading, setMyLoading] = useState(false);

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/customer?member=false`)
        .then((response) => {
          const apiData = response.data;
          const temp = apiData.map((item: any) => {
            return {
              ...item,
              orignalNumber: item.number,
              number: item.number.join(", "),
              sorting: item.owner || item.name,
            };
          });

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

  const columns: ColumnDef<MyCustomer>[] = [
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
        <span className="break-words">{row.original.ownership_name || "—"}</span>
      ),
    },
    ...(isAdmin
      ? [
          {
            accessorKey: "lead_name",
            header: sortableHeader("Lead by"),
            size: 145,
            cell: ({ row }) => (
              <span className="break-words">{row.original.lead_name || "—"}</span>
            ),
          } satisfies ColumnDef<MyCustomer>,
        ]
      : []),
    {
      id: "number",
      header: sortableHeader("Number"),
      accessorFn: (item) =>
        Array.isArray(item.number) ? item.number.join(", ") : item.number || "",
      size: 155,
      cell: ({ row }) => (
        <span className="break-words">{row.getValue<string>("number") || "—"}</span>
      ),
    },
    {
      accessorKey: "industry",
      header: sortableHeader("Industry"),
      size: 135,
      cell: ({ row }) => <span>{row.original.industry || "—"}</span>,
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
      cell: ({ row }) => <span>{row.original.customer_group || "—"}</span>,
    },
    {
      accessorKey: "created_at",
      header: sortableHeader("Added"),
      size: 125,
      cell: ({ row }) =>
        row.original.created_at
          ? moment(row.original.created_at).format("DD MMM YYYY")
          : "—",
    },
    {
      id: "actions",
      header: "Actions",
      size: 90,
      cell: ({ row }) => {
        if (!(isAdmin || customer_delete_access)) return null;

        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg px-2.5 text-destructive hover:text-destructive"
            aria-label={`Delete ${row.original.name || row.original.owner || "customer"}`}
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
      const response = await axios.delete(`/${userID}/customer/${id}`);
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
      additionalFilter == "unassigned"
        ? !item.ownership
        : additionalFilter == "unsold"
          ? !item.machines
          : additionalFilter == "duplicate"
            ? item.orignalNumber?.some((num) => numCount[num] > 1)
            : additionalFilter == "mycustomers"
              ? (item.ownership === userID || item?.lead === userID)
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
          item?.orignalNumber.forEach((num) => {
            numberCount[num] = (numberCount[num] || 0) + 1;
          });
        }
      });
      setNumCount(numberCount);
    }
  }, [data]);

  async function handleMyCustomers() {
    setMyLoading(true);

    axios
      .get(`/${userID}/customer?member=false&mycustomer=true`)
      .then((response) => {
        const apiData = response.data;
        const temp = apiData.map((item: any) => {
          return {
            ...item,
            orignalNumber: item.number,
            number: item.number.join(", "),
            sorting: item.owner || item.name,
          };
        });

        setData([...temp]);
      })
      .finally(() => {
        setMyLoading(false);
      });
  }

  const filterItems = isAdmin
    ? [
      { value: "unassigned", label: "Unassigned" },
      { value: "unsold", label: "Unsold Customers" },
      { value: "mycustomers", label: "My Customers" },
      { value: "duplicate", label: "Duplicate" },
    ]
    : [
      { value: "unassigned", label: "Unassigned" },
      { value: "unsold", label: "Unsold Customers" },
      { value: "mycustomers", label: "My Customers" },
    ];

  return (
    <>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Heading title="All Customers" description="Manage your custoners" />

          <div className="flex gap-2">
            {isAdmin && (
              <Button onClick={() => setQuickAction(true)}>Quick Action</Button>
            )}
            {customer_add_access && (
              <Button onClick={() => setAddCustomer(true)}>
                Add new customer
              </Button>
            )}
          </div>

          <AddCustomerDialog
            user_id={userID}
            office={route_branch}
            ownership={
              isAdmin ||
              designation === "Customer Relationship Manager" ||
              designation === "Customer Relationship Manager (After Sales)"
            }
            user_designation={designation}
            visible={addCustomer}
            onClose={setAddCustomer}
            onRefresh={async () => {
              setData([]);
              await fetchData();
            }}
          />

          <AddQuickAction
            data={data.filter((item) => !item.ownership)}
            visible={quickAction}
            onClose={setQuickAction}
            onRefresh={(id, ownership, ownership_name) => {
              setData((prev) => {
                const updatedData = prev.map((item) => {
                  if (item.id === id) {
                    return {
                      ...item,
                      ownership: ownership ? ownership : undefined,
                      ownership_name: ownership ? ownership_name : "",
                    };
                  }
                  return item;
                });
                return updatedData;
              });
            }}
          />
        </div>

        <PageTable
          download={true}
          columns={columns}
          data={
            additionalFilter === "duplicate"
              ? filteredData.sort((a, b) =>
                (a?.sorting || "")
                  ?.toLowerCase()
                  ?.localeCompare(b?.sorting?.toLowerCase() || ""),
              )
              : filteredData
          }
          onRowClick={(val) => {
            if (val.id) {
              onReturn(val.id);
            }
          }}
        >
          <div className="flex flex-wrap justify-between gap-2">
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

              {designation === "Customer Relationship Manager" && (
                <Button
                  disabled={myLoading}
                  variant="outline"
                  onClick={() => {
                    handleMyCustomers();
                  }}
                >
                  {myLoading && <Spinner />} Show My Customers
                </Button>
              )}
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
    </>
  );
}
