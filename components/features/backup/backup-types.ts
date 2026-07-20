export interface BackupFormData {
    name: string
    dateOfDelivery: Date | undefined
    amount: string
    shipmentName: string
    image: File | null
    expectedReturnDate: Date | undefined
    hierarchyId: string
    saleId: number | undefined
    inventoryId: number | undefined
}

export type BackupFormErrors = Partial<
    Record<
        | "customerId"
        | "saleId"
        | "inventoryId"
        | "amount"
        | "dateOfDelivery"
        | "expectedReturnDate"
        | "hierarchyId",
        string
    >
>



export type Approver = {
    id: number
    user_id: number
    approval_order: number
    user_name: string
    user_email: string
    user_designation: string
}

export type Hierarchy = {
    id: number
    name: string
    hierarchy_type: string
    description: string | null
    approvers: Approver[] | null
}

export type ApprovalStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "skipped"

export type ApplicationStatus =
    | "pending"
    | "in_progress"
    | "approved"
    | "rejected"
    | "issued"
    | "returned"

export type ApprovalStep = {
    id: number
    approver_id: number
    approval_order: number
    status: ApprovalStatus
    comments: string | null
    acted_at: string | null
    approver_name: string
    approver_designation: string
}

export type BackupApplication = {
    id: number

    name: string
    date_of_delivery: string | null
    amount: string | number | null
    shipment_name: string | null
    image: string | null
    expected_return_date: string | null
    customer_id: string | number
    user_id: number
    user_name: string
    user_designation: string

    hierarchy_id: number | null
    sale_id: number | null
    hierarchy_name: string | null

    status: ApplicationStatus

    issued: boolean
    issue_date: string | null
    actual_return_date: string | null

    current_approver_order: number

    created_at: string
    updated_at: string

    approval_steps: ApprovalStep[] | null

    is_my_turn?: boolean
    my_approval_status?: ApprovalStatus | null
    serial_no: string
    order_no_arr: string[]
    customer_name: string
    customer_owner: string
}


export type BackupPartStatus = "in_stock" | "given_to_customer";

export type BackupApplicationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "issued"
    | "returned";

export type BackupDetail = {
    id: number;
    name: string;
    date_of_delivery: string | null;
    amount: number | null;
    shipment_name: string | null;
    image: string | null;
    expected_return_date: string | null;
    user_id: number;
    status: BackupApplicationStatus | string;
    issued: boolean;
    issue_date: string | null;
    actual_return_date: string | null;
    hierarchy_id: number | null;
    current_approver_order: number;
    created_at: string;
    updated_at: string;
    sale_id: number | null;
    backup_inventory_id: number | null;
    customer_name: string;
    user_name: string;
};

export interface BackupPart {
    id: number;
    name: string;
    power: string;
    serial_no: string;
    size: string;
    created_at: string | Date;
    backup_application_detail: null | BackupDetail;
    status: BackupPartStatus;
}

export type BackupPartTableRow = BackupPart & {
    part_name_display: string;
    serial_display: string;
    power_display: string;
    size_display: string;
    status_label: string;
    customer_machine: string;
    issue_date_display: string;
    expected_return_display: string;
    actual_return_display: string;
};