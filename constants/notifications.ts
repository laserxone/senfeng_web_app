
export const NOTIFICATION_CATEGORIES = {
  ALL: "all",
  SALES: "sales",
  ENGINEERING: "engineering",
  TASKS: "tasks",
} as const;

export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORIES)[keyof typeof NOTIFICATION_CATEGORIES];

export const NOTIFICATION_TYPES = {
  task_assigned: {
    title: "Task Assigned",
    category: NOTIFICATION_CATEGORIES.TASKS,
  },
  task_updated: {
    title: "Task Updated",
    category: NOTIFICATION_CATEGORIES.TASKS,
  },
  loan_application_submitted: {
    title: "Loan Application Submitted",
    category: NOTIFICATION_CATEGORIES.ALL,
  },
    loan_application_rejected: {
    title: "Loan Application Rejected",
    category: NOTIFICATION_CATEGORIES.ALL,
  },
  loan_application_approved: {
    title: "Loan Application Approved",
    category: NOTIFICATION_CATEGORIES.ALL,
  },

  // Sales notifications
  machine_added: {
    title: "Machine Added",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  part_added: {
    title: "Part Added",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  payment_added: {
    title: "Payment Added",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  payment_verified: {
    title: "Payment Verified",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  commission_applied: {
    title: "Commission Application Submitted",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
   commission_rejected: {
    title: "Commission Application Rejected",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
   commission_approved: {
    title: "Commission Application Approved",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  machine_delivery_applied: {
    title: "Machine Delivery Application Submitted",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  backup_applied: {
    title: "Backup Application Submitted",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  backup_approved: {
    title: "Backup Application Approved",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  backup_rejected: {
    title: "Backup Application Rejected",
    category: NOTIFICATION_CATEGORIES.SALES,
  },
  quotation_submitted: {
    title: "Quotation Submitted",
    category: NOTIFICATION_CATEGORIES.SALES,
  },

  // Engineering notifications
  complaint_assigned: {
    title: "Complaint Assigned",
    category: NOTIFICATION_CATEGORIES.ENGINEERING,
  },
  complaint_updated: {
    title: "Complaint Updated",
    category: NOTIFICATION_CATEGORIES.ENGINEERING,
  },
  repairing_assigned: {
    title: "Repairing Task Assigned",
    category: NOTIFICATION_CATEGORIES.ENGINEERING,
  },
  repairing_updated: {
    title: "Repairing Task Updated",
    category: NOTIFICATION_CATEGORIES.ENGINEERING,
  },

  // Dynamic category notifications
  customer_added: {
    title: "Customer Added",
    category: NOTIFICATION_CATEGORIES.ALL,
  },
  customer_assigned: {
    title: "Customer Assigned",
    category: NOTIFICATION_CATEGORIES.ALL,
  },
  feedback_added: {
    title: "Feedback Added",
    category: NOTIFICATION_CATEGORIES.ALL,
  },
} as const;

