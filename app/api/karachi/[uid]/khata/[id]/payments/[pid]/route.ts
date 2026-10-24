import { createKhataPaymentDetailHandlers } from "@/app/api/lahore/[uid]/khata/[id]/payments/[pid]/route";

export const { PUT, DELETE } = createKhataPaymentDetailHandlers("karachi");
