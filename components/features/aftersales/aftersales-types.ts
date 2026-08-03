import { MyCustomerResolved, SearchItem } from "@/lib/types"
import { Dispatch, SetStateAction } from "react"

type ComplaintLog = {
  remark: string
  location: [number, number] | null
  created_at: string
  signature: string | null
  image: string | null
}

type PaymentDetail = {
  id: number
  complaint_id: number
  amount: string | number
  purpose: string
  method: string
  slip: string
  created_at: string
}

export type ComplaintAssignment = {
  id: number
  title: string
  problem: string
  solution: string
  customer_id: number
  status: "completed" | "pending" | "assigned" | "in_progress" | string
  created_at: string
  installation: boolean
  date: string | null
  managing_office: string
  paid: boolean
  charges: number | null

  complaint_id: number
  complaint_title: string
  complaint_problem: string
  complaint_solution: string
  complaint_status:
    | "completed"
    | "pending"
    | "assigned"
    | "in_progress"
    | string
  complaint_paid: boolean
  complaint_installation: boolean
  complaint_charges: number | null
  complaint_created_at: string

  customer_name: string
  customer_address: string
  customer_location: string
  customer_owner: string
  customer_number: string[]
  customer_pin: string
  customer_ownership_id: number
  customer_ownership_name: string

  assignment_id: number
  engineer_id: number
  engineer_name: string
  assigned_by: number
  assigned_by_name: string
  assignment_created_at: string

  logs: ComplaintLog[]
  payment_details: PaymentDetail[]
}

export type AfterSalesFeedbackStatus =
  | "Satisfactory"
  | "Unsatisfactory"
  | string

export type AfterSalesCustomerWithFeedback = {
  id: number
  name: string
  location: string
  number: string[]
  owner: string
  member: boolean
  created_at: string | null
  feedback_date: string
  user_name: string
  feedback_status: AfterSalesFeedbackStatus
  feedback: string
}

export type AfterSalesCustomerWithoutFeedback = {
  id: number
  name: string
  location: string
  number: string[]
  owner: string
  member: boolean
  created_at: string | null
}

export type AfterSalesFeedbackResponse = {
  withFeedback: {
    total: number
    data: AfterSalesCustomerWithFeedback[]
  }
  withoutFeedback: {
    total: number
    data: AfterSalesCustomerWithoutFeedback[]
  }
  satisfied: number
  unsatisfied: number
}

export type AfterSalesPOSResponse = {
  collection: number
  total_completed: number
  total_pending: number
  total_sales: number
  data: SearchItem[]
}

export type AfterSalesReimbursement = {
  id: number
  created_at: string
  amount: string | number
  description: string
  image?: string | null
  attachment?: string | null
  title: string
  date: string
  user_id?: number
  user_name?: string
  submitted_by_name?: string
  verified?: boolean
  resolved?: boolean
  status?: string
}

export type MetricTone = "blue" | "green" | "amber" | "red" | "slate" | "violet"

export type WithFeedbackProps = MyCustomerResolved & {
  feedback_date: string
  user_name?: string
  feedback: string
  feedback_status?: string
  previous_feedback?: string
  previous_feedback_date?: string
  previous_feedback_status?: string
}

export type DashboardData = {
  withFeedback: WithFeedbackProps[]
  withoutFeedback: (MyCustomerResolved & {
    previous_feedback?: string
    previous_feedback_date?: string
    previous_feedback_status?: string
  })[]
}

export type DataKeys = keyof DashboardData

export type CustomerEmployeeAfterSalesProps = {
  onRefresh: () => Promise<void>
  user_id: number | string
  data: DashboardData | null
  onFilterData: (a: string, b: string) => void
  handleClear: () => Promise<void>
  selectedOption: string
  setSelectedOption: Dispatch<SetStateAction<string>>
  height?: string
}
