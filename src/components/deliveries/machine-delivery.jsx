'use client'

import PageTable from "@/components/app-table-without-pagination"
import { Button } from "@/components/ui/button"
import  Heading  from "@/components/ui/heading"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { ArrowUpDown } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"

export default function MachineDelivery(){
const {userID} = useUserDetail()
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)

useEffect(()=>{
    if(userID){
        fetchData()
    }
},[userID])

async function fetchData(){
    if(!userID) return
    setLoading(true)
    const response = await axios.get(`/${userID}/delivery`)
    setData(response.data)
    setLoading(false)
}

const columns = [
    {
      accessorKey: "customer_owner",
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
      cell: ({ row }) => <div className="ml-2">{row.getValue("customer_owner")}</div>,
    },

    {
      accessorKey: "customer_name",
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
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
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
            Manager
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("ownership_name")}</div>,
    },
 

     {
      accessorKey: "serial_no",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Serial No
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("serial_no")}</div>,
    },

     {
      accessorKey: "power",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Power
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("power")}</div>,
    },

     {
      accessorKey: "source",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("source")}</div>,
    },
   

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {

        return (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log(row.original)
            //   setSelectedCustomerId(currentItem?.id);
            //   setShowConfirmation(true);
            }}
          >
          Create Delivery
          </Button>
        );
      },
    },
  ];

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

    return (
       
           <div className="flex flex-1 flex-col space-y-4">
              <div className="flex items-start justify-between">
                <Heading title="Machine Delivery" description="Manage machine deliveries" />
              </div>
        
            
              <PageTable
                columns={columns}
                data={data}
                tableHeader={tableHeader}
                onRowClick={(val, event) => {
                 
                }}
              >
               
               
              </PageTable>
              
            </div>
    )
}