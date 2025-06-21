"use client";
import {
  ArrowUpDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useContext, useEffect, useState } from "react";



import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { startHolyLoader } from "holy-loader";
import moment from "moment";
import { useRouter } from "next/navigation";
import AddCustomerDialog from "../addCustomer";

const tableHeader = [
  {
    value: "Name",
    label: "Name",
  },
  {
    value: "Owner",
    label: "Owner",
  },
  {
    value: "Industry",
    label: "Industry",
  },
  {
    value: "Group",
    label: "Group",
  },
  {
    value: "Location",
    label: "Location",
  },
];

export default function CustomerEmployee({
  id,
  customer_data,
  onRefresh,
  user_id,
  ownership,
  totalCustomerText,
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState([]);
  const [addCustomer, setAddCustomer] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      if (customer_data && customer_data.length > 0) {
        setData(customer_data);
      }
    }
  }, [id, customer_data]);

  async function fetchData() {
    axios.get(`/user/${id}/customer`).then((response) => {
      const filteredCustomers = response.data.filter(
        (customer) => !customer.member
      );
      setData(filteredCustomers);
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
      accessorKey: "industry",
      filterFn: "includesString",
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
      accessorKey: "group",
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
      cell: ({ row }) => <div>{row.getValue("group")}</div>,
    },

    {
      accessorKey: "location",
      filterFn: "includesString",
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

    // {
    //   id: "actions",
    //   cell: ({ row }) => {
    //     const currentItem = row.original;

    //     return (
    //       <Link
    //         href={`/${UserState.value.data?.base_route}/customer${currentItem.id}`}
    //       >
    //         <ChevronsRight />
    //       </Link>
    //       // <DropdownMenu>
    //       //   <DropdownMenuTrigger asChild>
    //       //     <Button variant="ghost" className="p-0 w-8">
    //       //       <MoreHorizontal className="h-4 w-4" />
    //       //     </Button>
    //       //   </DropdownMenuTrigger>
    //       //   <DropdownMenuContent align="end">
    //       //     <DropdownMenuLabel>Actions</DropdownMenuLabel>
    //       //     <Link href={`customer${currentItem.id}`}>
    //       //       <DropdownMenuItem className="hover:cursor-pointer">
    //       //         View
    //       //       </DropdownMenuItem>
    //       //     </Link>
    //       //     <DropdownMenuItem
    //       //       className="hover:cursor-pointer"
    //       //       onClick={() => setShowConfirmation(true)}
    //       //     >
    //       //       Delete
    //       //     </DropdownMenuItem>
    //       //   </DropdownMenuContent>
    //       // </DropdownMenu>
    //     );
    //   },
    // },
  ];



  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          totalCustomerText={totalCustomerText}
          totalCustomer={data.length}
          
          columns={columns}
          data={data} 
          totalItems={data.length}
       
          tableHeader={tableHeader}
          onRowClick={(val) => {
            if (val?.id) {
              startHolyLoader();
              router.push(
                `/${UserState.value.data?.base_route}/${val.member ? "member" : "customer"}/${val.id}`
              );
            }
          }}
          // filter={true}
          // onFilterClick={() => setFilterVisible(true)}
        >
          <div className=" flex justify-between">
            <div className="flex gap-4">
           

              {UserState.value.data &&
                UserState.value.data.customer_add_access && (
                  <Button onClick={() => setAddCustomer(true)}>
                    Add Customer
                  </Button>
                )}
            </div>
          </div>
        </PageTable>
      </div>

      <AddCustomerDialog
        user_id={UserState.value.data?.id}
        user_designation={UserState.value.data?.designation}
        ownership={ownership}
        visible={addCustomer}
        onClose={setAddCustomer}
        onRefresh={() => {
          setData([]);
          if (id) {
            fetchData();
          } else {
            onRefresh();
          }
        }}
      />

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      />
    </div>
  );
}
