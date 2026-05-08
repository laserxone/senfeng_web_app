
import PageTable from "@/components/app-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Spinner from "@/components/ui/spinner";
import { Resume } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { useState } from "react";



export default function ResumesTable({ resumes, onRefresh, loading }: { resumes: Resume[], onRefresh: () => Promise<void>, loading: boolean }) {
  const [openCover, setOpenCover] = useState<string | null>(null)
  const [selectedDelete, setSelectedDelete] = useState<number | null>(null)

  const columns: ColumnDef<Resume>[] = [
    {
      accessorKey: "full_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Application
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="flex flex-col">
        <div>{row.getValue("full_name")}</div>
        <p>{row.original.email_address}</p>
      </div>,
    },

    {
      accessorKey: "phone_number",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Phone
            <ArrowUpDown />
          </Button>
        );
      },

    },
    {
      accessorKey: "current_location",
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

    },

    {
      accessorKey: "position_applied_for",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Position
            <ArrowUpDown />
          </Button>
        );
      },

    },

    {
      accessorKey: "experience_years",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Experience
            <ArrowUpDown />
          </Button>
        );
      },

    },

    {
      accessorKey: "status",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown />
          </Button>
        );
      },

    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <div className="flex justify-end">
            {currentItem.cvDownloadUrl
              ?
              <Button asChild size="sm">
                <a href={currentItem.cvDownloadUrl} target="_blank" rel="noreferrer" >
                  Open CV
                </a>
              </Button>
              : <Button size="sm" variant="outline" disabled > No CV </Button>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">

                {currentItem.cover_letter?.trim()?.length > 0 && (
                  <DropdownMenuItem
                    onClick={() => setOpenCover(currentItem.cover_letter)}
                  >
                    View Cover Letter
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => setSelectedDelete(currentItem.id)}>
                  <div onClick={(e) => e.preventDefault()}>
                    <DeleteDialog resume={currentItem} onRefresh={onRefresh} />
                  </div>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }
  ];


  return (

    <>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>

        <CardContent>
          {!loading && resumes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <h2 className="text-lg font-medium">No applications yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                New submissions will appear here.
              </p>
            </div>
          ) : (
            <PageTable
              loading={loading}
              columns={columns}
              data={resumes}
            />

          )}
        </CardContent>
      </Card>
      <Dialog open={!!openCover} onOpenChange={() => setOpenCover(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Cover Letter
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-lg border bg-muted/30 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {openCover || "No cover letter provided."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>

  );
}

const DeleteDialog = ({ resume, onRefresh }: { resume: Resume, onRefresh: () => Promise<void> }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {

    if (!resume.id) return
    setLoading(true)
    try {
      await axios.delete(`/api/careers/applications/${resume.id}`)
      await onRefresh()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <div
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        Delete
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this application?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the resume entry and remove
              the uploaded CV from Firebase Storage.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              disabled={loading}
              variant={"destructive"}
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
            >
              {loading && <Spinner />}  Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>

  )
}