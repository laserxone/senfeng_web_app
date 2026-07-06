"use client";

import PageTable from "@/components/app-table-without-pagination";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeliveryType } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";
import { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, ArrowUpDown, Clock3, Edit } from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { MyImgZooming } from "../img-zooming";
import { DispatchOrderEditDialog } from "./dispatch-dialoges";
import DOPDFGatepass from "./do-pdf-gatepass";

export default function MachineDelivered() {
  const { userID } = useUserDetail();
  const [data, setData] = useState<DeliveryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<DeliveryType | null>(null);

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/delivery/delivered`);
      const finalData = response.data?.map((item: DeliveryType) => ({ ...item, do: `DO-${item.id}` }))
      setData(finalData);
    } finally {
      setLoading(false);
    }
  }



  const columns: ColumnDef<DeliveryType>[] = useMemo(() => [
    {
      accessorKey: "do",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            DO
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("do")}</div>
      ),
    },
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
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("customer_owner")}</div>
      ),
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
      accessorKey: "order_no_arr",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order No
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const value = row.getValue("order_no_arr") as string[];
        return <div>{value?.join(" ")}</div>;
      },
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
      accessorKey: "slip",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const { no_request, payment_slip } = row.original;

        if (no_request) {
          return (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              <AlertCircle className="size-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                No Request
              </span>
            </div>
          );
        }

        if (!payment_slip) {
          return (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
              <Clock3 className="size-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                Pending
              </span>
            </div>
          );
        }

        return (
          <div className="inline-flex rounded-lg border border-emerald-100 bg-emerald-50 p-1">
            <MyImgZooming img={payment_slip} compact />
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {

        return (
          <div className="flex gap-2 items-center ">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                generatePDF(row.original);
              }}
            >
              Open DO
            </Button>
            <Button
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedForEdit(row.original);
              }}
            >
              <Edit />
            </Button>
          </div>
        );
      },
    },
  ], [data]);


  const generatePDF = async (item: DeliveryType) => {
    const PDFData = {
      order_no: `${item?.order_no_arr?.join(" ")} - ${item.serial_no} - ${item?.power} - ${item?.source}`,
      gate_pass: item?.do || item?.id,
      delivery_date: item?.delivery_date,
      to: `${item?.customer_name || item?.customer_owner} ${item?.customer_number?.length ? `(${item?.customer_number?.[0]})` : ""}`,
      tod: moment(item?.delivery_date).format("YYYY-MM-DD hh:mm A"),
      driver_number:
        item?.dispatch_information?.other_information?.driverNumber,
      driver_name: item?.dispatch_information?.other_information?.driverName,
      vehicle_no: item?.dispatch_information?.other_information?.vehicleNo,
      manager: item?.dispatch_information?.other_information?.manager,
      delivery_issued_by: item?.dispatch_information?.other_information?.issuedBy,
      checklist: item?.dispatch_information?.checklist,
    };

    try {
      const blob = await pdf(
        <DOPDFGatepass
          delivery_date={PDFData.delivery_date}
          from={PDFData.delivery_issued_by}
          vehicle_no={PDFData.vehicle_no}
          driver_no={PDFData.driver_number}
          driver_name={PDFData.driver_name}
          received_by={PDFData.to}
          order_no={PDFData.order_no}
          manager={PDFData.manager}
          gatepass={PDFData.gate_pass}
          gatepassType={"Outward Gate Pass"}
          time={PDFData.tod}
          items={PDFData.checklist}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 600000);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title="Machine Delivery"
          description="Manage machine deliveries"
        />
      </div>

      <PageTable
        loading={loading}
        columns={columns}
        data={data}
        onRowClick={(val, event) => { }}
      >
      </PageTable>

      <DispatchOrderEditDialog
        open={!!selectedForEdit}
        onClose={() => setSelectedForEdit(null)}
        onRefresh={fetchData}
        data={selectedForEdit}
      />
    </div>
  );
}





