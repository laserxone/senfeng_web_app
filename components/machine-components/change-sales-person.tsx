

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { UserSearch } from "@/components/user-search";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import {
    User
} from "lucide-react";
import {
    useState
} from "react";


const ChangeSalesPersonDialog = ({
    open,
    onClose,
    machine_id,
    onRefresh,
    existing,
}: {
    open: boolean;
    onClose: () => void;
    machine_id: number | undefined;
    onRefresh: () => Promise<void>;
    existing: string | undefined;
}) => {
    const [selectedUser, setSelectedUser] = useState<null | number>(null);
    const [loading, setLoading] = useState(false);
    const { userID } = useUserDetail();

    async function handleSubmit() {
        if (!selectedUser || !machine_id) return;

        setLoading(true);

        try {
            await axios.put(`/${userID}/machine/${machine_id}`, {
                sell_by: selectedUser,
            });

            await onRefresh();
            handleClose();
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setSelectedUser(null);
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="overflow-hidden p-0 sm:max-w-[430px]">
                <DialogHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white text-slate-700 shadow-sm">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-base font-semibold leading-tight text-slate-950">
                                Change Sales Person
                            </DialogTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Reassign this machine without changing other details.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3 px-4 py-4">
                    <FieldSet className="gap-2 rounded-lg border bg-slate-50/70 p-3">
                        <FieldLegend className="mb-0 text-xs font-semibold uppercase text-slate-500">
                            Current Assignment
                        </FieldLegend>

                        <div className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Existing
                            </Label>
                            <p className="truncate text-sm font-semibold text-slate-900">
                                {existing || "Not assigned"}
                            </p>
                        </div>
                    </FieldSet>

                    <FieldSet className="gap-2 rounded-lg border bg-white p-3 shadow-sm">
                        <FieldLegend className="mb-0 text-xs font-semibold uppercase text-slate-500">
                            New Assignment
                        </FieldLegend>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Select Sales Person</Label>
                            <UserSearch value={selectedUser} onReturn={setSelectedUser} />
                        </div>
                    </FieldSet>

                    <div className="flex items-center justify-end gap-2 border-t pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={handleClose}
                            className="h-9 px-3"
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={!selectedUser || loading}
                            onClick={handleSubmit}
                            className="h-9 px-4"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChangeSalesPersonDialog