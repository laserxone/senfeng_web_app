import { createAvailableMachinesHandler } from "@/app/api/lahore/[uid]/available-machines/route";

export const GET = createAvailableMachinesHandler("karachi");

export const revalidate = 0;
