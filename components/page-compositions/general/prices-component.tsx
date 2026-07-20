"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import PageTable from "@/components/shared/tables/app-table";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";

import { storage } from "@/config/firebase";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { PricesProps } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  Download,
  MoreHorizontal,
  Paperclip,
  Pencil,
  RefreshCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const emptyForm = {
  model: "",
  power: "",
  ddp: "",
  fob: "",
  fob_bottom: "",
  ddp_bottom: "",
  description: "",
};

export default function PricesComponent() {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [data, setData] = useState<PricesProps[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false)


  const [selectedForDelete, setSelectedForDelete] = useState<typeof emptyForm & { id?: number | null, attachment?: string | null } | null>(null)
  const [formData, setFormData] = useState<typeof emptyForm & { id?: number | null }>(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const { userID, isAdmin } = useUserDetail();

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    axios.get(`/${userID}/prices`).then((response) => {
      setData(response.data);
    });
  }

  const handleEditClick = (row: PricesProps) => {
    setFormData(row);
    setIsEdit(true);
    setOpenDialog(true);
  };

  const handleAddClick = () => {
    setFormData(emptyForm);
    setIsEdit(false);
    setOpenDialog(true);
  };

  const handleSave = () => {
    setLoading(true);
    if (isEdit) {
      axios
        .put(`/${userID}/prices/${formData.id}`, formData)
        .then(async () => {
          await fetchData();
        })
        .finally(() => {
          setLoading(false);
          setOpenDialog(false);
        });
    } else {
      axios
        .post(`/${userID}/prices`, formData)
        .then(async () => {
          await fetchData();
        })
        .finally(() => {
          setLoading(false);
          setOpenDialog(false);
        });
    }
  };

  const columns = useMemo(() => {
    const baseColumns: ColumnDef<PricesProps>[] = [
      {
        accessorKey: "model",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Model
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("model")}</div>,
      },

      {
        accessorKey: "power",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Power
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("power")}</div>,
      },

      {
        accessorKey: "ddp",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            DDP
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("ddp")}</div>,
      },
    ];

    const advancedColumns: ColumnDef<PricesProps>[] = showAdvanced
      ? [
        {
          accessorKey: "fob",
          header: "FOB",
          cell: ({ row }) => <div>{row.getValue("fob")}</div>,
        },
        {
          accessorKey: "fob_bottom",
          header: "FOB Bottom",
          cell: ({ row }) => <div>{row.getValue("fob_bottom")}</div>,
        },
        {
          accessorKey: "ddp_bottom",
          header: "DDP Bottom",
          cell: ({ row }) => <div>{row.getValue("ddp_bottom")}</div>,
        },
        {
          accessorKey: "description",
          header: "Description",
          cell: ({ row }) => <div>{row.getValue("description")}</div>,
        },
      ]
      : [];

    const adminColumn: ColumnDef<PricesProps>[] = isAdmin
      ? [
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditClick(row.original)}
                className="h-8 gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>

              <Attachment
                attachment_url={row.original?.attachment_url}
                attachment={row.original?.attachment}
                onRefresh={async () => {
                  await fetchData();
                }}
                id={row.original?.id}
              />
            </div>
          ),
        },
      ]
      : [];

    const otherColumn: ColumnDef<PricesProps>[] = !isAdmin
      ? [
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex gap-2">
              <Attachment
                attachment_url={row.original?.attachment_url}
                attachment={row.original?.attachment}
                onRefresh={async () => {
                  await fetchData();
                }}
                id={row.original?.id}
              />
            </div>
          ),
        },
      ]
      : [];

    return [...baseColumns, ...advancedColumns, ...adminColumn, ...otherColumn];
  }, [userID, isAdmin, showAdvanced]);

  async function handleDelete() {

    if (!selectedForDelete) return
    setDeleteLoading(true)
    try {
      if (selectedForDelete?.attachment) {
        await DeleteFromStorage(selectedForDelete?.attachment)
      }
      await axios.delete(`/${userID}/prices/${selectedForDelete?.id}`)
      toast.success("Entry deleted successfully")
      setSelectedForDelete(null)
      setFormData(emptyForm);
      setIsEdit(false);
      setOpenDialog(false);
      await fetchData()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex justify-between flex-wrap">
        <Heading title="Pricing" description="Manage machine pricings" />
      </div>
      {/* <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Price Table</h2>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                    >
                        {showAdvanced ? "Hide Extra Columns" : "Show Extra Columns"}
                    </Button>
                    {isAdmin && <Button onClick={handleAddClick}>Add New Entry</Button>}
                </div>

            </div>

            <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">Model</th>
                        <th className="border p-2">Power</th>
                        <th className="border p-2">DDP</th>
                        {showAdvanced && (
                            <>
                                <th className="border p-2">FOB</th>
                                <th className="border p-2">FOB Bottom</th>
                                <th className="border p-2">DDP Bottom</th>
                                 <th className="border p-2">Description</th>
                            </>
                        )}
                        {isAdmin && <th className="border p-2">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id}>
                            <td className="border p-2">{row.model}</td>
                            <td className="border p-2">{row.power}</td>
                            <td className="border p-2">{row.ddp}</td>
                            {showAdvanced && (
                                <>
                                    <td className="border p-2">{row.fob}</td>
                                    <td className="border p-2">{row.fob_bottom}</td>
                                    <td className="border p-2">{row.ddp_bottom}</td>
                                     <td className="border p-2">{row.description}</td>
                                </>
                            )}
                            {isAdmin &&
                                <td className="border p-2">
                                    <Button size="sm" onClick={() => handleEditClick(row)}>
                                        Edit
                                    </Button>
                                </td>
                            }
                        </tr>
                    ))}
                </tbody>
            </table> */}

      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          loading={loading}
          columns={columns}
          data={data}
        // onRowClick={(val) => {
        //     setImageURL(val);
        //     setVisible(true);
        // }}
        >
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              {showAdvanced ? "Hide Extra Columns" : "Show Extra Columns"}
            </Button>
            {isAdmin && <Button onClick={handleAddClick}>Add New Entry</Button>}
          </div>
        </PageTable>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Entry" : "Add New Entry"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            {Object.keys(emptyForm).map((field, i) => (
              <div key={i}>
                <Label className="uppercase">
                  {field.replaceAll("_", " ")}
                </Label>
                <Input
                  placeholder={"Enter " + field.replaceAll("_", " ")}
                  value={formData[field as keyof typeof formData] || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter >
            <div className="flex flex-col w-full gap-2">
              <Button disabled={loading} onClick={handleSave}>
                {loading && <Spinner />}Save
              </Button>
              {formData?.id &&
                <Button variant={"destructive"} onClick={() => setSelectedForDelete(formData)}>Delete</Button>}
            </div>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        loading={deleteLoading}
        open={!!selectedForDelete}
        title="Are you sure you want to delete?"
        description="Your action will remove attachment from the system"
        onPressYes={() => handleDelete()}
        onPressCancel={() => setSelectedForDelete(null)}
      />
    </div>
  );
}

const Attachment = ({ attachment, onRefresh, id, attachment_url }: { attachment?: string | null, onRefresh: () => Promise<void>, id: number, attachment_url?: string | null }) => {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { userID, isAdmin } = useUserDetail();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const uploadFile = async () => {
    if (!selectedFile) {
      toast.info("Please select at least one file to upload.")
      return;
    }

    setUploadLoading(true);
    await handleUpload();
  };

  async function handleUpload() {
    try {
      if (!selectedFile) return;

      if (attachment) {
        await DeleteFromStorage(attachment);
      }

      const filePath = `attachments/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytesResumable(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await axios.put(`/${userID}/prices/${id}`, {
        attachment: filePath,
        attachment_url: downloadURL,
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await onRefresh();
      toast.success("File uploaded successfully")
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Upload failed")
      console.error("Upload error:", error);
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleDownload() {
    window.open(attachment_url || "", "_blank");
  }

  async function handleDelete() {
    try {
      if (!attachment) return;
      setDeleteLoading(true);
      await DeleteFromStorage(attachment);
      await axios.put(`/${userID}/prices/${id}`, {
        attachment: "",
        attachment_url: "",
      });
      await onRefresh();
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Attachment
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          {attachment ? (
            <>
              <DropdownMenuItem onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => setOpen(true)} className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Reupload
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : isAdmin ? (
            <DropdownMenuItem onClick={() => setOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="gap-2">
              <Paperclip className="h-4 w-4" />
              No attachment
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attach file</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.length && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />

              {selectedFile && (
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <Button
              disabled={uploadLoading || !selectedFile}
              onClick={uploadFile}
              className="w-full gap-2"
            >
              {uploadLoading ? <Spinner /> : <Upload className="h-4 w-4" />}
              Upload File
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        loading={deleteLoading}
        open={deleteOpen}
        title="Are you sure you want to delete?"
        description="Your action will remove attachment from the system"
        onPressYes={() => handleDelete()}
        onPressCancel={() => setDeleteOpen(false)}
      />
    </>
  );
};
