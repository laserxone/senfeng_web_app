import { GiftStatus } from "./gift-types";

export const giftStatusColors: Record<GiftStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-destructive text-white",
};
