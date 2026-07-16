import {
    useState
} from "react";

import ConfirmationDialog from "@/components/alert-dialog";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TriggerFirebaseForMachine } from "@/lib/triggerFirebase";
import { MachineResponse } from "@/lib/types";
import "pdfjs-dist/build/pdf.worker.mjs";


const RevokeDelivery = ({ onRefresh, onClose, data }: { onRefresh: () => Promise<void>, onClose: () => void, data: MachineResponse | null }) => {
    const [loading, setLoading] = useState(false)
    const { userID } = useUserDetail();

    async function handleSubmit() {
        if (!data?.machine?.id) return;

        setLoading(true);

        axios
            .get(`/${userID}/machine/${data?.machine?.id}/revoke`)
            .then(async () => {
                TriggerFirebaseForMachine()
                await onRefresh();
                onClose();
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <ConfirmationDialog
            loading={loading}
            open={!!data}
            title={"Revoke requested delivery?"}
            description={""}
            onPressCancel={() => onClose()}
            onPressYes={handleSubmit}
        />
    );
};

export default RevokeDelivery