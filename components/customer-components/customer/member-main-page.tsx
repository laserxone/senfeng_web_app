"use client";
import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table-without-pagination";
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
import { UserSearch } from "@/components/user-search";
import FilterSheet from "@/components/users/filterSheet";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer, MyCustomerResolved } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Filter, Trash2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "sonner";



export default function MemberMainPage({ onReturn }: { onReturn: (val: number) => void }) {
  const [additionalFilter, setAdditionalFilter] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState<MyCustomerResolved[]>([]);
  const { userID, isAdmin, designation, customer_delete_access, } = useUserDetail()
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [numCount, setNumCount] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [myLoading, setMyLoading] = useState(false)

  useEffect(() => {
    if (userID)
      fetchData().then(() => {
        setLoading(false);
      });
  }, [userID]);

  async function fetchData(startDate?: string, endDate?: string, user?: number) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID
          }/customer?machines=true&member=true&start_date=${startDate || ""
          }&end_date=${endDate || ""}&user=${user || ""}`
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

  const columns: ColumnDef<MyCustomerResolved>[] = [
    {
      accessorKey: "owner",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("owner")}</div>,
    },

    {
      accessorKey: "name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "ownership_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assigned To
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("ownership_name")}</div>,
    },
    {
      accessorKey: "number",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("number")}</div>,
    },
    {
      accessorKey: "industry",
      filterFn: "includesString",
      enableGlobalFilter: true,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Industry
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("industry")}</div>,
    },

    {
      accessorKey: "location",
      filterFn: "includesString",
      enableGlobalFilter: true,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("location")}</div>,
    },
    {
      accessorKey: "customer_group",
      enableGlobalFilter: true,
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Group
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer_group")}</div>,
    },
    {
      accessorKey: "machines",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Machines
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("machines")}</div>,
    },

    {
      accessorKey: "created_at",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Added
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")}
        </div>
      ),
    },

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const currentItem = row.original;

        const canDelete =
          isAdmin ||
          customer_delete_access === true;

        if (!canDelete) return null;

        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomerId(currentItem?.id);
              setShowConfirmation(true);
            }}
          >
            <Trash2 className="h-5 w-5 text-red-500" size={16} />
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
      const response = await axios.delete(
        `/${userID}/customer/${id}`
      );
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
        : true
    )
    .filter((item) =>
      selectedUser
        ? item?.ownership === selectedUser || item?.lead === selectedUser
        : true
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

  async function handleMyCustomers() {
    setMyLoading(true)

    axios
      .get(
        `/${userID
        }/customer?machines=true&member=true&mycustomer=true`
      )
      .then((response) => {
        const apiData: MyCustomer[] = response.data;
        const temp = apiData
          .map((item) => {
            return {
              ...item,
              machines: item?.machines?.join(", "),
              orignalNumber: item.number,
              number: item?.number?.join(", "),
              sorting: item.owner || item.name,
              order_nums: item?.machine_order_numbers?.join(", "),
            };
          })
          .filter((item) => item.member);
        setData([...temp]);
      })
      .finally(() => {
        setMyLoading(false);
      });

  }

  return (
    <>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between flex-wrap">
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
                  ?.localeCompare(b?.sorting?.toLowerCase() || "")
              )
              : filteredData
          }

          onRowClick={(val, e) => {
            if (val.id) {

              onReturn(val.id);
            }
          }}
        >
          <div className=" flex justify-between flex-wrap">
            <div className="flex gap-4 flex-wrap">
              {isAdmin && (
                <>
                  <div className="w-[300px]">
                    <UserSearch
                      placeholder="Filter user..."
                      value={selectedUser}
                      onReturn={setSelectedUser}
                    />
                  </div>
                  {isAdmin && (
                    <Select
                      onValueChange={setAdditionalFilter}
                      value={additionalFilter}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Additional filter..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {[
                            {
                              value: "duplicate",
                              label: "Duplicate",
                            },
                          ].map((framework) => (
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
                  )}
                  <Button
                    onClick={() => {
                      handleClear();
                    }}
                  >
                    Clear
                  </Button>

                </>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => setFilterVisible(true)}
                  variant="ghost"
                  className="p-0 w-8"
                >
                  <Filter />
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setResetLoading(true);
                    await fetchData();
                    setResetLoading(false);
                  }}
                >
                  {resetLoading && <Spinner />} Reset
                </Button>
                {designation === 'Customer Relationship Manager' &&
                  <Button disabled={myLoading} variant="outline"
                    onClick={() => {
                      handleMyCustomers()
                    }}
                  >
                    {myLoading && <Spinner />}  Show My Customers
                  </Button>
                }
              </div>
            </div>
          </div>
        </PageTable>
      </div>

      <ConfimationDialog
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
