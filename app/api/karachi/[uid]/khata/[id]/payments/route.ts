import { createKhataPaymentHandlers } from "@/app/api/lahore/[uid]/khata/[id]/payments/route";

export const { GET, POST } = createKhataPaymentHandlers("karachi");
