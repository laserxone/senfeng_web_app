"use client";

import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import AppCalendar from "@/components/features/calendar/app-calendar";
import { Badge } from "@/components/ui/badge";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";

type Khata = {
    id: number;
    name: string;
    start_date: Date | undefined;
    end_date: Date | undefined;
    note: string | null;
    created_at: string;
    total_amount: number | string
};

const emptyKhataForm: {
    name: string
    start_date: Date | undefined
    end_date: Date | undefined
    note: string
} = {
    name: "",
    start_date: undefined,
    end_date: undefined,
    note: "",
};

export default function KhataPage() {
    const router = useRouter();
    const { userID, base_route } = useUserDetail();

    const [khatas, setKhatas] = useState<Khata[]>([]);
    const [khataOpen, setKhataOpen] = useState(false);
    const [editingKhata, setEditingKhata] = useState<Khata | null>(null);
    const [khataForm, setKhataForm] = useState(emptyKhataForm);

    const [khataLoading, setKhataLoading] = useState(false);
    const [savingKhata, setSavingKhata] = useState(false);
    const [deletingKhataId, setDeletingKhataId] = useState<number | null>(null);
    const [khataErrors, setKhataErrors] = useState({
        name: "",
        start_date: "",
        end_date: "",
        note: "",
    });

    const fetchKhatas = async () => {
        if (!userID) return;

        try {
            setKhataLoading(true);
            const res = await axios.get(`/${userID}/khata`);
            setKhatas(res.data || []);
        } finally {
            setKhataLoading(false);
        }
    };

    useEffect(() => {
        if (userID) fetchKhatas();
    }, [userID]);

    const openKhataCreate = () => {
        setEditingKhata(null);
        setKhataForm(emptyKhataForm);
        setKhataErrors({
            name: "",
            start_date: "",
            end_date: "",
            note: "",
        });
        setKhataOpen(true);
    };

    const openKhataEdit = (khata: Khata) => {
        setEditingKhata(khata);
        setKhataForm({
            name: khata.name,
            start_date: khata.start_date,
            end_date: khata.end_date,
            note: khata.note || "",
        });
        setKhataErrors({
            name: "",
            start_date: "",
            end_date: "",
            note: "",
        });
        setKhataOpen(true);
    };

    const saveKhata = async () => {
        if (!userID) return;

        const isValid = validateKhataForm();
        if (!isValid) return;

        const payload = {
            name: khataForm.name.trim(),
            start_date: khataForm.start_date,
            end_date: khataForm.end_date,
            note: khataForm.note.trim(),
        };

        try {
            setSavingKhata(true);

            if (editingKhata) {
                await axios.put(`/${userID}/khata/${editingKhata.id}`, payload);
            } else {
                await axios.post(`/${userID}/khata`, payload);
            }

            setKhataOpen(false);
            setEditingKhata(null);
            setKhataForm(emptyKhataForm);
            await fetchKhatas();
        } finally {
            setSavingKhata(false);
        }
    };

    const deleteKhata = async (id: number) => {
        if (!userID) return;
        if (!confirm("Delete this khata?")) return;

        try {
            setDeletingKhataId(id);
            await axios.delete(`/${userID}/khata/${id}`);
            await fetchKhatas();
        } finally {
            setDeletingKhataId(null);
        }
    };

    const validateKhataForm = () => {
        const errors = {
            name: "",
            start_date: "",
            end_date: "",
            note: "",
        };

        if (!khataForm.name.trim()) {
            errors.name = "Name is required";
        }

        if (!khataForm.start_date) {
            errors.start_date = "Start date is required";
        }

        if (!khataForm.end_date) {
            errors.end_date = "End date is required";
        }

        if (!khataForm.note.trim()) {
            errors.note = "Note is required";
        }

        if (
            khataForm.start_date &&
            khataForm.end_date &&
            new Date(khataForm.end_date) < new Date(khataForm.start_date)
        ) {
            errors.end_date = "End date cannot be less than start date";
        }

        setKhataErrors(errors);

        return !Object.values(errors).some(Boolean);
    };

    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <Heading title="Khata" description="" />

                <Button onClick={openKhataCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Khata
                </Button>
            </div>

            {khataLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {khatas.map((khata) => {
                        const isDeleting = deletingKhataId === khata.id;

                        return (
                            <Card
                                key={khata.id}
                                className="transition hover:border-primary"

                            >

                                <CardContent className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-semibold tracking-tight">
                                                {khata.name}
                                            </h3>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {moment(khata.start_date).format("DD MMM YYYY")} to{" "}
                                                {moment(khata.end_date).format("DD MMM YYYY")}
                                            </p>
                                        </div>

                                        <Badge
                                            className="
        shrink-0 rounded-md
        bg-primary/10
        px-3 py-1
        text-sm font-semibold
        text-primary
        hover:bg-primary/10
      "
                                        >
                                            PKR {Number(khata.total_amount).toLocaleString()}
                                        </Badge>
                                    </div>

                                    {khata.note ? (
                                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                                            {khata.note}
                                        </p>
                                    ) : (
                                        <p className="text-sm italic text-muted-foreground">
                                            No note added
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between border-t pt-3">
                                        <div className="text-xs text-muted-foreground">
                                            Created{" "}
                                            <span className="font-medium text-foreground">
                                                {moment(khata.created_at).format("DD MMM YYYY")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                className="h-8"
                                                onClick={() =>
                                                    router.push(`/${base_route}/khata/${khata.id}`)
                                                }
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openKhataEdit(khata);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="h-8 w-8"
                                                disabled={isDeleting}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteKhata(khata.id);
                                                }}
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={khataOpen} onOpenChange={setKhataOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingKhata ? "Edit Khata" : "Create Khata"}
                        </DialogTitle>
                    </DialogHeader>

                    <FieldSet className="rounded-lg border p-4">
                        <FieldLegend className="px-2 text-sm font-medium">
                            Khata Information
                        </FieldLegend>

                        <div className="mt-3 space-y-4">
                            <div className="space-y-2">
                                <Label>
                                    Name <span className="text-destructive">*</span>
                                </Label>

                                <Input
                                    placeholder="Enter khata name"
                                    value={khataForm.name}
                                    onChange={(e) => {
                                        setKhataForm({ ...khataForm, name: e.target.value });
                                        setKhataErrors({ ...khataErrors, name: "" });
                                    }}
                                />

                                {khataErrors.name && (
                                    <p className="text-sm text-destructive">{khataErrors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>
                                        Start Date <span className="text-destructive">*</span>
                                    </Label>

                                    <AppCalendar
                                        date={khataForm.start_date}
                                        onChange={(date) => {
                                            setKhataForm({
                                                ...khataForm,
                                                start_date: date,
                                                end_date:
                                                    khataForm.end_date && date && khataForm.end_date < date
                                                        ? undefined
                                                        : khataForm.end_date,
                                            });

                                            setKhataErrors({
                                                ...khataErrors,
                                                start_date: "",
                                                end_date: "",
                                            });
                                        }}
                                    />

                                    {khataErrors.start_date && (
                                        <p className="text-sm text-destructive">
                                            {khataErrors.start_date}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        End Date <span className="text-destructive">*</span>
                                    </Label>

                                    <AppCalendar
                                        min={khataForm.start_date || new Date("1900-01-01")}
                                        date={khataForm.end_date}
                                        onChange={(date) => {
                                            setKhataForm({ ...khataForm, end_date: date });
                                            setKhataErrors({ ...khataErrors, end_date: "" });
                                        }}
                                    />

                                    {khataErrors.end_date && (
                                        <p className="text-sm text-destructive">{khataErrors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Note <span className="text-destructive">*</span>
                                </Label>

                                <Textarea
                                    placeholder="Add any note or description"
                                    className="min-h-24 resize-none"
                                    value={khataForm.note}
                                    onChange={(e) => {
                                        setKhataForm({ ...khataForm, note: e.target.value });
                                        setKhataErrors({ ...khataErrors, note: "" });
                                    }}
                                />

                                {khataErrors.note && (
                                    <p className="text-sm text-destructive">{khataErrors.note}</p>
                                )}
                            </div>
                        </div>
                    </FieldSet>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={savingKhata}
                            onClick={() => setKhataOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button disabled={savingKhata} onClick={saveKhata}>
                            {savingKhata && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingKhata ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}