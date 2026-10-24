import { createSettingsHandlers } from "@/app/api/lahore/[uid]/settings/route";

export const { GET, PUT } = createSettingsHandlers("karachi");

export const revalidate = 0;
