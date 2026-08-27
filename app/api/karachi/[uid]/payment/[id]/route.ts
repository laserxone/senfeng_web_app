// This handler has no office-specific behavior, so Karachi reuses Lahore's
// single source of truth. Office-specific payment notifications remain in the
// parent payment routes.
export {
  DELETE,
} from "@/app/api/lahore/[uid]/payment/[id]/route";
