"use client";

import Heading from "@/components/ui/heading";
import axios from "@/lib/axios";
import useUserDetail from "@/hooks/use-user-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowUpRight,
  ClipboardList,
  Grid2X2,
  List as ListIcon,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ListColumn = { id: string; name: string };
type ListRow = { id: string; values: Record<string, string> };
type CustomList = {
  id: string;
  name: string;
  description: string;
  columns: ListColumn[];
  rows: ListRow[];
  recordCount?: number;
  isPinned?: boolean;
  updatedAt: string;
};
type ListForm = { name: string; description: string; columnCount: number };
type DeleteTarget = {
  type: "list" | "row" | "column";
  id: string;
  name: string;
} | null;

const emptyListForm = { name: "", description: "", columnCount: 3 };

export default function ListsPage() {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listForm, setListForm] = useState(emptyListForm);
  const [columnNames, setColumnNames] = useState<string[]>([
    "Column 1",
    "Column 2",
    "Column 3",
  ]);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowValues, setRowValues] = useState<Record<string, string>>({});
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnName, setColumnName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [search, setSearch] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [gridView, setGridView] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userID } = useUserDetail();

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? null,
    [activeListId, lists],
  );
  const visibleLists = useMemo(
    () =>
      lists.filter((list) =>
        `${list.name} ${list.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [lists, search],
  );
  const pinnedLists = visibleLists.filter((list) =>
    pinnedIds.includes(list.id),
  );
  const otherLists = visibleLists.filter(
    (list) => !pinnedIds.includes(list.id),
  );

  const listUrl = `/${userID}/lists`;
  const toList = useCallback(
    (list: Record<string, unknown>): CustomList => ({
      id: String(list.id),
      name: String(list.title || ""),
      description: String(list.description || ""),
      columns: Array.isArray(list.columns)
        ? list.columns.map((column: Record<string, unknown>) => ({
            id: String(column.id),
            name: String(column.name),
          }))
        : [],
      rows: Array.isArray(list.rows)
        ? list.rows.map((row: Record<string, unknown>) => ({
            id: String(row.id),
            values: {},
          }))
        : [],
      recordCount: Number(
        list.record_count || (Array.isArray(list.rows) ? list.rows.length : 0),
      ),
      isPinned: Boolean(list.is_pinned),
      updatedAt: list.updated_at
        ? new Date(String(list.updated_at)).toLocaleString()
        : "Just now",
    }),
    [],
  );

  const fetchLists = useCallback(async () => {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await axios.get(listUrl);
      const mapped = response.data.map(toList);
      setLists(mapped);
      setPinnedIds(
        mapped.filter((list) => list.isPinned).map((list) => list.id),
      );
    } finally {
      setLoading(false);
    }
  }, [userID, listUrl, toList]);

  const openList = async (listId: string) => {
    try {
      const response = await axios.get(`${listUrl}/${listId}`);
      const detail = toList(response.data);
      const cellValues = new Map<string, string>();
      response.data.cells?.forEach(
        (cell: { row_id: number; column_id: number; value: string | null }) =>
          cellValues.set(`${cell.row_id}-${cell.column_id}`, cell.value || ""),
      );
      detail.rows = response.data.rows.map((row: { id: number }) => ({
        id: String(row.id),
        values: Object.fromEntries(
          detail.columns.map((column) => [
            column.id,
            cellValues.get(`${row.id}-${column.id}`) || "",
          ]),
        ),
      }));
      detail.recordCount = detail.rows.length;
      setLists((current) =>
        current.map((item) => (item.id === listId ? detail : item)),
      );
      setActiveListId(listId);
    } catch {
      /* axios interceptor displays the error */
    }
  };

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const resetListDialog = () => {
    setListForm(emptyListForm);
    setColumnNames(["Column 1", "Column 2", "Column 3"]);
    setEditingListId(null);
  };

  const openCreateList = () => {
    resetListDialog();
    setListDialogOpen(true);
  };

  const openEditList = (list: CustomList) => {
    setEditingListId(list.id);
    setListForm({
      name: list.name,
      description: list.description,
      columnCount: list.columns.length,
    });
    setColumnNames(list.columns.map((column) => column.name));
    setListDialogOpen(true);
  };

  const changeColumnCount = (value: number) => {
    const count = Math.max(1, Math.min(20, Number.isFinite(value) ? value : 1));
    setListForm((form) => ({ ...form, columnCount: count }));
    setColumnNames((current) =>
      Array.from(
        { length: count },
        (_, index) => current[index] || `Column ${index + 1}`,
      ),
    );
  };

  const saveList = async () => {
    const name = listForm.name.trim();
    const names = columnNames.map(
      (column, index) => column.trim() || `Column ${index + 1}`,
    );
    if (!name) return toast.error("Please enter a list name.");
    if (
      new Set(names.map((column) => column.toLowerCase())).size !== names.length
    ) {
      return toast.error("Column names must be unique.");
    }

    if (editingListId) {
      try {
        const current = lists.find((list) => list.id === editingListId);
        await axios.put(`${listUrl}/${editingListId}`, {
          title: name,
          description: listForm.description.trim(),
        });
        await Promise.all(
          names.map((columnName, index) =>
            current?.columns[index]
              ? axios.put(
                  `${listUrl}/${editingListId}/columns/${current.columns[index].id}`,
                  { name: columnName },
                )
              : axios.post(`${listUrl}/${editingListId}/columns`, {
                  name: columnName,
                }),
          ),
        );
        await Promise.all(
          (current?.columns.slice(names.length) || []).map((column) =>
            axios.delete(`${listUrl}/${editingListId}/columns/${column.id}`),
          ),
        );
        await fetchLists();
        if (activeListId === editingListId) await openList(editingListId);
        toast.success("List updated.");
      } catch {
        return;
      }
    } else {
      try {
        await axios.post(listUrl, {
          title: name,
          description: listForm.description.trim(),
          columns: names,
        });
        await fetchLists();
        toast.success("List created.");
      } catch {
        return;
      }
    }
    setListDialogOpen(false);
    resetListDialog();
  };

  const openAddRow = () => {
    if (!activeList) return;
    setEditingRowId(null);
    setRowValues(
      Object.fromEntries(activeList.columns.map((column) => [column.id, ""])),
    );
    setRowDialogOpen(true);
  };

  const openEditRow = (row: ListRow) => {
    setEditingRowId(row.id);
    setRowValues(row.values);
    setRowDialogOpen(true);
  };

  const saveRow = async () => {
    if (!activeList) return;
    try {
      const values = Object.fromEntries(Object.entries(rowValues));
      if (editingRowId)
        await axios.put(`${listUrl}/${activeList.id}/rows/${editingRowId}`, {
          values,
        });
      else await axios.post(`${listUrl}/${activeList.id}/rows`, { values });
      await openList(activeList.id);
      toast.success(editingRowId ? "Entry updated." : "Entry added.");
      setRowDialogOpen(false);
    } catch {
      return;
    }
  };

  const openAddColumn = () => {
    setEditingColumnId(null);
    setColumnName("");
    setColumnDialogOpen(true);
  };

  const openEditColumn = (column: ListColumn) => {
    setEditingColumnId(column.id);
    setColumnName(column.name);
    setColumnDialogOpen(true);
  };

  const saveColumn = async () => {
    if (!activeList || !columnName.trim())
      return toast.error("Please enter a column name.");
    const name = columnName.trim();
    if (
      activeList.columns.some(
        (column) =>
          column.id !== editingColumnId &&
          column.name.toLowerCase() === name.toLowerCase(),
      )
    )
      return toast.error("Column names must be unique.");
    try {
      if (editingColumnId)
        await axios.put(
          `${listUrl}/${activeList.id}/columns/${editingColumnId}`,
          { name },
        );
      else await axios.post(`${listUrl}/${activeList.id}/columns`, { name });
      await openList(activeList.id);
      toast.success(editingColumnId ? "Column updated." : "Column added.");
      setColumnDialogOpen(false);
    } catch {
      return;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "list") {
      try {
        await axios.delete(`${listUrl}/${deleteTarget.id}`);
      } catch {
        return;
      }
      setLists((current) =>
        current.filter((list) => list.id !== deleteTarget.id),
      );
      if (activeListId === deleteTarget.id) setActiveListId(null);
      toast.success("List deleted.");
    }
    if (deleteTarget.type === "row" && activeList) {
      try {
        await axios.delete(
          `${listUrl}/${activeList.id}/rows/${deleteTarget.id}`,
        );
        await openList(activeList.id);
      } catch {
        return;
      }
      toast.success("Entry deleted.");
    }
    if (deleteTarget.type === "column" && activeList) {
      try {
        await axios.delete(
          `${listUrl}/${activeList.id}/columns/${deleteTarget.id}`,
        );
        await openList(activeList.id);
      } catch {
        return;
      }
      toast.success("Column and its entries deleted.");
    }
    setDeleteTarget(null);
  };

  if (activeList)
    return (
      <>
        <ListWorkspace
          list={activeList}
          onBack={() => setActiveListId(null)}
          onEditList={() => openEditList(activeList)}
          onAddRow={openAddRow}
          onEditRow={openEditRow}
          onDeleteRow={(row) =>
            setDeleteTarget({ type: "row", id: row.id, name: "this entry" })
          }
          onAddColumn={openAddColumn}
          onEditColumn={openEditColumn}
          onDeleteColumn={(column) =>
            setDeleteTarget({
              type: "column",
              id: column.id,
              name: column.name,
            })
          }
        />
        <ListDialog
          open={listDialogOpen}
          onOpenChange={setListDialogOpen}
          form={listForm}
          setForm={setListForm}
          columnNames={columnNames}
          setColumnNames={setColumnNames}
          onCountChange={changeColumnCount}
          onSave={saveList}
          isEditing={!!editingListId}
        />
        <RowDialog
          list={activeList}
          open={rowDialogOpen}
          onOpenChange={setRowDialogOpen}
          values={rowValues}
          setValues={setRowValues}
          onSave={saveRow}
          isEditing={!!editingRowId}
        />
        <ColumnDialog
          open={columnDialogOpen}
          onOpenChange={setColumnDialogOpen}
          name={columnName}
          setName={setColumnName}
          onSave={saveColumn}
          isEditing={!!editingColumnId}
        />
        <DeleteDialog
          target={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </>
    );

  return (
    <>
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Lists</h1>
              <span className="rounded-md bg-muted p-1.5">
                <Grid2X2 className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, manage and organize all your custom lists in one place.
            </p>
          </div>
          <Button onClick={openCreateList} className="gap-2">
            <Plus className="h-4 w-4" />
            Create new list
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search lists..."
            />
          </div>
          <div className="flex rounded-md border p-1">
            <Button
              variant={gridView ? "ghost" : "secondary"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setGridView(false)}
              aria-label="Table view"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={gridView ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setGridView(true)}
              aria-label="Grid view"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {pinnedLists.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Pinned</h2>
              <span className="text-sm text-muted-foreground">
                Quick access to your important lists
              </span>
            </div>
            {pinnedLists.map((list) => (
              <ListSummary
                key={list.id}
                list={list}
                pinned
                onOpen={() => openList(list.id)}
                onEdit={() => openEditList(list)}
                onDelete={() =>
                  setDeleteTarget({
                    type: "list",
                    id: list.id,
                    name: list.name,
                  })
                }
                onPin={async () => {
                  await axios.put(`${listUrl}/${list.id}`, {
                    is_pinned: false,
                  });
                  setPinnedIds((ids) => ids.filter((id) => id !== list.id));
                }}
              />
            ))}
          </section>
        )}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-semibold">All lists</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {visibleLists.length}{" "}
              {visibleLists.length === 1 ? "list" : "lists"}
            </span>
          </div>
          {loading ? (
            <div className="rounded-xl border p-12 text-center text-sm text-muted-foreground">
              Loading lists...
            </div>
          ) : lists.length === 0 ? (
            <div className="flex min-h-[330px] flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="font-semibold">Create your first list</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Set up custom columns, then add as many entries as you need.
              </p>
              <Button onClick={openCreateList} className="mt-5 gap-2">
                <Plus className="h-4 w-4" />
                Create new list
              </Button>
            </div>
          ) : gridView ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {otherLists.map((list) => (
                <ListSummary
                  key={list.id}
                  list={list}
                  onOpen={() => openList(list.id)}
                  onEdit={() => openEditList(list)}
                  onDelete={() =>
                    setDeleteTarget({
                      type: "list",
                      id: list.id,
                      name: list.name,
                    })
                  }
                  onPin={async () => {
                    await axios.put(`${listUrl}/${list.id}`, {
                      is_pinned: true,
                    });
                    setPinnedIds((ids) => [...ids, list.id]);
                  }}
                />
              ))}
            </div>
          ) : (
            <ListsTable
              lists={otherLists}
              onOpen={openList}
              onEdit={openEditList}
              onDelete={(list) =>
                setDeleteTarget({ type: "list", id: list.id, name: list.name })
              }
              onPin={async (list) => {
                await axios.put(`${listUrl}/${list.id}`, { is_pinned: true });
                setPinnedIds((ids) => [...ids, list.id]);
              }}
            />
          )}
        </section>
      </div>
      <ListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        form={listForm}
        setForm={setListForm}
        columnNames={columnNames}
        setColumnNames={setColumnNames}
        onCountChange={changeColumnCount}
        onSave={saveList}
        isEditing={!!editingListId}
      />
      <DeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function ListWorkspace({
  list,
  onBack,
  onEditList,
  onAddRow,
  onEditRow,
  onDeleteRow,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}: {
  list: CustomList;
  onBack: () => void;
  onEditList: () => void;
  onAddRow: () => void;
  onEditRow: (row: ListRow) => void;
  onDeleteRow: (row: ListRow) => void;
  onAddColumn: () => void;
  onEditColumn: (column: ListColumn) => void;
  onDeleteColumn: (column: ListColumn) => void;
}) {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label="Back to lists"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Heading
            panel
            title={list.name}
            description={list.description || "Manage columns and entries."}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEditList} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit list
          </Button>
          <Button variant="outline" onClick={onAddColumn} className="gap-2">
            <Plus className="h-4 w-4" />
            Add column
          </Button>
          <Button onClick={onAddRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Add entry
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted/60">
              <tr>
                {list.columns.map((column) => (
                  <th
                    key={column.id}
                    className="min-w-44 border-b px-4 py-3 text-left font-semibold"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{column.name}</span>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEditColumn(column)}
                          aria-label={`Edit ${column.name} column`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDeleteColumn(column)}
                          aria-label={`Delete ${column.name} column`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="w-28 border-b px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {list.rows.length ? (
                list.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    {list.columns.map((column) => (
                      <td
                        key={column.id}
                        className="max-w-72 border-b px-4 py-3 text-muted-foreground"
                      >
                        {row.values[column.id] || (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    ))}
                    <td className="border-b px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditRow(row)}
                          aria-label="Edit entry"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDeleteRow(row)}
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={list.columns.length + 1}
                    className="px-6 py-20 text-center text-muted-foreground"
                  >
                    No entries yet. Add the first row to this list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ListSummary({
  list,
  pinned = false,
  onOpen,
  onEdit,
  onDelete,
  onPin,
}: {
  list: CustomList;
  pinned?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ClipboardList className="h-5 w-5" />
      </div>
      <button className="min-w-48 flex-1 text-left" onClick={onOpen}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{list.name}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            Active
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.description || "No description added."}
        </p>
      </button>
      <div className="text-center">
        <p className="font-semibold">{list.recordCount ?? list.rows.length}</p>
        <p className="mt-1 text-xs text-muted-foreground">Records</p>
      </div>
      <div className="min-w-28">
        <p className="text-sm">{list.updatedAt}</p>
        <p className="mt-1 text-xs text-muted-foreground">Last updated</p>
      </div>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" onClick={onOpen} className="gap-1.5">
          <ArrowUpRight className="h-4 w-4" />
          Open
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onPin}
          aria-label={pinned ? "Unpin list" : "Pin list"}
        >
          <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onEdit}
          aria-label="Edit list"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          aria-label="Delete list"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ListsTable({
  lists,
  onOpen,
  onEdit,
  onDelete,
  onPin,
}: {
  lists: CustomList[];
  onOpen: (id: string) => void;
  onEdit: (list: CustomList) => void;
  onDelete: (list: CustomList) => void;
  onPin: (list: CustomList) => void;
}) {
  if (!lists.length)
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        No lists match your search.
      </div>
    );
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">List title</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Records</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lists.map((list) => (
              <tr key={list.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <button
                    className="flex items-center gap-3 text-left"
                    onClick={() => onOpen(list.id)}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-medium text-foreground">
                        {list.name}
                      </span>
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Active
                      </span>
                    </span>
                  </button>
                </td>
                <td className="max-w-80 px-4 py-3 text-muted-foreground">
                  {list.description || "No description added."}
                </td>
                <td className="px-4 py-3">
                  {list.recordCount ?? list.rows.length}
                </td>
                <td className="px-4 py-3">
                  <span className="block">{list.updatedAt}</span>
                  <span className="text-xs text-muted-foreground">
                    Last updated
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpen(list.id)}
                      className="gap-1.5"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPin(list)}
                      aria-label="Pin list"
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(list)}
                      aria-label="Edit list"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(list)}
                      aria-label="Delete list"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListDialog({
  open,
  onOpenChange,
  form,
  setForm,
  columnNames,
  setColumnNames,
  onCountChange,
  onSave,
  isEditing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ListForm;
  setForm: (form: ListForm) => void;
  columnNames: string[];
  setColumnNames: (names: string[]) => void;
  onCountChange: (count: number) => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit list" : "Create a list"}</DialogTitle>
          <DialogDescription>
            Choose the initial columns for your spreadsheet. You can add columns
            later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>List name</Label>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="e.g. Machine inventory"
            />
          </div>
          <div className="grid gap-2">
            <Label>
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="What is this list for?"
            />
          </div>
          <div className="grid gap-2">
            <Label>Number of columns</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={form.columnCount}
              onChange={(event) => onCountChange(Number(event.target.value))}
            />
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="mb-3 text-sm font-medium">Column names</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {columnNames.map((name: string, index: number) => (
                <Input
                  key={index}
                  value={name}
                  onChange={(event) =>
                    setColumnNames(
                      columnNames.map((item: string, itemIndex: number) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  placeholder={`Column ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {isEditing ? "Save changes" : "Create list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowDialog({
  list,
  open,
  onOpenChange,
  values,
  setValues,
  onSave,
  isEditing,
}: {
  list: CustomList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: Record<string, string>;
  setValues: (values: Record<string, string>) => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit entry" : "Add entry"}</DialogTitle>
          <DialogDescription>
            Fill in the values for each column.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {list.columns.map((column: ListColumn) => (
            <div key={column.id} className="grid gap-2">
              <Label>{column.name}</Label>
              <Input
                value={values[column.id] || ""}
                onChange={(event) =>
                  setValues({ ...values, [column.id]: event.target.value })
                }
                placeholder={`Enter ${column.name}`}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {isEditing ? "Save changes" : "Add entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColumnDialog({
  open,
  onOpenChange,
  name,
  setName,
  onSave,
  isEditing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  setName: (name: string) => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit column" : "Add column"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Rename this column."
              : "The new column will be added to every entry."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label>Column name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onSave()}
            placeholder="e.g. Quantity"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {isEditing ? "Save changes" : "Add column"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const noun =
    target?.type === "column"
      ? "column"
      : target?.type === "row"
        ? "entry"
        : "list";
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {noun}?</DialogTitle>
          <DialogDescription>
            {target?.type === "column"
              ? `Deleting “${target?.name}” permanently removes every value in that column from this list.`
              : `This will permanently delete ${target?.name}.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
