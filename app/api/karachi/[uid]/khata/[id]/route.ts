import { createKhataDetailHandlers } from "@/app/api/lahore/[uid]/khata/[id]/route";

export const { GET, PUT, DELETE } = createKhataDetailHandlers("karachi");
