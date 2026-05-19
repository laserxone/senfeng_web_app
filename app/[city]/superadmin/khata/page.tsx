"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Loader2, Pencil, Trash2 } from "lucide-react";
import moment from "moment";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import PageTable from "@/components/app-table-without-pagination"
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import Heading from "@/components/ui/heading";

type Khata = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    note: string | null;
    created_at: string;
};

const emptyForm = {
    name: "",
    start_date: "",
    end_date: "",
    note: "",
};

export default function KhataPage() {
    const [khatas, setKhatas] = useState<Khata[]>([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Khata | null>(null);
    const [form, setForm] = useState(emptyForm);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { userID } = useUserDetail();

    const fetchKhatas = async () => {
        if (!userID) return;

        try {
            setLoading(true);
            const res = await axios.get(`/${userID}/khata`);
            setKhatas(res.data || []);
        } catch (error) {
            console.error("Failed to fetch khata", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userID) fetchKhatas();
    }, [userID]);

    const handleCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setOpen(true);
    };

    const handleEdit = (khata: Khata) => {
        setEditing(khata);
        setForm({
            name: khata.name,
            start_date: khata.start_date?.slice(0, 10) || "",
            end_date: khata.end_date?.slice(0, 10) || "",
            note: khata.note || "",
        });
        setOpen(true);
    };

    const handleSubmit = async () => {
        if (!userID || !form.name || !form.start_date || !form.end_date) return;

        const payload = {
            ...form,
            start_date: new Date(form.start_date).toISOString(),
            end_date: new Date(form.end_date).toISOString(),
        };

        try {
            setSaving(true);

            if (editing) {
                await axios.put(`/${userID}/khata/${editing.id}`, payload);
            } else {
                await axios.post(`/${userID}/khata`, payload);
            }

            setOpen(false);
            setEditing(null);
            setForm(emptyForm);
            await fetchKhatas();
        } catch (error) {
            console.error("Failed to save khata", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!userID) return;

        const confirmed = confirm("Delete this khata?");
        if (!confirmed) return;

        try {
            setDeletingId(id);
            await axios.delete(`/${userID}/khata/${id}`);
            await fetchKhatas();
        } catch (error) {
            console.error("Failed to delete khata", error);
        } finally {
            setDeletingId(null);
        }
    };

    const columns: ColumnDef<Khata>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div>{row.getValue("name")}</div>,
            },
            {
                accessorKey: "start_date",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Duration
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div>
                        {row.getValue("start_date")
                            ? moment(new Date(row.getValue("start_date"))).format(
                                "YYYY-MM-DD",
                            )
                            : "-"} - {row.original.end_date ? moment(new Date(row.original.end_date)).format(
                                "YYYY-MM-DD",
                            )
                                : "-"}
                    </div>
                ),
            },
            {
                accessorKey: "end_date",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        End Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div>
                        {row.getValue("end_date")
                            ? moment(new Date(row.getValue("end_date"))).format("YYYY-MM-DD")
                            : "-"}
                    </div>
                ),
            },
            {
                accessorKey: "note",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Note
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div>{row.getValue("note") || "-"}</div>,
            },
            {
                accessorKey: "created_at",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div>
                        {row.getValue("created_at")
                            ? moment(new Date(row.getValue("created_at"))).format(
                                "YYYY-MM-DD",
                            )
                            : "-"}
                    </div>
                ),
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const currentItem = row.original;
                    const isDeleting = deletingId === currentItem.id;

                    return (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(currentItem);
                                }}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>

                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={isDeleting}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(currentItem.id);
                                }}
                            >
                                {isDeleting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [deletingId],
    );

    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex items-start justify-between">
                <Heading title="Khata" description="" />
                <Button onClick={handleCreate}>
                    New Khata
                </Button>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <PageTable columns={columns} data={khatas} />
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Khata" : "Create Khata"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Input
                            placeholder="Name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />

                        <Input
                            type="date"
                            value={form.start_date}
                            onChange={(e) =>
                                setForm({ ...form, start_date: e.target.value })
                            }
                        />

                        <Input
                            type="date"
                            value={form.end_date}
                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        />

                        <Textarea
                            placeholder="Note"
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={saving}
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button disabled={saving} onClick={handleSubmit}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}