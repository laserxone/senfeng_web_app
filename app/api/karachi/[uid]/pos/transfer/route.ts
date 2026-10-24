import { createTransferHandlers } from "@/app/api/lahore/[uid]/pos/transfer/route";

export const { GET, POST, PUT, PATCH } = createTransferHandlers("karachi");
