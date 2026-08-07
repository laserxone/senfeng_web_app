export type ApprovalStatus = "pending" | "approved" | "rejected" | "skipped";
export type GiftStatus = "pending" | "in_progress" | "approved" | "rejected";

export type Approver = {
  id: number;
  user_id: number;
  approval_order: number;
  user_name: string;
  user_designation: string;
};

export type Hierarchy = {
  id: number;
  name: string;
  hierarchy_type: string;
  approvers: Approver[] | null;
};

export type GiftApproval = {
  id: number;
  approver_id: number;
  approval_order: number;
  status: ApprovalStatus;
  comments: string | null;
  acted_at: string | null;
  approver_name: string;
  approver_designation: string;
};

export type GiftInventoryItem = {
  id: number;
  name: string;
  qty: number;
  available_qty: number;
};

export type GiftApplication = {
  id: number;
  user_id: number;
  user_name: string;
  user_designation: string;
  customer_id: number;
  customer_name: string | null;
  customer_owner: string | null;
  inventory_items: { id: number; qty: number }[];
  inventory_details: GiftInventoryItem[];
  reason: string;
  image: string | null;
  hierarchy_id: number;
  hierarchy_name: string | null;
  status: GiftStatus;
  current_approver_order: number;
  created_at: string;
  approval_steps: GiftApproval[] | null;
  is_my_turn?: boolean;
  my_approval_status?: ApprovalStatus | null;
};
