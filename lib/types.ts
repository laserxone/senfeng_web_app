import { ReactNode } from "react"


export type UserReimbursementTypes = {
    id: number | string
    passingData: UserReimbursementType[]
    onAddRefresh: () => Promise<void>
    onFilterReturn: (start: string, end: string) => Promise<void>
    onReset: (start: string, end: string) => Promise<void>
    onUpdatePurpose: (val: UserReimbursementType) => void
}

export type SalesMachine = {
    id: number;
    customer_id: number;
    contract_date: string;
    serial_no: string;
    price: string;
    customer_name: string;
    customer_owner: string;
}

export type UserDashboard = {
    id: number;
    dp: string;
    name: string;
    designation: string;
    limited_access: boolean;
}

export type SalesCustomerMachines = {
    id: number,
    payments: { amount: number }[]
    serial_no: string
    percentage_completion?: string | number
    price: number | string
}

export type SalesCustomer = {

    profile_completion: number;
    sales: SalesCustomerMachines[];
    id: number;
    name: string;
    owner: string;
    industry: string | null;
    number: string;
    location: string;
    created_at: string;
    member: boolean;

}

export type SalesDashboard = {
    allTasks: number
    customers: SalesCustomer[]
    feedbacksTakenThisMonth: number
    machinesSoldLastMonth: number
    machinesSoldThisMonth: number
    machinesSoldThisMonthDetail: SalesMachine[]
    percentageChange: string
    remainingFeedbacks: number
    totalCustomersWithSale: number
    totalVisits: number
    user: UserDashboard
}

export type SalesVisitTypes = {
    id: number;
    name: string | null;
    city: string | null;
    phone: string | null;
    note: string;
    user_id: number;
    created_at: string;
    image: string;
    location: [number, number];
    next: string;
    customer_id: number;
    company: string | null;
    problem: string | null;
    solution: string | null;
    signature: string | null;
    user_name: string;
    customer_name: string;
    customer_owner: string;
    customer_location: string;
    customer_number: string[];
    customer_member: boolean;
}

export type ExtraCustomer = {
    id: number;
    name: string;
    owner: string;
    industry: string | null;
    number: string;
    location: string;
    created_at: string;
}

export type UserExtraTypes = {
    allCustomers: ExtraCustomer[]
    nextMonth: ExtraCustomer[]
    thisMonth: ExtraCustomer[]
    topFollow: ExtraCustomer[]
    userwithoutFeedback: ExtraCustomer[]
    user: {
        designation: string
        dp: string
        id: number
        limited_access: boolean
        name: string
    }
}

export type UserAttendanceRecord = {
    id: number | string;
    user_id: number;
    image_time_in: string | null;
    image_time_out: string | null;
    note_time_in: string | null;
    note_time_out: string | null;
    time_in: string | null;
    time_out: string | null;
    location_time_in: number[] | null;
    location_time_out: number[] | null;
    customer_id: number | null;
    user_name: string;
    user_email: string;
    record_type: "attendance" | "leave";
    leave_id: number | null;
    leave_status: string | null;
    leave_date: string | null;
    date: string | null;
    status: string;
};

export type UserCallData = {
    id: number
    name: string
    number: string[]
    owner: string
    ownership: number
}

export type UserReimbursementType = {
    id: number;
    created_at: string;
    amount: string;
    description: string;
    image: string;
    submitted_by: number;
    title: string;
    date: string;
    city: string;
    customer_id: number;
    purpose: boolean | string;
    user_id: number;
    submitted_by_name: string;
    customer_member: boolean;
    ownership_id: number;
    customer: string;
    ownership_name: string;
}

export type MyCustomer = {
    id: number;
    name?: string;
    owner?: string;
    location?: string;
    number?: string[];
    lead?: number | null;
    ownership?: number;
    office?: string | null;
    ownership_name?: string | null;
    label?: string;
    search?: string;
    company?: string
    orignalNumber?: string[],
    sorting?: string
    machines?: string[]
    order_nums?: string[]
    machine_order_numbers?: string[]
    member?: boolean
    image?: string
    industry?: string
    email?: string
    remarks?: string
    address?: string
    customer_group?: string
    rating?: number
    other?: string
    pin?: string
    platform?: string
    created_at?: string

};

export type MyCustomerResolved = {
    id: number;
    name?: string;
    owner?: string;
    location?: string;
    number?: string;
    lead?: number | null;
    ownership?: number;
    office?: string | null;
    ownership_name?: string | null;
    label?: string;
    search?: string;
    company?: string
    orignalNumber?: string[],
    sorting?: string
    machines?: string
    order_nums?: string
    machine_order_numbers?: string[]
    member?: boolean

};




export type CustomerFormData = {
    name: string;
    email: string;
    customer_group: string;
    industry: string;
    location: string;
    number: string[];
    owner: string;
    address: string;
    rating: number;
    image: string | null;
    remarks: string;
    member: boolean;
    lead?: number;
    other: string;
    platform: string;
    pin: string;

    ownership?: number;

    created_by: number;
    created_at?: string;

    office: number;
};

export type AttendanceTableRow = UserAttendanceRecord & {
    date: string;
    status: string;
};

export type UserReturnableField = {
    name: string, qty: string, total: string
}

export type UserReturnableType = {
    created_at: string,
    company: string
    fields: UserReturnableField[]
}

export type UserFines = {
    created_at: string;
    user_name: string;
    customer_name: string;
    amount: string;
    reason: string;
}

export type AvailableMachinesProps = {
    id: number;
    machine_model: string;
    machine_source: string;
    machine_power: string;
    booked: boolean;
}

export type Payment = {
    id: number;
    transaction_date: string;
    amount: string;
    machine_id: number;
    image: string;
    mode: string;
    note: string;
    received_by: string;
    clearance_date: string;
    remarks: string;
    firebase_img: string | null;
    status: string;
    comment: string | null;
    payment_lock: boolean;
    cheque_id: string | null;
    part_id ?: number
};

export type FinanceProps = {
    machine_id: number;
    total_generated: string;
    machine_speed_money_amount: string;
    machine_speed_money: boolean;
    machine_serial_no: string;
    sell_by: number;
    machine_contract_date: string;

    customer_id: number;
    customer_name: string;
    customer_owner: string;

    ownership: number;
    office: string;

    sell_by_name: string;
    sell_id: number;
    amount?: number;
    machine_price?: number

    payments: Payment[];

    total_payment_received: number;
    total_balance: number;
    pending: number;
}

export type PricesProps = {
    id: number;
    model: string;
    power: string;
    ddp: string;
    fob: string;
    fob_bottom: string;
    ddp_bottom: string;
    created_at: string;
    description: string;
    attachment: string | null;
    attachment_url: string | null;
}

export type FoldersProps = {
    id: number;
    name: string;
    parent_folder: number | null;
    created_by: number;
}

export type FileProps = {
    id: number;
    added_by: string;
    created_at: string;
    folder_id: number;
    path: string;
    created_by: number;
}

export type RepairingProps = {
    id: number;
    customer_id: number;
    user_id: number;

    assign_date: string;
    deliver_date: string;

    charges: string;

    remarks: string;
    remarks_other: string;

    status: string;

    managing_office: string;

    user_name: string;
    customer_name: string;
    owner_name: string;
}

export type AssignForm = {
    assign_date: Date | undefined,
    deliver_date: Date | undefined,
    user_id: null | number,
    customer_id: null | number,
    charges: number,
    remarks: string,
    managing_office: string
}

export type ComplaintProps = {
    complaint_title: string;
    complaint_problem: string;
    complaint_solution: string;
    complaint_status: string;
    complaint_created_at: string;
    customer_id: number;
    complaint_id: number;
    customer_name: string;
    customer_address: string;
    customer_location: string;
    customer_owner: string;
    customer_number: string[];
    customer_pin: string;
    customer_ownership_id: number;
    customer_ownership_name: string;
    assignment_id: number;
    engineer_id: number;
    engineer_name: string;
    assigned_by: number;
    assigned_by_name: string;
    assignment_created_at: string;
    logs?: {
        remark: string,
        location: string[],
        created_at: string,
        signature: string,
        image: string
    }[]
}

export type OfficeExpenseProps = {
    id: number;
    amount: string;
    created_at: string;
    image: string;
    note: string;
    submitted_by: number;
    date: string;
    user_id: number;
    submitted_by_name: string;
};

export type TaskProps = {
    id: number;
    created_at: string;
    assigned_to: number;
    status: string;
    task_name: string;
    type: string;
    assigned_by: number | null;
    customer_id: number;
    problem: string | null;
    solution: string | null;
    remarks: string | null;
    site_reached: boolean;
    location: string | null;
    user_id: number;
    assigned_to_name: string;
    assigned_to_email: string;
    customer_name: string;
    customer_owner: string;
    customer_number: string[];
    customer_address: string;
    customer_pin: string;
    created_at_time: string;
};




export type MachinePayment = {
    id: number;
    transaction_date: string;
    amount: string;
    machine_id: number;
    image: string;
    mode: string;
    note: string;
    received_by: string;
    clearance_date: string;
    remarks: string;
    firebase_img: string | null;
    status: string;
    comment: string | null;
    payment_lock: boolean;
    cheque_id: string;
    track: number;
};

export type MachineDeliveryInformation = {
    pin: string;
    tod: string;
    city: string;
    name: string;
    note: string;
    number: string;
    address: string;
};

export type MachineDispatchChecklist = {
    avr: string;
    lcd: string;
    lens: string;
    tray: string;
    motor: string;
    mouse: string;
    blower: string;
    nozzle: string;
    remote: string;
    chiller: string;
    toolbox: string;
    foot_pad: string;
    keyboard: string;
    lcd_frame: string;
    lcd_stand: string;
    dust_cover: string;
    machine_sf: string;
    blower_pipe: string;
    motor_cover: string;
    cermaic_ring: string;
    laser_source: string;
    oxygen_guage: string;
    nitrogen_guage: string;
    chain_side_cover: string;
};

export type MachineDispatchOtherInfo = {
    note: string;
    image: string;
    manager: string;
    orderNo: string;
    issuedBy: string;
    vehicleNo: string;
    driverName: string;
    dispatchTime: string;
    driverNumber: string;
};

export type MachineDispatchInformation = {
    checklist: MachineDispatchChecklist;
    other_information: MachineDispatchOtherInfo;
};

export type MachineProps = {
    id: number
    name?: string
    created_at: string;
    model_no?: string
    customer_id: number;
    type: string;
    speed_money_note: string;
    speed_money: boolean;
    sell_by: number;
    commission: boolean;
    order_no: string | null;
    price: string;
    qty: number | null;
    serial_no: string;
    contract_images_png: string[];
    contract_images_pdf: File[];
    other_images_png: string[];
    other_images_pdf: File[];
    contract_date: string;
    usd_tt_rate: number | null;
    speed_money_amount: string;
    power: string;
    source: string;
    cnic: string;
    commission_issued: boolean;
    payment_lock: boolean;
    order_no_arr: string[];
    machine_nameplate_images: string[];
    final_handover_images: string[];
    handover_user_id: number | null;
    installation_report: string[];
    handshake_images: string[];
    parts_information: any;
    ready_for_delivery: boolean;
    delivery_date: string;
    delivery_information: MachineDeliveryInformation;
    dispatch_information: MachineDispatchInformation;
    delivery_request_date: string;
    cancelled_detail: boolean;
    cancelled_id: number | null;
    cancelled_at: string | null;
    cancelled_issued: string | null;
    cancelled_reason: string | null;
    payments: MachinePayment[];
    sell_by_name: string;
    status: string;
};

export type InstallmentProps = {
    id: number
    pending: boolean
    date: string
    amount: number
    image: string
}

export type MachineResponse = {
    machine: MachineProps;
    percentage_completion: number;
    unmatchedFields: string[];
    installments: InstallmentProps[];
    customer: MyCustomer
};

export type CommissionProps = {
    id: number;
    note?: string;
    is_approved: boolean | null;
    commission_issued: boolean;
    owner_note?: string;
};

export type CommissionCustomer = {
    id: number;
    name?: string;
    owner?: string;
    lead?: number;
    profile_completion: number;
};

export type CommissionMachineItemProps = {
    id: number;
    customer_id: number;

    serial_no: string;

    price: number | string;
    speed_money_amount?: number | string;

    created_amount: number | string;
    paid_amount: number | string;
    balance: number;

    percentage_completion: number;

    first_machine?: boolean;

    customer: CommissionCustomer;

    commission?: CommissionProps;
};

export type CommissionCRMProps = {
    id: number;
    customer_name: string;
    user_name: string
    note: string
    customer_owner: string;
    is_approved: boolean
    owner_note: string
};

export type CommissionOwnerProps = {
    id: number;
    sale_id: number;
    customer_id: number;
    lead_id?: number | null;
    user_name: string;
    customer_name: string;
    customer_owner: string;
    customer_group?: string | null;
    machine_name: string;
    order_no_arr?: string[];
    total_amount: number;
    is_approved: boolean | null;
    commission_issued: boolean;
    commission_amount?: number | null;
    note?: string | null;
    owner_note?: string | null;
    request_date?: string | null;
    approval_date?: string | null;
    issue_date?: string | null;
    contract_images_png: string[]
    machine_nameplate_images: string[]
}

export type TabProps = {
    id: string;
    title: string;
    component: ReactNode;
    closable?: boolean;
};


export type CustomerTaskProps = {
    id: number;
    created_at: string;
    created_at_time: string;

    customer_id: number;
    assigned_to: number;
    user_id: number;

    task_name: string;
    status: string;

    user_name: string;
    customer_name: string;
    customer_owner: string;
};

export type CustomerVisitProps = {
    id: number;
    created_at: string;

    user_id: number;
    customer_id: number;

    name: string | null;
    city: string | null;
    phone: string | null;
    company: string | null;

    note: string;
    problem: string;
    solution: string;

    image: string;
    signature: string;

    location: [number, number];

    next: string;

    user_name: string;
    customer_name: string;
    customer_owner: string;
    customer_location: string;

    customer_number: string[];
    customer_member: boolean;
};

export type CustomerFeedbackProps = {
    id: number;
    created_at: string;

    customer_id: number;
    user_id: number;

    next_followup: string;

    feedback: string;
    status: string;

    type: string;
    followup_type: string;

    top_follow: boolean;

    user_name: string;
};

export type PartsProps = {
    id: number
    invoicenumber: number | string
    payment: boolean
    fields: { name: string, qty: string, price: string, total: string }[]
    payments: { amount: string, mode: string, received_by: string, transaction_date: string, clearance_date: string, image: string }[]
}

export type UserSalaryProps = {
    salary_month: string
    id: string
    user_name: string
    payable: string
    reimbursement: string
    commission: string
    kpi: string
    miscellaneous: string
    additional_fine: string
    late_fine_per_day: string
    absents: string
    late: string
    fuel: string
    payments?: {
        transaction_date: string
        note: string
        received_by: string;
        mode: string
        amount: number
        balance: number
    }[]
}

export type OldRecordProps = {
    id: number;
    customer_id: number;
    feedback_date: string;
    status: string;
    feedback: string;
    user_name: string;
    name: string;
    owner: string;
    location: string;
    number: string[];
    ownership: number;
    ownership_name: string;
    customer_created_at: string;
}

export type StockProps = {
    id: number;
    category?: string | null;
    gift?: number;
    name: string;
    price?: string;
    qty?: number;
    type?: string;
    rack?: string | null;
    img?: string | null;
    threshold?: number;
    new_order?: number;
    chinese_name?: string;
    remarks?: string | null;
    unit?: string;
    buying?: string;
    modified?: boolean
};

export type InvoiceItem = {
    id?: number;
    img?: string | null;
    qty: number;
    gift?: number;
    name?: string;
    rack?: string | null;
    type?: string;
    unit?: string;
    price?: string;
    total: string | number;
    remarks?: string | null;
    category?: string | null;
    new_order?: number;
    threshold?: number;
    description: string;
    chinese_name?: string;
};

export type POSInvoiceReminder = {
    id: number;
    name: string;
    company: string;
    phone: string;
    address: string;
    invoicenumber: string;
    manager: string;
    fields: InvoiceItem[];

    created_at: string; // ISO date

    payment: boolean;
    customer_id: number | null;

    discount: number;
    total_paid: string;

    items_total: number;
    final_amount: number;

    status: string;
};

export type POSCustomer = {
    id: number
    phone: string
    name: string
    address: string
    customer: string
}

export type SearchItem = POSInvoiceReminder & {
    total: number
    discount: number
}

export type EngineerIssuedItems = {
    id: number
    name: string
    user_name: string
    company: string
    address: string
    phone: string
    created_at: string
    fields: InvoiceItem[]
}

export type POSPaymentDetailProps = {
id: number;
  name: string;
  company: string;
  phone: string;
  address: string;
  invoicenumber: string;
  manager: string;
  fields: InvoiceItem[];
  created_at: string; 
  payment: boolean;
  customer_id: number | null;
  discount: string;
  payments: Payment[];
}


