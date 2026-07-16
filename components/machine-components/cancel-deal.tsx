
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    useState
} from "react";

import ConfirmationDialog from "@/components/alert-dialog";
import { Input } from "@/components/ui/input";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MachineProps } from "@/lib/types";
import "pdfjs-dist/build/pdf.worker.mjs";

const CancelDeal = ({ machine, onRefresh }: { machine: MachineProps, onRefresh: () => Promise<void> }) => {
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState(false);
    const [reason, setReason] = useState("");
    const { userID } = useUserDetail();

    async function handleDealCancel() {
        if (!machine?.id) return;

        setLoading(true);

        axios
            .post(`/${userID}/machine/${machine?.id}/dealcancel`, { reason })
            .then(async () => {
                await onRefresh();
                setConfirmation(false);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <>
            {!machine?.cancelled_detail && (
                <Button
                    onClick={() => setConfirmation(true)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                >
                    Cancel Deal
                </Button>
            )}

            <ConfirmationDialog
                valid={!!reason}
                loading={loading}
                open={confirmation}
                title={"Cancel Deal?"}
                description={
                    "Make sure payments are reversed back to client before cancelling this deal"
                }
                onPressCancel={() => setConfirmation(false)}
                onPressYes={handleDealCancel}
            >
                <div>
                    <Label>Reason</Label>
                    <Input
                        value={reason}
                        placeholder="Enter reason for cancel"
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
            </ConfirmationDialog>
        </>
    );
};

export default CancelDeal