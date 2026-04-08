"use client";

import PageTable from "@/components/app-table-without-pagination";
import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown, Edit, Edit2, Plus } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import moment from "moment";
import { RequiredStar } from "../RequiredStar";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import DOPDFGatepass from "./do-pdf-gatepass";
import { pdf } from "@react-pdf/renderer";
import { GetProfileImage } from "@/lib/getProfileImage";
import { Progress } from "@/components/ui/progress";
import { DispatchOrderDialog } from "./dispatch-dialoges";

export default function MachineDelivery() {
  const { userID, name } = useUserDetail();
  const [data, setData] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState(null);

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/delivery`);
      setData(response.data);
    } finally {
      setLoading(false);
    }
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
                setSelectedDelivery(row.original);
               
              }}
            >
              Create Delivery
            </Button>
          );
        
      },
    },
  ];

 

  const generatePDF = async (item) => {
    const PDFData = {...item};

    try {
      const blob = await pdf(
        <DOPDFGatepass
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
      
        onRowClick={(val, event) => {}}
      >
        <MachineChecklist />
      </PageTable>

      <DispatchOrderDialog
        open={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onRefresh={fetchData}
        data={selectedDelivery}
        openPdf={generatePDF}
      />
    </div>
  );
}


const MachineChecklist = () => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  const [open, setOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [ID, setID] = useState(null);
  const [form, setForm] = useState({});

  async function fetchData() {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/settings`);
      setID(response.data?.id);
      const apiList = response.data?.machine_checklist;
      (setForm(apiList), setOpen(true));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key, val) {
    setForm((prev) => ({
      ...prev,
      [key]: val,
    }));
  }

  function handleChangeKey(oldKey, newKey) {
    if (!newKey || oldKey === newKey) return;

    setForm((prev) => {
      const updated = { ...prev };
      if (updated[newKey]) return prev;

      updated[newKey] = updated[oldKey];
      delete updated[oldKey];

      return updated;
    });
  }

  function handleAddNew() {
    const newKey = `new_key_${Date.now()}`;

    setForm((prev) => ({
      ...prev,
      [newKey]: "",
    }));
  }

  function onClose() {
    setOpen(false);
  }

  function normalizeKey(key) {
    return key.toLowerCase().trim().replace(/\s+/g, "_");
  }

  async function handleSave() {
    if (!userID || !ID) return;
    setSaveLoading(true);
    try {
      const formattedForm = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [normalizeKey(k), v]),
      );

      await axios.put(`/${userID}/settings`, {
        id: ID,
        machine_checklist: formattedForm,
      });
      onClose();
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <>
      <Button disabled={loading} onClick={fetchData}>
        {" "}
        {loading && <Spinner />}Configure Checklist
      </Button>

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Machine Checklist</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[70dvh] pr-4 py-2">
            <div className="space-y-4 px-2">
              {Object.entries(form).map(([k, v]) => (
                <div key={k} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Field Name</Label>
                    <Input
                      value={k}
                      onChange={(e) => handleChangeKey(k, e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Field Value</Label>
                    <Input
                      value={v}
                      placeholder={`Enter ${k.replaceAll("_", " ")}`}
                      onChange={(e) => handleChange(k, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={handleAddNew}>
                <Plus /> Add Field
              </Button>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saveLoading} onClick={handleSave}>
              {saveLoading && <Spinner />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};


