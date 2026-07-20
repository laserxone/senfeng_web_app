import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

type SearchTable =
  | "customer"
  | "users"
  | "sale"
  | "lab_tasks"
  | "complaints"
  | "task";

type SearchRow = {
  id: number;
  table: SearchTable;
  title: string;
  customer_id: number | null;
  description: string | null;
};

type SearchUser = {
  id: number;
  designation: string;
  full_access: boolean;
  limited_access: boolean;
  complaint_assigned: boolean;
  repairing_and_maintenance: boolean;
};

const CUSTOMER_ONLY_ROLES = new Set([
  "Customer Relationship Manager",
  "Customer Relationship Manager (After Sales)",
  "Social Media Manager",
]);

const CUSTOMER_AND_SALE_ROLES = new Set(["Sales", "Manager", "Dealer"]);
const ALL_TASK_ACCESS_ROLES = new Set([
  "Manager",
  "Customer Relationship Manager",
  "Customer Relationship Manager (After Sales)",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();
  const baseRoute = searchParams.get("base_route")?.replace(/^\/+|\/+$/g, "");

  if (!q || !baseRoute) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const userResult = await pool.query<SearchUser>(
      `
        SELECT
          id,
          designation,
          COALESCE(full_access, false) AS full_access,
          COALESCE(limited_access, false) AS limited_access,
          COALESCE(complaint_assigned, false) AS complaint_assigned,
          COALESCE(repairing_and_maintenance, false) AS repairing_and_maintenance
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [uid],
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 },
      );
    }

    const isAdmin = user.full_access || user.designation === "Owner";
    const hasCustomerOnlyRole = CUSTOMER_ONLY_ROLES.has(user.designation);
    const hasCustomerAndSaleRole = CUSTOMER_AND_SALE_ROLES.has(user.designation);
    const canSearchCustomers =
      isAdmin || hasCustomerOnlyRole || hasCustomerAndSaleRole;
    const canSearchSales =
      isAdmin ||
      hasCustomerAndSaleRole ||
      (hasCustomerOnlyRole && !user.limited_access);
    const isEngineer = user.designation === "Engineer";
    const canSearchComplaints =
      isAdmin || isEngineer || user.complaint_assigned;
    const canSearchRepairs =
      isAdmin || isEngineer || user.repairing_and_maintenance;
    const restrictComplaintsToUser =
      isEngineer && !isAdmin && !user.complaint_assigned;
    const restrictRepairsToUser =
      isEngineer && !isAdmin && !user.repairing_and_maintenance;
    const canSearchTasks = isAdmin || user.designation !== "Dealer";
    const canSearchAllTasks =
      isAdmin || ALL_TASK_ACCESS_ROLES.has(user.designation);
    const usesLimitedUserScope =
      user.limited_access && !isAdmin && canSearchCustomers;
    const usesUserIdParameter =
      usesLimitedUserScope ||
      (canSearchTasks && !canSearchAllTasks) ||
      restrictComplaintsToUser ||
      restrictRepairsToUser;

    let customerScope = "FALSE";
    if (isAdmin || (canSearchCustomers && !user.limited_access)) {
      customerScope = "TRUE";
    } else if (hasCustomerOnlyRole) {
      customerScope = "c.lead_id = $2";
    } else if (hasCustomerAndSaleRole) {
      customerScope = "c.ownership = $2";
    }

    const searchParts: string[] = [];

    if (canSearchCustomers) {
      searchParts.push(`
        SELECT
          id,
          'customer' AS "table",
          title,
          NULL::integer AS customer_id,
          NULL::text AS description
        FROM matched_customers
      `);
    }

    if (isAdmin) {
      searchParts.push(`
        SELECT
          id,
          'users' AS "table",
          name AS title,
          NULL::integer AS customer_id,
          designation AS description
        FROM matched_users
      `);
    }

    if (canSearchSales) {
      const saleScope =
        user.limited_access && !isAdmin ? "AND s.sell_by = $2" : "";
      searchParts.push(`
        SELECT * FROM (
          SELECT
            s.id,
            'sale' AS "table",
            matches.title,
            s.customer_id,
            CONCAT_WS(
              ' · ',
              'Sale',
              CASE WHEN c.id IS NOT NULL THEN 'Customer: ' || COALESCE(NULLIF(c.name, ''), c.owner) END,
              CASE WHEN seller.id IS NOT NULL THEN 'Sold by: ' || seller.name END
            ) AS description
          FROM sale s
          LEFT JOIN customer c ON c.id = s.customer_id
          LEFT JOIN users seller ON seller.id = s.sell_by
          CROSS JOIN LATERAL (
            SELECT s.serial_no AS title WHERE s.serial_no ILIKE $1
            UNION
            SELECT order_no AS title
            FROM unnest(s.order_no_arr) AS order_no
            WHERE order_no ILIKE $1
            UNION
            SELECT seller.name AS title WHERE seller.name ILIKE $1
            UNION
            SELECT s.sell_by::text AS title WHERE s.sell_by::text ILIKE $1
          ) matches
          WHERE TRUE ${saleScope}
          ORDER BY s.created_at DESC NULLS LAST, s.id DESC
          LIMIT 10
        ) AS sale_results
      `);
    }

    if (canSearchRepairs) {
      const repairScope = restrictRepairsToUser ? "AND lt.user_id = $2" : "";
      searchParts.push(`
        SELECT * FROM (
          SELECT
            lt.id,
            'lab_tasks' AS "table",
            COALESCE(NULLIF(lt.remarks, ''), 'Repair task') AS title,
            lt.customer_id,
            CONCAT_WS(
              ' · ',
              'Repairing and maintenance',
              CASE WHEN c.id IS NOT NULL THEN 'Customer: ' || COALESCE(NULLIF(c.name, ''), c.owner) END,
              CASE WHEN assigned_user.id IS NOT NULL THEN 'Assigned to: ' || assigned_user.name END
            ) AS description
          FROM lab_tasks lt
          LEFT JOIN customer c ON c.id = lt.customer_id
          LEFT JOIN users assigned_user ON assigned_user.id = lt.user_id
          WHERE (
            lt.remarks ILIKE $1
            OR lt.user_id IN (SELECT id FROM matched_users)
            OR lt.customer_id IN (SELECT id FROM matched_customers)
          )
          ${repairScope}
          ORDER BY lt.assign_date DESC NULLS LAST, lt.id DESC
          LIMIT 10
        ) AS repair_results
      `);
    }

    if (canSearchComplaints) {
      const complaintScope = restrictComplaintsToUser
        ? "AND ca.engineer_id = $2"
        : "";
      searchParts.push(`
        SELECT * FROM (
          SELECT
            co.id,
            'complaints' AS "table",
            COALESCE(NULLIF(co.title, ''), 'Complaint') AS title,
            co.customer_id,
            CONCAT_WS(
              ' · ',
              'Complaints & Installations',
              CASE WHEN c.id IS NOT NULL THEN 'Customer: ' || COALESCE(NULLIF(c.name, ''), c.owner) END,
              CASE
                WHEN COUNT(engineer.id) > 0
                THEN 'Assigned to: ' || STRING_AGG(DISTINCT engineer.name, ', ')
              END
            ) AS description
          FROM complaints co
          LEFT JOIN customer c ON c.id = co.customer_id
          LEFT JOIN complaint_assignments ca ON ca.complaint_id = co.id
          LEFT JOIN users engineer ON engineer.id = ca.engineer_id
          WHERE (
            co.title ILIKE $1
            OR ca.engineer_id IN (SELECT id FROM matched_users)
            OR co.customer_id IN (SELECT id FROM matched_customers)
          )
          ${complaintScope}
          GROUP BY co.id, co.title, co.customer_id, co.created_at, c.id, c.name, c.owner
          ORDER BY co.created_at DESC NULLS LAST, co.id DESC
          LIMIT 10
        ) AS complaint_results
      `);
    }

    if (canSearchTasks) {
      const taskScope = canSearchAllTasks ? "" : "AND t.assigned_to = $2";
      searchParts.push(`
        SELECT * FROM (
          SELECT
            t.id,
            'task' AS "table",
            COALESCE(NULLIF(t.task_name, ''), 'Task') AS title,
            t.customer_id,
            CONCAT_WS(
              ' · ',
              'Tasks',
              CASE WHEN c.id IS NOT NULL THEN 'Customer: ' || COALESCE(NULLIF(c.name, ''), c.owner) END,
              CASE WHEN assigned_user.id IS NOT NULL THEN 'Assigned to: ' || assigned_user.name END
            ) AS description
          FROM task t
          LEFT JOIN customer c ON c.id = t.customer_id
          LEFT JOIN users assigned_user ON assigned_user.id = t.assigned_to
          WHERE (
            t.task_name ILIKE $1
            OR t.assigned_to IN (SELECT id FROM matched_users)
            OR t.customer_id IN (SELECT id FROM matched_customers)
          )
          ${taskScope}
          ORDER BY t.created_at DESC NULLS LAST, t.id DESC
          LIMIT 10
        ) AS task_results
      `);
    }

    const result = await pool.query<SearchRow>(
      `
        WITH matched_customers AS (
          SELECT c.id, c.name, c.owner, matches.title
          FROM customer c
          CROSS JOIN LATERAL (
            SELECT c.name AS title WHERE c.name ILIKE $1
            UNION
            SELECT c.owner AS title WHERE c.owner ILIKE $1
          ) matches
          WHERE ${customerScope}
        ),
        matched_users AS (
          SELECT id, name, designation
          FROM users
          WHERE name ILIKE $1
        )
        ${searchParts.join("\nUNION ALL\n")}
        ORDER BY "table", title
      `,
      usesUserIdParameter ? [`%${q}%`, user.id] : [`%${q}%`],
    );

    const results = result.rows.map((row) => {
      const routes: Record<SearchTable, string> = {
        customer: `/${baseRoute}/customer/${row.id}`,
        users: `/${baseRoute}/team/${row.id}`,
        sale: `/${baseRoute}/member/${row.customer_id}/${row.id}`,
        lab_tasks: `/${baseRoute}/repairandmaintenance?r=${row.id}`,
        complaints: `/${baseRoute}/complaint?c=${row.id}`,
        task: `/${baseRoute}/task?t=${row.id}`,
      };

      return { ...row, route: routes[row.table] };
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Global search failed:", error);
    return NextResponse.json(
      { message: "Unable to perform search" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
