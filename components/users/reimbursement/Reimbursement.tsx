"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Building2, Calendar, CircleCheck, Download, Filter, MapPin, ReceiptText, RotateCcw, Search, Trash2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState
} from "react";

import { Card, CardContent } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import exportToExcel from "@/lib/exportToExcel";
import { UserReimbursementType, UserReimbursementTypes } from "@/lib/types";
import { cn } from "@/lib/utils";
import moment from "moment";
import ConfirmationDialog from "../../alert-dialog";
import CurrencyFormatter from "../../currency-formatter";
import { MyImgZooming } from "../../img-zooming";
import { Badge } from "../../ui/badge";
import Spinner from "../../ui/spinner";
import FilterSheet from "../filter-sheet";
import AddReimbursementDialog from "./add-reimbursement";

export default function Reimbursement({
  id,
  passingData,
  onAddRefresh,
  onFilterReturn,
  onReset,
}: UserReimbursementTypes) {
  const { reimbursement_approval } = useUserDetail()
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<UserReimbursementType[]>([]);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<UserReimbursementType | null>(null)

  const [search, setSearch] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    setData([...passingData]);
  }, [passingData]);


  function handleDownload() {
    const headers = [
      "Date",
      "Customer",
      "City",
      "Amount",
      "Description",
      "Submitted By",
    ];

    const formattedData = [...data].map((item) => [
      moment(item.date).format("YYYY-MM-DD"),
      item.title,
      item?.city,
      Number(item.amount || 0),
      item.description,
      item.submitted_by_name,
    ]);
    exportToExcel(
      headers,
      formattedData,
      "Reimbursement.xlsx",
      false,
      "",
      false,
    );
  }


  async function handleDelete() {
    if (!selectedForDelete?.id) return
    setDeleteLoading(true)
    try {
      if (selectedForDelete.image) {
        if (selectedForDelete.image.includes("https")) {
        } else {
          DeleteFromStorage(selectedForDelete.image);
        }
      }
      await axios.delete(`/${id}/reimbursement/${selectedForDelete.id}`)
      await onAddRefresh()
    } finally {
      setDeleteLoading(false)
    }
  }





  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.customer?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1 flex-col">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm ring-1 ring-border/40">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-orange-100 text-orange-700">
                <ReceiptText className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Reimbursements</h3>
                <p className="text-xs text-muted-foreground">Travel & expense claims</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">

              <div className="rounded-xl border bg-card px-3 py-1.5 shadow-sm ring-1 ring-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-sm font-black text-foreground">PKR   <CurrencyFormatter amount={total} /></p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reimbursements..."
                className="h-8 rounded-lg bg-background pl-9 text-xs"
              />
            </div>
            <Button size="sm" variant="outline"
              onClick={() => setFilterVisible(true)}>
              <Filter />
              Filter
            </Button>
            <Button size="sm" variant="outline"
              onClick={handleDownload}>
              <Download />
              Export
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={resetLoading}
              onClick={async () => {
                setResetLoading(true);
                const startDate = moment().startOf("month").toISOString();
                const endDate = moment().endOf("month").toISOString();
                await onReset(startDate, endDate);
                setResetLoading(false);
              }}
            >
              {resetLoading ? <Spinner /> : <RotateCcw />}
              Reset
            </Button>
            <AddReimbursementDialog
              id={id}
              onRefresh={onAddRefresh}
              placeholder={"Add"}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/10">
              <AlertCircle className="size-7 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">No reimbursements found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <ReimbursementCard key={item.id} id={id} item={item} onClickDelete={(val) => setSelectedForDelete(val)}
                  onRefresh={onAddRefresh} />
              ))}
            </div>
          )}

        </div>
      </div>
      
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await onFilterReturn(val.start, val.end);
        }}
      />



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

const purposeColors: Record<string, string> = {
  "Sales Meeting": "bg-blue-100 text-blue-700 border-blue-200",
  "Complaint": "bg-rose-100 text-rose-700 border-rose-200",
  "Overhauling": "bg-amber-100 text-amber-700 border-amber-200",
  "New Installation": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Final Hand Over": "bg-violet-100 text-violet-700 border-violet-200",
};


function ReimbursementCard({ onRefresh, item, onClickDelete, id }: { id: string | number, item: UserReimbursementType, onClickDelete: (item: UserReimbursementType) => void, onRefresh: () => Promise<void> }) {
  const purposeClass = purposeColors[item.title] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const { reimbursement_approval } = useUserDetail()
  const [selectedForApproval, setSelectedForApproval] = useState<number | null>(null)

  async function handleVerify(rid: number) {
    if (!id || !rid) return
    setSelectedForApproval(rid)
    try {
      await axios.put(`/${id}/reimbursement/${rid}`, {
        verified: true
      })

      await onRefresh();
    } finally {
      setSelectedForApproval(null)
    }
  }
  return (
    <Card className="group overflow-hidden rounded-lg border bg-card p-0 shadow-sm ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/20">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch">
          <div className="flex shrink-0 flex-row items-center justify-between gap-3 rounded-md border bg-gradient-to-br from-muted/40 via-background to-muted/20 px-3 py-2.5 sm:w-44 sm:flex-col sm:items-start sm:justify-center">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
              <p className="mt-0.5 break-words text-lg font-black leading-tight text-foreground">
                PKR <CurrencyFormatter amount={item.amount} />
              </p>
            </div>
            <Badge variant="outline" className={cn("max-w-full rounded-md border px-2 py-0.5 text-[10px] font-semibold", purposeClass)}>
              {item.title}
            </Badge>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 break-words text-sm font-bold leading-5 text-foreground">
                    {item.customer || "General Expense"}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={"secondary"} className="text-[10px]">
                      {moment(item.date).format("MMM DD YYYY")}
                    </Badge>
                    <Badge className="text-[10px]" variant={item.verified ? "default" : "destructive"}>{item.verified ? "Approved" : "Pending"}</Badge>
                  </div>
                </div>
                {item.description && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1">
                  <Calendar className="size-3 shrink-0" />
                  {moment(item.date).format("YYYY-MM-DD")}
                </span>
                {item.city && (
                  <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1">
                    <MapPin className="size-3 shrink-0" />
                    {item.city}
                  </span>
                )}
                {item.customer && (
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-md border bg-background px-2 py-1">
                    <Building2 className="size-3 shrink-0" />
                    <span className="break-words">{item.customer}</span>
                  </span>
                )}
                {reimbursement_approval && !item.verified &&
                  <Button disabled={selectedForApproval === item?.id} size={"sm"} onClick={() => handleVerify(item?.id)}>
                    {selectedForApproval === item?.id ? <Spinner /> : <CircleCheck className="size-3.5" />}  Approve
                  </Button>
                }
                <Button onClick={() => onClickDelete(item)} variant={"destructive"} size={"icon-sm"}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {item.image && (
              <div className="shrink-0 overflow-hidden rounded-md border bg-muted/20 p-1 sm:w-24">

                <MyImgZooming img={item.image} />

              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




// const AddPurpose = ({ item, visible, onClose, onUpdate }: { item: UserReimbursementType | null, visible: boolean, onClose: () => void, onUpdate: (val: UserReimbursementType) => void }) => {
//   const [purpose, setPurpose] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { userID } = useUserDetail();

//   function handleClose() {
//     setPurpose("");
//     setLoading(false);
//     onClose();
//   }
//   async function handleSubmit() {
//     if (!item?.id) return;

//     try {
//       setLoading(true);
//       await axios.put(`/${userID}/reimbursement/${item.id}`, { title: purpose, purpose: true });
//       let updatedItem = { ...item };
//       updatedItem.purpose = purpose;
//       onUpdate(updatedItem);
//       handleClose();
//     } catch (error) {
//     } finally {
//       setLoading(false);
//     }
//   }
//   return (
//     <Dialog open={visible} onOpenChange={handleClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Add Missing Purpose</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4 mt-2">
//           <div className="space-y-2">
//             <Label>Select Purpose</Label>
//             <Select onValueChange={setPurpose} value={purpose}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select Purpose" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectGroup>
//                   <SelectItem value="New Installation">
//                     New Installation
//                   </SelectItem>
//                   <SelectItem value="Complaint">Complaint</SelectItem>
//                   <SelectItem value="Overhauling">Overhauling</SelectItem>
//                   <SelectItem value="Sales Meeting">Sales Meeting</SelectItem>
//                 </SelectGroup>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex justify-end gap-3 mt-6">
//           <Button variant="outline" onClick={handleClose}>
//             Cancel
//           </Button>

//           <Button disabled={loading || !purpose} onClick={handleSubmit}>
//             {loading && <Spinner />}
//             <span className="ml-1">Submit</span>
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
