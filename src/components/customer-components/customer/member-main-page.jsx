"use client";
import { ArrowUpDown, Trash, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useContext, useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";

import AddCustomerDialog from "@/components/addCustomer";
import AddQuickAction from "@/components/addQuickAction";
import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import AppCalendar from "@/components/appCalendar";
import PageContainer from "@/components/page-container";
import { Heading } from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BASE_URL } from "@/constants/data";
import { toast } from "@/hooks/use-toast";
import { UserContext } from "@/store/context/UserContext";
import axios from "axios";
import { startHolyLoader } from "holy-loader";
import moment from "moment";
import { useRouter } from "next/navigation";
import { UserSearch } from "@/components/user-search";

const tableHeader = [
  {
    value: "Owner",
    label: "Owner",
  },
  {
    value: "Name",
    label: "Company Name",
  },
  {
    value: "Number",
    label: "Number",
  },
  {
    value: "Industry",
    label: "Industry",
  },
  {
    value: "customer_group",
    label: "Group",
  },
  {
    value: "Location",
    label: "Location",
  },
  {
    value: "Machines",
    label: "Machines",
  },
];

export default function MemberMainPage() {
  const [value, setValue] = useState("");
  const [additionalFilter, setAdditionalFilter] = useState("");
  const pageTableRef = useRef();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [addCustomer, setAddCustomer] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [member, setMember] = useState(false);
  const router = useRouter();
  const [quickAction, setQuickAction] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (UserState.value.data?.id) fetchData();
  }, [UserState.value.data]);

  async function fetchData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`${BASE_URL}/customer/machines`)
        .then((response) => {
          const apiData = response.data;
          const temp = apiData
            .map((item) => {
              return {
                ...item,
                machines: item.machines.join(", "),
                number: item.number.join(", "),
              };
            })
            .filter((item) => item.member);

          const isLimited = UserState.value.data?.limited_access;
          const filteredData = isLimited
            ? temp.filter(
                (item) => item.created_by === UserState.value.data?.id
              )
            : temp;

          setData([...filteredData]);
        })
        .finally(() => {
          resolve(true);
        });
    });
  }

  const columns = [
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

        return (
          UserState.value.data &&
          UserState.value.data.customer_delete_access && (
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
          )
        );
      },
    },
  ];

  function handleClear() {
    setSelectedUser(null);
  }

  async function handleDelete(id) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${BASE_URL}/customer/${id}`);
      toast({ title: "Customer Deleted" });
      await fetchData();
    } catch (error) {
      toast({
        title: error?.response?.data?.message || "Netwrok error",
        variant: "desctructive",
      });
    } finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setSelectedCustomerId(null);
    }
  }

  const filteredData = data
    .filter((item) =>
      additionalFilter == "member"
        ? item.member === true
        : additionalFilter == "unassigned"
        ? !item.member === true
        : additionalFilter == "unsold"
        ? !item.machines
        : true
    )
    .filter((item) => (selectedUser ? item?.ownership === selectedUser : true));

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Heading title="All Members" description="Manage your members" />
        </div>

        <PageTable
          totalCustomerText={"Total Members"}
          totalCustomer={filteredData.length}
          columns={columns}
          data={filteredData}
          totalItems={filteredData.length}
          tableHeader={tableHeader}
          onRowClick={(val) => {
            if (val.id) {
              startHolyLoader();
              router.push(
                `/${UserState?.value?.data?.base_route}/member/detail?id=${val.id}`
              );
            }
          }}
          // filter={true}
          // onFilterClick={() => setFilterVisible(true)}
        >
          <div className=" flex justify-between">
            <div className="flex gap-4">
              {/* <div className="flex items-center gap-2">

              <Label>Members?</Label>
              <Checkbox
                checked={member}
                onCheckedChange={(checked) => setMember(checked)}
              />
              </div> */}

              {(UserState.value.data?.designation === "Owner" ||
                UserState.value.data?.full_access) && (
                  <>
                     <div className="w-[300px]">
                  <UserSearch
                    placeholder="Filter user..."
                    value={selectedUser}
                    onReturn={setSelectedUser}
                  />
                </div>
                <Button
                onClick={() => {
                  handleClear();
                }}
              >
                Clear
              </Button>
                  </>
             
              )}

             
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
    </PageContainer>
  );
}


