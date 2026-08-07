"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { useRouter } from "nextjs-toploader/app";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileQuestion,
  ListPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  ListWorkspace,
  type CustomList,
  type ListColumn,
  type ListRow,
} from "./lists-page";

type DialogMode = "list" | "row" | "column" | "delete" | null;
type DeleteTarget = { type: "row" | "column"; id: string; name: string } | null;

const mapList = (list: Record<string, unknown>): CustomList => ({
  id: String(list.id),
  name: String(list.title || ""),
  description: String(list.description || ""),
  columns: Array.isArray(list.columns)
    ? list.columns.map((column: Record<string, unknown>) => ({
        id: String(column.id),
        name: String(column.name),
      }))
    : [],
  rows: [],
  recordCount: 0,
  isPinned: Boolean(list.is_pinned),
  updatedAt: list.updated_at
    ? new Date(String(list.updated_at)).toLocaleString()
    : "Just now",
});

export default function ListDetailPage({ id }: { id: string }) {
  const { userID, base_route } = useUserDetail();
  const router = useRouter();
  const url = `/${userID}/lists/${id}`;
  const [list, setList] = useState<CustomList | null>(null);
  const [mode, setMode] = useState<DialogMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [editingRow, setEditingRow] = useState<ListRow | null>(null);
  const [editingColumn, setEditingColumn] = useState<ListColumn | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const load = useCallback(async () => {
    if (!userID || !id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const response = await axios.get(url);
      const next = mapList(response.data);
      const cells = new Map<string, string>();
      response.data.cells?.forEach(
        (cell: { row_id: number; column_id: number; value: string | null }) =>
          cells.set(`${cell.row_id}-${cell.column_id}`, cell.value || ""),
      );
      next.rows = (response.data.rows || []).map((row: { id: number }) => ({
        id: String(row.id),
        values: Object.fromEntries(
          next.columns.map((column) => [
            column.id,
            cells.get(`${row.id}-${column.id}`) || "",
          ]),
        ),
      }));
      next.recordCount = next.rows.length;
      setList(next);
    } catch {
      setList(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, url, userID]);

  useEffect(() => {
    load();
  }, [load]);
  const close = () => {
    if (!pending) setMode(null);
  };
  const openListEdit = () => {
    if (!list) return;
    setName(list.name);
    setDescription(list.description);
    setMode("list");
  };
  const openRow = (row?: ListRow) => {
    if (!list) return;
    setEditingRow(row || null);
    setValues(
      row?.values ||
        Object.fromEntries(list.columns.map((column) => [column.id, ""])),
    );
    setMode("row");
  };
  const openColumn = (column?: ListColumn) => {
    setEditingColumn(column || null);
    setName(column?.name || "");
    setMode("column");
  };
  const save = async () => {
    if (!list || pending) return;
    if ((mode === "list" || mode === "column") && !name.trim())
      return toast.error("Please enter a name.");
    setPending(true);
    try {
      if (mode === "list")
        await axios.put(url, {
          title: name.trim(),
          description: description.trim(),
        });
      if (mode === "row") {
        if (editingRow)
          await axios.put(`${url}/rows/${editingRow.id}`, { values });
        else await axios.post(`${url}/rows`, { values });
      }
      if (mode === "column") {
        if (editingColumn)
          await axios.put(`${url}/columns/${editingColumn.id}`, {
            name: name.trim(),
          });
        else await axios.post(`${url}/columns`, { name: name.trim() });
      }
      toast.success(
        mode === "row"
          ? editingRow
            ? "Entry updated."
            : "Entry added."
          : mode === "column"
            ? editingColumn
              ? "Column updated."
              : "Column added."
            : "List updated.",
      );
      setMode(null);
      await load();
    } finally {
      setPending(false);
    }
  };
  const remove = async () => {
    if (!list || !deleteTarget || pending) return;
    setPending(true);
    try {
      await axios.delete(
        `${url}/${deleteTarget.type === "row" ? "rows" : "columns"}/${deleteTarget.id}`,
      );
      toast.success(
        `${deleteTarget.type === "row" ? "Entry" : "Column"} deleted.`,
      );
      setDeleteTarget(null);
      await load();
    } finally {
      setPending(false);
    }
  };
  if (loading)
    return (
      <div className="flex w-full min-h-[calc(100vh-10rem)] items-center justify-center px-4">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mb-4 flex size-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            <Spinner className="size-5" />
          </span>
          <p className="font-semibold text-foreground">Loading your list</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Getting the latest entries and columns ready.
          </p>
        </div>
      </div>
    );
  if (notFound || !list)
    return (
      <div className="flex w-full min-h-[calc(100vh-10rem)] items-center justify-center px-4">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mb-4 flex size-11 items-center justify-center rounded-xl border border-muted-foreground/15 bg-muted text-muted-foreground">
            <FileQuestion className="size-5" />
          </span>
          <p className="font-semibold text-foreground">List not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This list may have been deleted or you may no longer have access to
            it.
          </p>
          <Button
            variant="outline"
            className="mt-5 h-9 gap-2 rounded-lg"
            onClick={() => router.push(`/${base_route}/lists`)}
          >
            <ArrowLeft className="size-4" />
            Back to lists
          </Button>
        </div>
      </div>
    );
  const title =
    mode === "list"
      ? "Edit list"
      : mode === "row"
        ? editingRow
          ? "Edit entry"
          : "Add entry"
        : editingColumn
          ? "Edit column"
          : "Add column";
  const DialogIcon =
    mode === "list" || editingRow || editingColumn ? Pencil : ListPlus;
  return (
    <>
      <ListWorkspace
        list={list}
        onBack={() => router.push(`/${base_route}/lists`)}
        onEditList={openListEdit}
        onAddRow={() => openRow()}
        onEditRow={openRow}
        onDeleteRow={(row) =>
          setDeleteTarget({ type: "row", id: row.id, name: "this entry" })
        }
        onAddColumn={() => openColumn()}
        onEditColumn={openColumn}
        onDeleteColumn={(column) =>
          setDeleteTarget({ type: "column", id: column.id, name: column.name })
        }
      />
      <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-xl">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <DialogIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update the list information and save your changes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <div className="grid gap-3 p-3.5">
              {mode === "list" && (
                <>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    List name
                  </Label>
                  <Input
                    value={name}
                    disabled={pending}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    value={description}
                    disabled={pending}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </>
              )}
              {mode === "column" && (
                <>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Column name
                  </Label>
                  <Input
                    value={name}
                    disabled={pending}
                    onChange={(event) => setName(event.target.value)}
                  />
                </>
              )}
              {mode === "row" &&
                list.columns.map((column) => (
                  <div key={column.id} className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {column.name}
                    </Label>
                    <Input
                      value={values[column.id] || ""}
                      disabled={pending}
                      onChange={(event) =>
                        setValues({
                          ...values,
                          [column.id]: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                <Button variant="outline" onClick={close} disabled={pending}>
                  Cancel
                </Button>
                <Button
                  className="h-9 rounded-lg"
                  onClick={save}
                  disabled={pending}
                >
                  {pending && <Spinner />}
                  {pending ? "Saving changes" : "Save changes"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !pending && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-destructive/15 bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Delete {deleteTarget?.type === "row" ? "entry" : "column"}?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  This will permanently delete {deleteTarget?.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid gap-2 p-3.5 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              className="h-9 rounded-lg"
              variant="destructive"
              onClick={remove}
              disabled={pending}
            >
              {pending && <Spinner />}
              {pending ? "Deleting" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
