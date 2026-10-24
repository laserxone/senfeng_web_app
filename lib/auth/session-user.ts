import "server-only";

import pool from "@/config/db";
import {
  BackupNavItem,
  branchNavItem,
  Careers,
  Commission,
  complaintItem,
  dealerNavItems,
  DeliveryNavItem,
  employeeNavItems,
  EngineersPerformance,
  FinanceItem,
  Lists,
  myCloud,
  OwnerSidebarItems,
  POSNavItem,
  Prices,
  ReimbursementApproval,
  RepairAndMaintenance,
  StoreNavItem,
  teamAttendance,
} from "@/constants/data";

type NavigationItem = {
  title: string;
  items?: Array<{ title: string; url: string; shortcut?: string[] }>;
  isActive?: string[];
  [key: string]: unknown;
};

type SessionUserRow = {
  id: number;
  designation: string | null;
  office_id: number;
  office: string;
  full_access: boolean | null;
  branch_expenses_assigned: boolean | null;
  pos_assigned: boolean | null;
  complaint_assigned: boolean | null;
  repairing_and_maintenance: boolean | null;
  list_page: boolean | null;
  superadmin_cloud_access: boolean | null;
  team_attendance: boolean | null;
  careers: boolean | null;
  reimbursement_approval: boolean | null;
  machine_delivery: boolean | null;
  [key: string]: unknown;
};

function getNavigation(
  user: SessionUserRow,
  city: string,
  khataAllowed: boolean,
) {
  const office = user.office.toLowerCase();
  let baseRoute = "";
  let navItems: NavigationItem[] = [];

  if (user.full_access || user.designation === "Owner") {
    navItems = [...OwnerSidebarItems];
    baseRoute = `${city || office}/superadmin`;
    if (baseRoute.includes("karachi") || !khataAllowed) {
      navItems = navItems.filter((item) => item.title !== "KHATA");
    }
  } else {
    if (user.designation === "Store Manager") {
      baseRoute = `${office}/store`;
      navItems = [...StoreNavItem, DeliveryNavItem, BackupNavItem];
    } else if (user.designation === "Dealer") {
      navItems = [...dealerNavItems, FinanceItem, Prices];
      baseRoute = `${office}/dealer`;
    } else {
      navItems = [...employeeNavItems];
      if (user.designation === "Engineer") {
        navItems = navItems.filter((item) => item.title !== "Customers");
      } else if (user.designation === "Social Media Manager") {
        navItems = navItems.map((item) =>
          item.title === "Customers"
            ? {
                ...item,
                items: item.items?.filter(
                  (child) => child.title !== "Quotation",
                ),
                isActive: item.isActive?.filter(
                  (active) => active !== "quotation",
                ),
              }
            : item,
        );
      }
    }

    if (user.branch_expenses_assigned) navItems.push(branchNavItem);
    if (user.pos_assigned) navItems.push(POSNavItem);
    if (user.complaint_assigned) navItems.push(complaintItem);
    if (user.repairing_and_maintenance) navItems.push(RepairAndMaintenance);
    if (user.list_page) navItems.push(Lists);
    if (user.superadmin_cloud_access) navItems.push(myCloud);
    if (user.team_attendance) navItems.push(teamAttendance);
    if (user.careers) navItems.push(Careers);
    if (user.reimbursement_approval) navItems.push(ReimbursementApproval);
    if (user.machine_delivery && user.designation !== "Store Manager") {
      navItems.push({
        ...DeliveryNavItem,
        isActive: ["delivery/machinedelivery", "delivery/delivered"],
        items: DeliveryNavItem.items.filter((item) =>
          ["Machine Delivery", "Delivered"].includes(item.title),
        ),
      });
    }
    const designationRoute: Record<string, string> = {
      Engineer: "engineer",
      Sales: "sales",
      "Customer Relationship Manager": "crm",
      "Customer Relationship Manager (After Sales)": "aftersales",
      "Social Media Manager": "smm",
      Manager: "manager",
    };
    const designation = user.designation ?? "";
    if (designationRoute[designation]) {
      baseRoute = `${office}/${designationRoute[designation]}`;
    }
    if (["Sales", "Manager"].includes(designation)) {
      navItems.push(Commission, Prices, FinanceItem);
    } else if (
      designation === "Customer Relationship Manager" ||
      designation === "Customer Relationship Manager (After Sales)"
    ) {
      navItems.push(Prices);
    }
    if (designation === "Manager") navItems.push(EngineersPerformance);
  }

  return { base_route: baseRoute, nav_items: navItems };
}

export async function getSessionUser(userId: number, city: string) {
  const result = await pool.query<SessionUserRow>(
    `SELECT u.id, u.basic_salary, u.branch_expenses_assigned,
            u.branch_expenses_delete_access, u.branch_expenses_write_access,
            u.designation, u.dp, u.email, u.inventory_assigned,
            u.monthly_target, u.name, u.total_salary, u.old_ref, u.note,
            u.cnic, u.police, u.education, u.customer_add_access,
            u.customer_delete_access, u.joining_date, u.resume, u.number,
            u.kin_number, u.dms_write_access, u.limited_access,
            u.full_access, u.official_number, u.address, u.pin,
            u.appointment_letter, u.father_cnic, u.father, u.leaving_date,
            u.pos_assigned, u.complaint_assigned, u.active, u.office_id,
            o.code AS office, o.name AS office_name, u.fuel,
            u.superadmin_cloud_access, u.customer_full_access,
            u.repairing_and_maintenance, u.team_attendance, u.contract,
            u.other_docs, u.careers, u.reimbursement_approval,
            u.team_attendance_marking, u.list_page, u.machine_delivery
       FROM public.users u
       JOIN public.offices o ON o.id = u.office_id
      WHERE u.id = $1 AND u.active = true
      LIMIT 1`,
    [userId],
  );
  const user = result.rows[0];
  if (!user) return null;

  const settings = await pool.query<{
    version_code: string | null;
    url: string | null;
  }>(
    "SELECT version_code, url FROM public.settings WHERE office_id = $1 LIMIT 1",
    [user.office_id],
  );
  const khataAllowed = [28, 29].includes(user.id);

  return {
    ...user,
    ...getNavigation(user, city, khataAllowed),
    version_code: settings.rows[0]?.version_code ?? 0,
    route_url: settings.rows[0]?.url ?? "",
  };
}
