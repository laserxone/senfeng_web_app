"use client";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useContext, useEffect, useMemo, useState } from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { startHolyLoader } from "holy-loader";
import moment from "moment";
import { useRouter } from "next/navigation";
import AddCustomerDialog from "../addCustomer";
import Spinner from "../ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { RequiredStar } from "../RequiredStar";
import AppCalendar from "../appCalendar";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";

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
  ownership,
  totalCustomerText,
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState([]);
  const [addCustomer, setAddCustomer] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [next, setNext] = useState(null);
  const [top, setTop] = useState(false);
  const [satisfactory, setSatisfactory] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
 
      if (customer_data && customer_data.length > 0) {
        setData(customer_data);
      }
    
  }, [customer_data]);



  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "owner",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div className="ml-2">{row.getValue("owner")}</div>,
      },
      {
        accessorKey: "name",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "industry",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Industry
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("industry")}</div>,
      },
      {
        accessorKey: "number",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("number")}</div>,
      },
      {
        accessorKey: "location",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("location")}</div>,
      },
      {
        accessorKey: "created_at",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Added
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            {moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")}
          </div>
        ),
      },
    ];

    if (
      UserState.value.data?.designation === "Customer Relationship Manager" ||
      UserState.value.data?.designation === "Social Media Manager"
    ) {
      baseColumns.push({
        id: "actions",
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomer(currentItem);
                setShowFeedback(true);
              }}
            >
              Take Feedback
            </Button>
          );
        },
      });
    }

    return baseColumns;
  }, [UserState]);

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/${UserState.value.data?.id}/feedback`, {
        feedback: feedback,
        top_follow: false,
        type: "feedback",
        customer_id: selectedCustomer?.id,
        user_id: UserState.value.data?.id,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
        top_follow: top,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
        setShowFeedback(false);
      });
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1">
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
                `/${UserState.value.data?.base_route}/${
                  val.member ? "member" : "customer"
                }/${val.id}`
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
        base={`team/user/${UserState.value.data?.id}`}
        user_id={UserState.value.data?.id}
        user_designation={UserState.value.data?.designation}
        ownership={ownership}
        visible={addCustomer}
        onClose={setAddCustomer}
        onRefresh={() => {
          setData([]);
         
            onRefresh();
          
        }}
      />

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
            <div className="flex flex-1 flex-col gap-2">
              <h1>
                Enter Feedback <RequiredStar />
              </h1>
              <Input
                placeholder="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <h1>
                Next Follow Up <RequiredStar />
              </h1>
              <AppCalendar date={next} onChange={setNext} min={new Date()} />

              <div className="flex flex-row items-center gap-2">
                <h1>Top Follow up</h1>
                <Checkbox
                  checked={top}
                  onCheckedChange={(checked) => {
                    setTop(checked);
                  }}
                />
              </div>

              <div className="flex flex-row items-center gap-2">
                <h1>Satisfactory?</h1>
                <Checkbox
                  checked={satisfactory}
                  onCheckedChange={(checked) => {
                    setSatisfactory(checked);
                  }}
                />
              </div>
              <Button
                disabled={!next || !feedback}
                onClick={() => {
                  handleSaveFeedback();
                }}
              >
                {loading && <Spinner />} Save
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

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
