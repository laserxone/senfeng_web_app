import pool from "@/config/db";
import { partFields, profileFields, saleFields } from "@/constants/data";
import { checkSuperadmin, getDesignation } from "@/lib/checkSuperadmin";
import momentT from 'moment-timezone';
import moment from "moment/moment";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {

    const { uid } = await params
    const searchParams = req.nextUrl.searchParams
    const office = searchParams.get('office')

    try {
        const isAdmin = await checkSuperadmin(uid)
        if (isAdmin) {

            const userDesignation = await getDesignation(uid)

            if (userDesignation === 'Customer Relationship Manager') {
                const responseData = await getCRMData(office || 'karachi'
                )
                return NextResponse.json(responseData, { status: 200 });

            } else {
                const responseData = await getAdminDashboardData(office || 'karachi')
                return NextResponse.json(responseData, { status: 200 });
            }

        } else {
            const TIMEZONE = "Asia/Karachi";
            const now = moment.tz(TIMEZONE);
            const currentMonthStart = now.clone().startOf("month").toISOString();
            const currentMonthEnd = now.clone().endOf("month").toISOString();
            const lastMonthStart = now.clone().subtract(1, "month").startOf("month").toISOString();
            const lastMonthEnd = now.clone().subtract(1, "month").endOf("month").toISOString();

            const [userResult] = await Promise.all([
                pool.query("SELECT id, dp, name, designation, limited_access FROM users WHERE id = $1", [uid])
            ]);

            if (userResult.rows.length === 0) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            const user = userResult.rows[0];

            if (user?.designation === 'Dealer') {

                const responseData = await getDealerData(uid)

                return NextResponse.json({ ...responseData, user }, { status: 200 });


            }
            else if (user?.designation === 'Store Manager') {

                const responseData = await getStoreData(uid)

                return NextResponse.json({ ...responseData, user }, { status: 200 });

            }
            else if (user?.designation === 'Sales') {

                const responseData = await getSalesData(currentMonthStart, currentMonthEnd, lastMonthStart, lastMonthEnd, uid)

                return NextResponse.json({ ...responseData, user }, { status: 200 });

            } else if (user?.designation === 'Customer Relationship Manager (After Sales)') {

                const responseData = await getCRMAfterSalesData(currentMonthStart, currentMonthEnd, uid)

                return NextResponse.json({ ...responseData, user }, { status: 200 });

            } else if (user?.designation === 'Engineer') {

                const responseData = await getEngineerData(uid)

                return NextResponse.json({ ...responseData, user }, { status: 200 });
            }
            else {
                return NextResponse.json({ user }, { status: 200 })
            }
        }


    } catch (error: any) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
    }
}

async function getCRMData(office: string) {

    const TIMEZONE = 'Asia/Karachi';
    const currentDate = momentT.tz(TIMEZONE);

    const firstCurrentMonth = currentDate.clone().startOf('month').startOf('day');
    const lastCurrentMonth = currentDate.clone().endOf('month').endOf('day');

    const firstLastMonth = currentDate.clone().subtract(1, 'month').startOf('month').startOf('day');
    const lastLastMonth = currentDate.clone().subtract(1, 'month').endOf('month').endOf('day');

    const firstThreeMonthsAgo = currentDate.clone().subtract(2, 'month').startOf('month').startOf('day');

    const firstDayOfCurrentMonth = firstCurrentMonth.clone().utc().toISOString();
    const lastDayOfCurrentMonth = lastCurrentMonth.clone().utc().toISOString();

    const firstDayOfLastMonth = firstLastMonth.clone().utc().toISOString();
    const lastDayOfLastMonth = lastLastMonth.clone().utc().toISOString();

    const firstDayOfThreeMonthsAgo = firstThreeMonthsAgo.clone().utc().toISOString();

    const startOfYesterday = currentDate.clone().subtract(1, 'day').startOf('day');
    const startOfYesterdayUTC = startOfYesterday.clone().utc().toISOString();


    const endOfToday = currentDate.clone().endOf('day');
    const endOfTodayUTC = endOfToday.clone().utc().toISOString();


    const machinesSoldLast3MonthsQuery = `
    SELECT 
        s.contract_date AS sale_date,
        COUNT(*) AS total_machines_sold 
    FROM sale s
    JOIN customer c ON s.customer_id = c.id
    WHERE s.contract_date BETWEEN $1 AND $2
      AND c.office = '${office}'
    GROUP BY sale_date
    ORDER BY sale_date;
`;

    const machinesSoldLast3MonthsResult = await pool.query(machinesSoldLast3MonthsQuery, [
        firstDayOfThreeMonthsAgo,
        lastDayOfCurrentMonth
    ]);

    const salesMap = new Map(
        machinesSoldLast3MonthsResult.rows.map(row => [
            moment(row.sale_date).format('YYYY-MM-DD'),
            Number(row.total_machines_sold)
        ])
    );

    const dateArray = [];
    let tempDate = moment.utc(firstDayOfThreeMonthsAgo);
    const endDate = moment.utc(lastDayOfCurrentMonth);

    while (tempDate.isSameOrBefore(endDate)) {
        const formattedDate = tempDate.format('YYYY-MM-DD');
        dateArray.push({
            date: formattedDate,
            total_machines_sold: salesMap.get(formattedDate) || 0
        });
        tempDate.add(1, 'day');
    }


    const paymentQuery = `
    SELECT 
        SUM(p.amount) AS total_payment
    FROM payment p
    JOIN sale s ON p.machine_id = s.id
    JOIN customer c ON s.customer_id = c.id
    WHERE p.transaction_date BETWEEN $1 AND $2
      AND c.office = '${office}';
`;

    const machinesSoldQuery = `
    SELECT COUNT(*) AS total_machines_sold
    FROM sale s
    JOIN customer c ON s.customer_id = c.id
    WHERE s.contract_date BETWEEN $1 AND $2
      AND c.office = '${office}';
`;

    // Query to get new customers added this month
    const newCustomersQuery = `
    SELECT COUNT(*) AS total_new_customers
    FROM customer c
    WHERE c.created_at BETWEEN $1 AND $2
      AND c.office = '${office}';
`;



    const recentSalesQuery = `
    SELECT 
        s.price,
        s.contract_date,
        u.name AS seller_name,
        u.email AS seller_email,
        u.dp AS seller_dp,
        c.id AS customer_id,
        c.name AS customer_name,
        c.owner AS customer_owner
    FROM sale s
    JOIN users u ON u.id = s.sell_by
    JOIN customer c ON c.id = s.customer_id
    WHERE c.office = '${office}'
    ORDER BY s.contract_date DESC
    LIMIT 5;
`;


    const industryCount = `
    SELECT 
      CASE 
        WHEN industry IS NULL OR industry = '' THEN 'No industry'
        ELSE industry
      END AS industry,
      COUNT(*) AS customer_count
    FROM customer
    WHERE office = '${office}'
    GROUP BY 
      CASE 
        WHEN industry IS NULL OR industry = '' THEN 'No industry'
        ELSE industry
      END;
`;

    const feedbackQuery = `
    WITH months AS (
  SELECT TO_CHAR(
    date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' * generate_series(0, 11),
    'YYYY-MM'
  ) AS month
)
SELECT 
  months.month,
  COALESCE(COUNT(CASE WHEN f.status = 'Satisfactory' THEN 1 END), 0) AS satisfactory,
  COALESCE(COUNT(CASE WHEN f.status = 'Unsatisfactory' THEN 1 END), 0) AS unsatisfactory
FROM months
LEFT JOIN feedback f 
  ON TO_CHAR(f.created_at, 'YYYY-MM') = months.month
LEFT JOIN customer c
  ON f.customer_id = c.id
WHERE c.office = '${office}'
GROUP BY months.month
ORDER BY months.month;

`;

    // Execute all queries in parallel

 const teamProgressQuery = `
WITH sales_users AS (
  SELECT id, name, email, monthly_target
  FROM users
  WHERE designation = 'Sales'
    AND office = $3
),

assigned_customers AS (
  SELECT
    c.ownership AS user_id,
    COUNT(*)::int AS customers_assigned,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', c.id,
        'name', c.name,
        'owner', c.owner,
        'phone', c.number,
        'location', c.location,
        'member', c.member,
        'created_at', c.created_at
      )
      ORDER BY c.created_at DESC
    ) AS customers_assigned_data
  FROM customer c
  WHERE c.ownership IS NOT NULL
    AND c.office = $3
    AND c.created_at BETWEEN $1 AND $2
  GROUP BY c.ownership
),

sale_produced_customers AS (
  SELECT
    x.user_id,
    COUNT(*)::int AS sale_produced_customers,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'customer', JSON_BUILD_OBJECT(
          'id', x.customer_id,
          'name', x.customer_name,
          'owner', x.customer_owner,
          'phone', x.customer_phone,
          'location', x.customer_location,
          'member', x.customer_member
        ),
        'sales', x.sales
      )
      ORDER BY x.latest_contract_date DESC
    ) AS sale_produced_data
  FROM (
    SELECT
      c.ownership AS user_id,
      c.id AS customer_id,
      c.name AS customer_name,
      c.owner AS customer_owner,
      c.number AS customer_phone,
      c.location AS customer_location,
      c.member AS customer_member,
      MAX(s.contract_date) AS latest_contract_date,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', s.id,
          'order_no_arr', s.order_no_arr,
          'serial_no', s.serial_no,
          'power', s.power,
          'contract_date', s.contract_date
        )
        ORDER BY s.contract_date DESC
      ) AS sales
    FROM customer c
    JOIN sale s 
      ON s.customer_id = c.id
    WHERE c.ownership IS NOT NULL
      AND c.office = $3
      AND s.contract_date BETWEEN $1 AND $2
    GROUP BY 
      c.ownership,
      c.id,
      c.name,
      c.owner,
      c.number,
      c.location,
      c.member
  ) x
  GROUP BY x.user_id
),

repeated_customers AS (
  SELECT
    x.user_id,
    COUNT(*)::int AS repeated_customers,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'customer', JSON_BUILD_OBJECT(
          'id', x.customer_id,
          'name', x.customer_name,
          'owner', x.customer_owner,
          'phone', x.customer_phone,
          'location', x.customer_location,
          'member', x.customer_member
        ),
        'sales', x.sales
      )
      ORDER BY x.latest_contract_date DESC
    ) AS repeated_customers_data
  FROM (
    SELECT
      c.ownership AS user_id,
      c.id AS customer_id,
      c.name AS customer_name,
      c.owner AS customer_owner,
      c.number AS customer_phone,
      c.location AS customer_location,
      c.member AS customer_member,
      MAX(s_new.contract_date) AS latest_contract_date,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', s_new.id,
          'order_no_arr', s_new.order_no_arr,
          'serial_no', s_new.serial_no,
          'power', s_new.power,
          'contract_date', s_new.contract_date
        )
        ORDER BY s_new.contract_date DESC
      ) AS sales
    FROM customer c
    JOIN sale s_new 
      ON s_new.customer_id = c.id
    WHERE c.ownership IS NOT NULL
      AND c.office = $3
      AND s_new.contract_date BETWEEN $1 AND $2
      AND EXISTS (
        SELECT 1
        FROM sale s_old
        WHERE s_old.customer_id = c.id
          AND s_old.contract_date < $1
      )
    GROUP BY 
      c.ownership,
      c.id,
      c.name,
      c.owner,
      c.number,
      c.location,
      c.member
  ) x
  GROUP BY x.user_id
)

SELECT
  u.id,
  u.name,
  u.email,
  u.monthly_target,

  COALESCE(ac.customers_assigned, 0) AS customers_assigned,
  COALESCE(ac.customers_assigned_data, '[]'::json) AS customers_assigned_data,

  COALESCE(sp.sale_produced_customers, 0) AS sale_produced_customers,
  COALESCE(sp.sale_produced_data, '[]'::json) AS sale_produced_data,

  COALESCE(rc.repeated_customers, 0) AS repeated_customers,
  COALESCE(rc.repeated_customers_data, '[]'::json) AS repeated_customers_data,

  CASE
    WHEN COALESCE(ac.customers_assigned, 0) = 0 THEN 0
    ELSE ROUND(
      (
        COALESCE(sp.sale_produced_customers, 0)::numeric
        / ac.customers_assigned::numeric
      ) * 100,
      2
    )
  END AS customer_to_member_conversion

FROM sales_users u
LEFT JOIN assigned_customers ac 
  ON ac.user_id = u.id
LEFT JOIN sale_produced_customers sp 
  ON sp.user_id = u.id
LEFT JOIN repeated_customers rc 
  ON rc.user_id = u.id
ORDER BY u.name ASC;
`;


    const taskQuery = `
  SELECT
    users.id AS assigned_user_id,
    users.name AS assigned_user_name,
    COUNT(task.id) AS total_tasks,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', task.id,
        'title', task.task_name,
        'status', task.status,
        'created_at', task.created_at,
        'customer_id', task.customer_id,
        'customer_name', customer.name,
        'customer_owner', customer.owner
      )
      ORDER BY task.created_at DESC
    ) AS tasks
  FROM task
  LEFT JOIN users ON task.assigned_to = users.id
  LEFT JOIN customer ON task.customer_id = customer.id
  WHERE task.created_at BETWEEN $1 AND $2
    AND users.office = 'karachi' AND users.designation = 'Sales'
  GROUP BY users.id, users.name
  ORDER BY MAX(task.created_at) DESC;
`;


    const duePaymentsQuery = `
  SELECT COALESCE(SUM(pr.amount), 0) AS total_due_payment
  FROM payment_requests pr
  WHERE pr.office = $1
    AND pr.request_type IS TRUE
`;

    const unassignedCustomersQuery = `
  SELECT
    c.*,
    CASE WHEN COUNT(f.id) > 0 THEN TRUE ELSE FALSE END AS has_feedback_this_month,
    COUNT(f.id)::int AS feedback_count_this_month
  FROM customer c
  LEFT JOIN feedback f
    ON f.customer_id = c.id
    AND f.created_at BETWEEN $1 AND $2
  WHERE c.created_at BETWEEN $1 AND $2
    AND c.office = $3
    AND NOT EXISTS (
      SELECT 1
      FROM sale s
      WHERE s.customer_id = c.id
    )
  GROUP BY c.id
  ORDER BY c.created_at DESC
`;

    const unassignedCustomersQueryTotal = `
  SELECT
    c.*
  FROM customer c
  WHERE c.ownership IS NULL
    AND c.office = $1
  ORDER BY c.created_at DESC
`;

    const topFollowupQuery = `
  SELECT
    f.*,
    c.name AS customer_name,
    c.owner AS customer_owner,
    c.number AS customer_phone,
    c.member AS customer_member
  FROM feedback f
  LEFT JOIN customer c ON c.id = f.customer_id
  WHERE f.top_follow IS TRUE
    AND f.next_followup BETWEEN $1 AND $2
    AND c.office = $3
    AND NOT EXISTS (
      SELECT 1
      FROM sale s
      WHERE s.customer_id = c.id
    )
  ORDER BY f.next_followup ASC
`;

    const resumesQuery = `
  SELECT *
  FROM resumes
  WHERE created_at BETWEEN $1 AND $2
  ORDER BY created_at DESC
`;

    const loansQuery = `
  SELECT
    l.*,
    u.name AS user_name
  FROM employee_loans l
  LEFT JOIN users u ON u.id = l.user_id
  WHERE u.office = $1
  ORDER BY l.issued_date DESC
`;



    const [
        paymentResult,
        machinesSoldResult,
        newCustomersResult,
        recentSalesResult,
        industryCountResult,
        feedbackResult,
        tempProgressResult,
        taskResult,
        duePaymentsResult,
        unassignedCustomersResult,
        topFollowupResult,
        resumesResult,
        loansResult,
        totalUnassigned
    ] = await Promise.all([
        pool.query(paymentQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
        pool.query(machinesSoldQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
        pool.query(newCustomersQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
        pool.query(recentSalesQuery),
        pool.query(industryCount),
        pool.query(feedbackQuery),
        pool.query(teamProgressQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth, office]),
        pool.query(taskQuery, [startOfYesterdayUTC, endOfTodayUTC]),
        pool.query(duePaymentsQuery, [office]),
        pool.query(unassignedCustomersQuery, [
            firstDayOfCurrentMonth,
            lastDayOfCurrentMonth,
            office,
        ]),
        pool.query(topFollowupQuery, [
            firstDayOfCurrentMonth,
            lastDayOfCurrentMonth,
            office,
        ]),
        pool.query(resumesQuery, [
            firstDayOfCurrentMonth,
            lastDayOfCurrentMonth,
        ]),
        pool.query(loansQuery, [office]),
        pool.query(unassignedCustomersQueryTotal, [office])
    ]);

    const formattedFeedbackData = feedbackResult.rows.map(row => ({
        month: new Date(row.month + "-01").toLocaleString('en-US', { month: 'long' }),
        satisfactory: parseInt(row.satisfactory, 10),
        unsatisfactory: parseInt(row.unsatisfactory, 10)
    }));

    // Get the payment for last month
    const lastMonthPaymentResult = await pool.query(paymentQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
    const totalPaymentThisMonth = paymentResult.rows[0].total_payment || 0;
    const totalPaymentLastMonth = lastMonthPaymentResult.rows[0].total_payment || 0;

    // Get the total machines sold last month
    const lastMonthMachinesSoldResult = await pool.query(machinesSoldQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
    const totalMachinesSoldThisMonth = machinesSoldResult.rows[0].total_machines_sold || 0;
    const totalMachinesSoldLastMonth = lastMonthMachinesSoldResult.rows[0].total_machines_sold || 0;

    // Get the new customers added last month
    const lastMonthNewCustomersResult = await pool.query(newCustomersQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
    const totalNewCustomersThisMonth = newCustomersResult.rows[0].total_new_customers || 0;
    const totalNewCustomersLastMonth = lastMonthNewCustomersResult.rows[0].total_new_customers || 0;

    const teamTasks: any[] = taskResult.rows
    const updatedTasks = teamTasks.map(user => {
        const updatedUserTasks = user.tasks.map((task: any) => {
            if (task.customer_id) {
                const [firstPart] = task.title.split("-");
                const customerInfo = task.customer_name || task.customer_owner || "";
                const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
                return {
                    ...task,
                    title: updatedTitle
                };
            }
            return task;
        });

        return {
            ...user,
            tasks: updatedUserTasks
        };
    });

    const paymentLast = Number(totalPaymentLastMonth) || 0;
    const paymentThis = Number(totalPaymentThisMonth) || 0;
    const machinesLast = Number(totalMachinesSoldLastMonth) || 0;
    const machinesThis = Number(totalMachinesSoldThisMonth) || 0;
    const customersLast = Number(totalNewCustomersLastMonth) || 0;
    const customersThis = Number(totalNewCustomersThisMonth) || 0;

    const paymentChangePercentage = paymentLast === 0
        ? 0
        : ((paymentThis - paymentLast) / paymentLast) * 100;

    const machinesSoldChangePercentage = machinesLast === 0
        ? 0
        : ((machinesThis - machinesLast) / machinesLast) * 100;

    const newCustomerChangePercentage = customersLast === 0
        ? 0
        : ((customersThis - customersLast) / customersLast) * 100;


    const complaintStats = await pool.query(`
  WITH payment_totals AS (
    SELECT
      complaint_id,
      SUM(amount) AS paid_amount
    FROM complaint_payments
    GROUP BY complaint_id
  )
  SELECT
    COALESCE(SUM(pt.paid_amount), 0) AS total_paid,
    COALESCE(SUM(
      CASE 
        WHEN c.paid = true 
        THEN GREATEST(c.charges - COALESCE(pt.paid_amount, 0), 0)
        ELSE 0
      END
    ), 0) AS total_pending
  FROM complaints c
  LEFT JOIN payment_totals pt ON pt.complaint_id = c.id
  WHERE c.managing_office = 'karachi';
`);

    const query = `
  SELECT
    si.*,
    COALESCE(
        NULLIF(TRIM(si.manager), ''),
        u.name,
        ''
    ) AS manager,
    COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
FROM savedinvoices_karachi si
LEFT JOIN customer_parts_karachi cp
    ON cp.part_id = si.id
LEFT JOIN customer c
    ON c.id = si.customer_id
LEFT JOIN users u
    ON u.id = c.ownership
WHERE si.owner_paid IS FALSE
GROUP BY si.id, u.name
ORDER BY created_at DESC
`;

    const result = await pool.query(query)

    const invoices = result.rows.map((invoice) => {
        const itemsTotal = Array.isArray(invoice.fields)
            ? invoice.fields.reduce((sum: number, item: any) => {
                const val = Number(item?.total ?? 0);
                return sum + (isNaN(val) ? 0 : val);
            }, 0)
            : 0;
        const discount = Number(invoice.discount ?? 0);
        const finalAmount = itemsTotal - discount;
        const totalPaid = Number(invoice.total_paid ?? 0);
        let status = "NA";
        if (itemsTotal === 0) status = "Paid"
        else if (totalPaid === 0) status = "Pending";
        else if (finalAmount - totalPaid !== 0) status = "Partial";
        else status = "Paid";

        return {
            ...invoice,
            items_total: itemsTotal,
            discount,
            final_amount: finalAmount - totalPaid,
            status,
        };
    }).filter((item) => item.status !== "Paid")

    let totalPending = 0;

    totalPending = invoices.reduce((sum, item) => sum + (item.final_amount || 0), 0)

    const unassignedCustomers = unassignedCustomersResult.rows;

    const customersWithFeedback = unassignedCustomers.filter(
        (c) => c.has_feedback_this_month === true
    );

    const customersWithoutFeedback = unassignedCustomers.filter(
        (c) => c.has_feedback_this_month === false
    );

    const responseData = {
        total_payment_this_month: totalPaymentThisMonth,
        payment_change_percentage: paymentChangePercentage.toFixed(2),

        total_machines_sold_this_month: totalMachinesSoldThisMonth,
        machines_sold_change_percentage: machinesSoldChangePercentage.toFixed(2),

        total_new_customers_this_month: totalNewCustomersThisMonth,
        new_customer_change_percentage: newCustomerChangePercentage.toFixed(2),

        recent_sales: recentSalesResult.rows,
        industry_count: industryCountResult.rows,
        machines_sold_last_3_months: dateArray,
        feedback_status_last_6_months: formattedFeedbackData,

        team_progress: tempProgressResult.rows,
        team_task: updatedTasks,

        complaint_stats: complaintStats.rows?.[0],

        total_due_payment: Number(duePaymentsResult.rows[0]?.total_due_payment || 0),
        pos_stats: {
            pending: totalPending,
        },

        unassigned_customers: {
            total: unassignedCustomers.length,
            data: [...customersWithFeedback, ...customersWithoutFeedback],
            with_feedback: {
                total: customersWithFeedback.length,
                data: customersWithFeedback,
            },
            without_feedback: {
                total: customersWithoutFeedback.length,
                data: customersWithoutFeedback,
            },
        },

        top_followup: {
            total: topFollowupResult.rows.length,
            data: topFollowupResult.rows,
        },

        resumes: {
            total: resumesResult.rows.length,
            data: resumesResult.rows,
        },

        loans: loansResult.rows,

        total_unassigned: {
            data: totalUnassigned.rows,
            length: totalUnassigned.rows.length
        }
    };
    return responseData
}

async function getAdminDashboardData(office: string) {

    const TIMEZONE = 'Asia/Karachi';
    const currentDate = momentT.tz(TIMEZONE);

    const firstCurrentMonth = currentDate.clone().startOf('month').startOf('day');
    const lastCurrentMonth = currentDate.clone().endOf('month').endOf('day');

    const firstLastMonth = currentDate.clone().subtract(1, 'month').startOf('month').startOf('day');
    const lastLastMonth = currentDate.clone().subtract(1, 'month').endOf('month').endOf('day');

    const firstThreeMonthsAgo = currentDate.clone().subtract(2, 'month').startOf('month').startOf('day');

    const firstDayOfCurrentMonth = firstCurrentMonth.clone().utc().toISOString();
    const lastDayOfCurrentMonth = lastCurrentMonth.clone().utc().toISOString();

    const firstDayOfLastMonth = firstLastMonth.clone().utc().toISOString();
    const lastDayOfLastMonth = lastLastMonth.clone().utc().toISOString();

    const firstDayOfThreeMonthsAgo = firstThreeMonthsAgo.clone().utc().toISOString();

    const startOfYesterday = currentDate.clone().subtract(1, 'day').startOf('day');
    const startOfYesterdayUTC = startOfYesterday.clone().utc().toISOString();


    const endOfToday = currentDate.clone().endOf('day');
    const endOfTodayUTC = endOfToday.clone().utc().toISOString();


    const machinesSoldLast3MonthsQuery = `
    SELECT 
        s.contract_date AS sale_date,
        COUNT(*) AS total_machines_sold 
    FROM sale s
    JOIN customer c ON s.customer_id = c.id
    WHERE s.contract_date BETWEEN $1 AND $2
      AND c.office = '${office}'
    GROUP BY sale_date
    ORDER BY sale_date;
`;

    const machinesSoldLast3MonthsResult = await pool.query(machinesSoldLast3MonthsQuery, [
        firstDayOfThreeMonthsAgo,
        lastDayOfCurrentMonth
    ]);

    const salesMap = new Map(
        machinesSoldLast3MonthsResult.rows.map(row => [
            moment(row.sale_date).format('YYYY-MM-DD'),
            Number(row.total_machines_sold)
        ])
    );

    const dateArray = [];
    let tempDate = moment.utc(firstDayOfThreeMonthsAgo);
    const endDate = moment.utc(lastDayOfCurrentMonth);

    while (tempDate.isSameOrBefore(endDate)) {
        const formattedDate = tempDate.format('YYYY-MM-DD');
        dateArray.push({
            date: formattedDate,
            total_machines_sold: salesMap.get(formattedDate) || 0
        });
        tempDate.add(1, 'day');
    }


    const paymentQuery = `
    SELECT 
        SUM(p.amount) AS total_payment
    FROM payment p
    JOIN sale s ON p.machine_id = s.id
    JOIN customer c ON s.customer_id = c.id
    WHERE p.transaction_date BETWEEN $1 AND $2
      AND c.office = '${office}';
`;

    const machinesSoldQuery = `
    SELECT COUNT(*) AS total_machines_sold
    FROM sale s
    JOIN customer c ON s.customer_id = c.id
    WHERE s.contract_date BETWEEN $1 AND $2
      AND c.office = '${office}';
`;

    // Query to get new customers added this month
    const newCustomersQuery = `
    SELECT COUNT(*) AS total_new_customers
    FROM customer c
    WHERE c.created_at BETWEEN $1 AND $2
      AND c.office = '${office}';
`;



    const recentSalesQuery = `
    SELECT 
        s.price,
        s.contract_date,
        u.name AS seller_name,
        u.email AS seller_email,
        u.dp AS seller_dp,
        c.id AS customer_id,
        c.name AS customer_name,
        c.owner AS customer_owner
    FROM sale s
    JOIN users u ON u.id = s.sell_by
    JOIN customer c ON c.id = s.customer_id
    WHERE c.office = '${office}'
    ORDER BY s.contract_date DESC
    LIMIT 5;
`;


    const industryCount = `
    SELECT 
      CASE 
        WHEN industry IS NULL OR industry = '' THEN 'No industry'
        ELSE industry
      END AS industry,
      COUNT(*) AS customer_count
    FROM customer
    WHERE office = '${office}'
    GROUP BY 
      CASE 
        WHEN industry IS NULL OR industry = '' THEN 'No industry'
        ELSE industry
      END;
`;

    const feedbackQuery = `
    WITH months AS (
  SELECT TO_CHAR(
    date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' * generate_series(0, 11),
    'YYYY-MM'
  ) AS month
)
SELECT 
  months.month,
  COALESCE(COUNT(CASE WHEN f.status = 'Satisfactory' THEN 1 END), 0) AS satisfactory,
  COALESCE(COUNT(CASE WHEN f.status = 'Unsatisfactory' THEN 1 END), 0) AS unsatisfactory
FROM months
LEFT JOIN feedback f 
  ON TO_CHAR(f.created_at, 'YYYY-MM') = months.month
LEFT JOIN customer c
  ON f.customer_id = c.id
WHERE c.office = '${office}'
GROUP BY months.month
ORDER BY months.month;

`;

    // Execute all queries in parallel

    const teamProgressQuery = `
WITH sales_users AS (
  SELECT id, name, email, monthly_target
  FROM users
  WHERE designation = 'Sales' AND office = '${office}'
),
feedback_count AS (
  SELECT f.user_id, COUNT(*) AS total_feedbacks
  FROM feedback f
  WHERE f.created_at BETWEEN $1 AND $2
  GROUP BY f.user_id
),
visit_count AS (
  SELECT v.user_id, COUNT(*) AS total_visits
  FROM visit v
  WHERE v.created_at BETWEEN $1 AND $2
  GROUP BY v.user_id
),
customer_count AS (
  SELECT c.ownership AS user_id, COUNT(DISTINCT c.id) AS total_members
  FROM customer c
  INNER JOIN sale s ON s.customer_id = c.id
  GROUP BY c.ownership
),
sale_sum AS (
  SELECT s.sell_by AS user_id, SUM(s.price) AS total_sale_price
  FROM sale s
  WHERE s.contract_date BETWEEN $1 AND $2
  GROUP BY s.sell_by
)
SELECT 
  u.id,
  u.name,
  u.email,
  u.monthly_target,
  COALESCE(s.total_sale_price, 0) AS total_sale_price,
  COALESCE(c.total_members, 0) AS total_members,
  COALESCE(f.total_feedbacks, 0) AS total_feedbacks,
  COALESCE(v.total_visits, 0) AS total_visits
FROM sales_users u
LEFT JOIN feedback_count f ON u.id = f.user_id
LEFT JOIN visit_count v ON u.id = v.user_id
LEFT JOIN customer_count c ON u.id = c.user_id
LEFT JOIN sale_sum s ON u.id = s.user_id;
`;


    const taskQuery = `
  SELECT
    users.id AS assigned_user_id,
    users.name AS assigned_user_name,
    COUNT(task.id) AS total_tasks,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', task.id,
        'title', task.task_name,
        'status', task.status,
        'created_at', task.created_at,
        'customer_id', task.customer_id,
        'customer_name', customer.name,
        'customer_owner', customer.owner
      )
      ORDER BY task.created_at DESC
    ) AS tasks
  FROM task
  LEFT JOIN users ON task.assigned_to = users.id
  LEFT JOIN customer ON task.customer_id = customer.id
  WHERE task.created_at BETWEEN $1 AND $2
    AND users.office = 'karachi'
  GROUP BY users.id, users.name
  ORDER BY MAX(task.created_at) DESC;
`;




    const [
        paymentResult,
        machinesSoldResult,
        newCustomersResult,
        recentSalesResult,
        industryCountResult,
        feedbackResult,
        tempProgressResult,
        taskResult
    ] = await Promise.all([
        pool.query(paymentQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
        pool.query(machinesSoldQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
        pool.query(newCustomersQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
        pool.query(recentSalesQuery),
        pool.query(industryCount),
        pool.query(feedbackQuery),
        pool.query(teamProgressQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth]),
        pool.query(taskQuery, [startOfYesterdayUTC, endOfTodayUTC])
    ]);

    const formattedFeedbackData = feedbackResult.rows.map(row => ({
        month: new Date(row.month + "-01").toLocaleString('en-US', { month: 'long' }),
        satisfactory: parseInt(row.satisfactory, 10),
        unsatisfactory: parseInt(row.unsatisfactory, 10)
    }));

    // Get the payment for last month
    const lastMonthPaymentResult = await pool.query(paymentQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
    const totalPaymentThisMonth = paymentResult.rows[0].total_payment || 0;
    const totalPaymentLastMonth = lastMonthPaymentResult.rows[0].total_payment || 0;

    // Get the total machines sold last month
    const lastMonthMachinesSoldResult = await pool.query(machinesSoldQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
    const totalMachinesSoldThisMonth = machinesSoldResult.rows[0].total_machines_sold || 0;
    const totalMachinesSoldLastMonth = lastMonthMachinesSoldResult.rows[0].total_machines_sold || 0;

    // Get the new customers added last month
    const lastMonthNewCustomersResult = await pool.query(newCustomersQuery, [firstDayOfLastMonth, lastDayOfLastMonth]);
    const totalNewCustomersThisMonth = newCustomersResult.rows[0].total_new_customers || 0;
    const totalNewCustomersLastMonth = lastMonthNewCustomersResult.rows[0].total_new_customers || 0;

    const teamTasks: any[] = taskResult.rows
    const updatedTasks = teamTasks.map(user => {
        const updatedUserTasks = user.tasks.map((task: any) => {
            if (task.customer_id) {
                const [firstPart] = task.title.split("-");
                const customerInfo = task.customer_name || task.customer_owner || "";
                const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
                return {
                    ...task,
                    title: updatedTitle
                };
            }
            return task;
        });

        return {
            ...user,
            tasks: updatedUserTasks
        };
    });

    const paymentLast = Number(totalPaymentLastMonth) || 0;
    const paymentThis = Number(totalPaymentThisMonth) || 0;
    const machinesLast = Number(totalMachinesSoldLastMonth) || 0;
    const machinesThis = Number(totalMachinesSoldThisMonth) || 0;
    const customersLast = Number(totalNewCustomersLastMonth) || 0;
    const customersThis = Number(totalNewCustomersThisMonth) || 0;

    const paymentChangePercentage = paymentLast === 0
        ? 0
        : ((paymentThis - paymentLast) / paymentLast) * 100;

    const machinesSoldChangePercentage = machinesLast === 0
        ? 0
        : ((machinesThis - machinesLast) / machinesLast) * 100;

    const newCustomerChangePercentage = customersLast === 0
        ? 0
        : ((customersThis - customersLast) / customersLast) * 100;


    const complaintStats = await pool.query(`
  WITH payment_totals AS (
    SELECT
      complaint_id,
      SUM(amount) AS paid_amount
    FROM complaint_payments
    GROUP BY complaint_id
  )
  SELECT
    COALESCE(SUM(pt.paid_amount), 0) AS total_paid,
    COALESCE(SUM(
      CASE 
        WHEN c.paid = true 
        THEN GREATEST(c.charges - COALESCE(pt.paid_amount, 0), 0)
        ELSE 0
      END
    ), 0) AS total_pending
  FROM complaints c
  LEFT JOIN payment_totals pt ON pt.complaint_id = c.id
  WHERE c.managing_office = 'karachi';
`);

    const query = `
  SELECT
    si.*,
    COALESCE(
        NULLIF(TRIM(si.manager), ''),
        u.name,
        ''
    ) AS manager,
    COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
FROM savedinvoices_karachi si
LEFT JOIN customer_parts_karachi cp
    ON cp.part_id = si.id
LEFT JOIN customer c
    ON c.id = si.customer_id
LEFT JOIN users u
    ON u.id = c.ownership
WHERE si.owner_paid IS FALSE
GROUP BY si.id, u.name
ORDER BY created_at DESC
`;

    const result = await pool.query(query)

    const invoices = result.rows.map((invoice) => {
        const itemsTotal = Array.isArray(invoice.fields)
            ? invoice.fields.reduce((sum: number, item: any) => {
                const val = Number(item?.total ?? 0);
                return sum + (isNaN(val) ? 0 : val);
            }, 0)
            : 0;
        const discount = Number(invoice.discount ?? 0);
        const finalAmount = itemsTotal - discount;
        const totalPaid = Number(invoice.total_paid ?? 0);
        let status = "NA";
        if (itemsTotal === 0) status = "Paid"
        else if (totalPaid === 0) status = "Pending";
        else if (finalAmount - totalPaid !== 0) status = "Partial";
        else status = "Paid";

        return {
            ...invoice,
            items_total: itemsTotal,
            discount,
            final_amount: finalAmount - totalPaid,
            status,
        };
    }).filter(
        (item) =>
            moment(item.created_at).isSameOrAfter("2025-12-01") ||
            item.payment === false
    ).filter((item) => item.status !== "Paid")

    let totalPending = 0;

    totalPending = invoices.reduce((sum, item) => sum + (item.final_amount || 0), 0)

    const responseData = {
        total_payment_this_month: totalPaymentThisMonth,
        payment_change_percentage: paymentChangePercentage.toFixed(2),
        total_machines_sold_this_month: totalMachinesSoldThisMonth,
        machines_sold_change_percentage: machinesSoldChangePercentage.toFixed(2),
        total_new_customers_this_month: totalNewCustomersThisMonth,
        new_customer_change_percentage: newCustomerChangePercentage.toFixed(2),
        recent_sales: recentSalesResult.rows.map(sale => ({
            price: sale.price,
            contract_date: sale.contract_date,
            seller_name: sale.seller_name,
            seller_email: sale.seller_email,
            seller_dp: sale.seller_dp,
            customer_id: sale.customer_id,
            customer_name: sale.customer_name,
            customer_owner: sale.customer_owner
        })),
        industry_count: industryCountResult.rows,
        machines_sold_last_3_months: dateArray,
        feedback_status_last_6_months: formattedFeedbackData,
        team_progress: tempProgressResult.rows,
        team_task: updatedTasks,
        complaint_stats: complaintStats.rows?.[0],
        pos_stats: { pending: totalPending }
    };
    return responseData
}

async function getDealerData(uid: string) {

    const TIMEZONE = 'Asia/Karachi';
    const currentDate = momentT.tz(TIMEZONE);

    const firstCurrentMonth = currentDate.clone().startOf('month').startOf('day');
    const lastCurrentMonth = currentDate.clone().endOf('month').endOf('day');

    const firstLastMonth = currentDate.clone().subtract(1, 'month').startOf('month').startOf('day');
    const lastLastMonth = currentDate.clone().subtract(1, 'month').endOf('month').endOf('day');

    const firstThreeMonthsAgo = currentDate.clone().subtract(2, 'month').startOf('month').startOf('day');

    const firstDayOfCurrentMonth = firstCurrentMonth.clone().utc().toISOString();
    const lastDayOfCurrentMonth = lastCurrentMonth.clone().utc().toISOString();

    const firstDayOfLastMonth = firstLastMonth.clone().utc().toISOString();
    const lastDayOfLastMonth = lastLastMonth.clone().utc().toISOString();

    const firstDayOfThreeMonthsAgo = firstThreeMonthsAgo.clone().utc().toISOString();

    const startOfYesterday = currentDate.clone().subtract(1, 'day').startOf('day');
    const startOfYesterdayUTC = startOfYesterday.clone().utc().toISOString();


    const endOfToday = currentDate.clone().endOf('day');
    const endOfTodayUTC = endOfToday.clone().utc().toISOString();


    const machinesSoldLast3MonthsQuery = `
    SELECT 
        s.contract_date AS sale_date,
        COUNT(*) AS total_machines_sold 
    FROM 
        sale s 
    WHERE 
        s.contract_date BETWEEN $1 AND $2 AND s.sell_by = $3
    GROUP BY sale_date
    ORDER BY sale_date;
`;

    const machinesSoldLast3MonthsResult = await pool.query(machinesSoldLast3MonthsQuery, [
        firstDayOfThreeMonthsAgo,
        lastDayOfCurrentMonth,
        uid
    ]);

    const salesMap = new Map(
        machinesSoldLast3MonthsResult.rows.map(row => [
            moment(row.sale_date).format('YYYY-MM-DD'),
            Number(row.total_machines_sold)
        ])
    );

    const dateArray = [];
    let tempDate = moment.utc(firstDayOfThreeMonthsAgo);
    const endDate = moment.utc(lastDayOfCurrentMonth);

    while (tempDate.isSameOrBefore(endDate)) {
        const formattedDate = tempDate.format('YYYY-MM-DD');
        dateArray.push({
            date: formattedDate,
            total_machines_sold: salesMap.get(formattedDate) || 0
        });
        tempDate.add(1, 'day');
    }

    const paymentQuery = `
    SELECT 
        SUM(p.amount) AS total_payment
    FROM 
        payment p
    INNER JOIN 
        sale s ON p.machine_id = s.id
    WHERE 
        p.transaction_date BETWEEN $1 AND $2
        AND s.sell_by = $3
`;


    const machinesSoldQuery = `
            SELECT 
                COUNT(*) AS total_machines_sold
            FROM 
                sale s
            WHERE 
                s.contract_date BETWEEN $1 AND $2 AND s.sell_by = $3
        `;

    // Query to get new customers added this month
    const newCustomersQuery = `
            SELECT 
                COUNT(*) AS total_new_customers
            FROM 
                customer c
            WHERE 
                c.created_at BETWEEN $1 AND $2 AND c.ownership = $3
        `;



    const recentSalesQuery = `
        SELECT 
        s.price,
        s.contract_date,
        u.name AS seller_name,
        u.email AS seller_email,
        u.dp AS seller_dp,
        c.id AS customer_id,
        c.name AS customer_name,
        c.owner AS customer_owner
        FROM 
        sale s
        JOIN 
        users u ON u.id = s.sell_by
        JOIN 
        customer c ON c.id = s.customer_id
        WHERE s.sell_by = $1
        ORDER BY 
        s.contract_date DESC
        LIMIT 5;
`;


    const industryCount = `
       SELECT 
  CASE 
    WHEN industry IS NULL OR industry = '' THEN 'No industry'
    ELSE industry
  END AS industry,
  COUNT(*) AS customer_count
FROM customer
WHERE ownership = $1
GROUP BY 
  CASE 
    WHEN industry IS NULL OR industry = '' THEN 'No industry'
    ELSE industry
  END;
        `


    const [
        paymentResult,
        machinesSoldResult,
        newCustomersResult,
        recentSalesResult,
        industryCountResult,
    ] = await Promise.all([
        pool.query(paymentQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth, uid]),
        pool.query(machinesSoldQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth, uid]),
        pool.query(newCustomersQuery, [firstDayOfCurrentMonth, lastDayOfCurrentMonth, uid]),
        pool.query(recentSalesQuery, [uid]),
        pool.query(industryCount, [uid]),
    ]);


    // Get the payment for last month
    const lastMonthPaymentResult = await pool.query(paymentQuery, [firstDayOfLastMonth, lastDayOfLastMonth, uid]);
    const totalPaymentThisMonth = paymentResult.rows[0].total_payment || 0;
    const totalPaymentLastMonth = lastMonthPaymentResult.rows[0].total_payment || 0;

    // Get the total machines sold last month
    const lastMonthMachinesSoldResult = await pool.query(machinesSoldQuery, [firstDayOfLastMonth, lastDayOfLastMonth, uid]);
    const totalMachinesSoldThisMonth = machinesSoldResult.rows[0].total_machines_sold || 0;
    const totalMachinesSoldLastMonth = lastMonthMachinesSoldResult.rows[0].total_machines_sold || 0;

    // Get the new customers added last month
    const lastMonthNewCustomersResult = await pool.query(newCustomersQuery, [firstDayOfLastMonth, lastDayOfLastMonth, uid]);
    const totalNewCustomersThisMonth = newCustomersResult.rows[0].total_new_customers || 0;
    const totalNewCustomersLastMonth = lastMonthNewCustomersResult.rows[0].total_new_customers || 0;


    const paymentLast = Number(totalPaymentLastMonth) || 0;
    const paymentThis = Number(totalPaymentThisMonth) || 0;
    const machinesLast = Number(totalMachinesSoldLastMonth) || 0;
    const machinesThis = Number(totalMachinesSoldThisMonth) || 0;
    const customersLast = Number(totalNewCustomersLastMonth) || 0;
    const customersThis = Number(totalNewCustomersThisMonth) || 0;

    const paymentChangePercentage = paymentLast === 0
        ? 0
        : ((paymentThis - paymentLast) / paymentLast) * 100;

    const machinesSoldChangePercentage = machinesLast === 0
        ? 0
        : ((machinesThis - machinesLast) / machinesLast) * 100;

    const newCustomerChangePercentage = customersLast === 0
        ? 0
        : ((customersThis - customersLast) / customersLast) * 100;

    // Prepare the response data
    const responseData = {
        total_payment_this_month: totalPaymentThisMonth,
        payment_change_percentage: paymentChangePercentage.toFixed(2), // rounded to 2 decimal places
        total_machines_sold_this_month: totalMachinesSoldThisMonth,
        machines_sold_change_percentage: machinesSoldChangePercentage.toFixed(2),
        total_new_customers_this_month: totalNewCustomersThisMonth,
        new_customer_change_percentage: newCustomerChangePercentage.toFixed(2),
        recent_sales: recentSalesResult.rows.map(sale => ({
            price: sale.price,
            contract_date: sale.contract_date,
            seller_name: sale.seller_name,
            seller_email: sale.seller_email,
            seller_dp: sale.seller_dp,
            customer_id: sale.customer_id,
            customer_name: sale.customer_name,
            customer_owner: sale.customer_owner
        })),
        industry_count: industryCountResult.rows,
        machines_sold_last_3_months: dateArray,
    };

    return responseData
}

async function getSalesData(currentMonthStart: string, currentMonthEnd: string, lastMonthStart: string, lastMonthEnd: string, uid: string) {

    const [customersQuery] = await Promise.all([
        pool.query(`SELECT DISTINCT c.*
    FROM customer c
    LEFT JOIN sale s ON s.customer_id = c.id
    WHERE c.ownership = $1
      AND (
        c.member IS TRUE
        OR s.id IS NOT NULL
      )
    ORDER BY c.created_at DESC`, [uid]),

    ]);

    const customersWithSale = customersQuery.rows;
    const totalCustomersWithSale = customersWithSale.length;


    const saleCustomerIds = customersWithSale.map(c => c.id);

    let sales = [];
    let payments = [];

    if (saleCustomerIds.length > 0) {
        const salesQuery = await pool.query(`SELECT * FROM sale WHERE customer_id = ANY($1)`, [saleCustomerIds]);
        sales = salesQuery.rows;

        if (sales.length > 0) {
            const machineIds = sales.map(s => s.id);
            const paymentsQuery = await pool.query(`SELECT id, amount, machine_id FROM payment WHERE machine_id = ANY($1)`, [machineIds]);
            payments = paymentsQuery.rows;
        }
    }



    const machinesSoldQuery = `
      SELECT COUNT(*) AS total 
      FROM sale 
      WHERE contract_date BETWEEN $1 AND $2 AND sell_by = $3
    `;

    const pendingPaymentsQuery = `
  WITH payment_totals AS (
    SELECT
      machine_id,
      COALESCE(SUM(amount::numeric), 0) AS total_paid
    FROM payment
    GROUP BY machine_id
  )
  SELECT
    s.*,
    COALESCE(pt.total_paid, 0) AS total_paid,
    GREATEST(COALESCE(s.price::numeric, 0) - COALESCE(pt.total_paid, 0), 0) AS pending_amount,
    JSON_BUILD_OBJECT(
      'id', c.id,
      'name', c.name,
      'owner', c.owner,
      'number', c.number,
      'location', c.location,
      'industry', c.industry,
      'member', c.member,
      'created_at', c.created_at
    ) AS customer
  FROM sale s
  LEFT JOIN payment_totals pt ON pt.machine_id = s.id
  LEFT JOIN customer c ON c.id = s.customer_id
  WHERE s.sell_by = $1
    AND GREATEST(COALESCE(s.price::numeric, 0) - COALESCE(pt.total_paid, 0), 0) > 0
    AND NOT EXISTS (
      SELECT 1
      FROM cancelled_machine cm
      WHERE cm.machine_id = s.id
    )
  ORDER BY s.contract_date DESC
`;

    const pendingPartsPaymentQuery = `
  SELECT
    si.*,
    COALESCE(
      NULLIF(TRIM(si.manager), ''),
      u.name,
      ''
    ) AS manager,
    COALESCE(SUM(cp.amount::numeric), 0) AS total_paid,
    JSON_BUILD_OBJECT(
      'id', c.id,
      'name', c.name,
      'owner', c.owner,
      'number', c.number,
      'location', c.location,
      'industry', c.industry,
      'member', c.member,
      'created_at', c.created_at
    ) AS customer
  FROM savedinvoices_karachi si
  LEFT JOIN customer_parts_karachi cp ON cp.part_id = si.id
  LEFT JOIN customer c ON c.id = si.customer_id
  LEFT JOIN users u ON u.id = c.ownership
  WHERE si.owner_paid IS FALSE
    AND c.ownership = $1
  GROUP BY si.id, u.name, c.id
  ORDER BY si.created_at DESC
`;

    const pendingDeliveriesQuery = `
  SELECT
    s.*,
    JSON_BUILD_OBJECT(
      'id', c.id,
      'name', c.name,
      'owner', c.owner,
      'number', c.number,
      'location', c.location,
      'industry', c.industry,
      'member', c.member,
      'created_at', c.created_at
    ) AS customer
  FROM sale s
  LEFT JOIN customer c ON c.id = s.customer_id
  WHERE s.sell_by = $1
    AND s.ready_for_delivery IS FALSE
    AND NOT EXISTS (
      SELECT 1
      FROM cancelled_machine cm
      WHERE cm.machine_id = s.id
    )
  ORDER BY s.contract_date DESC
`;

    const topFollowQuery = `
  WITH latest_feedback AS (
    SELECT DISTINCT ON (f.customer_id)
      f.*
    FROM feedback f
    INNER JOIN customer c ON c.id = f.customer_id
    WHERE c.ownership = $3
    ORDER BY f.customer_id, f.created_at DESC, f.id DESC
  )
  SELECT
    lf.*,
    JSON_BUILD_OBJECT(
      'id', c.id,
      'name', c.name,
      'owner', c.owner,
      'number', c.number,
      'location', c.location,
      'industry', c.industry,
      'member', c.member,
      'created_at', c.created_at
    ) AS customer
  FROM latest_feedback lf
  INNER JOIN customer c ON c.id = lf.customer_id
  WHERE lf.top_follow IS TRUE
    AND lf.next_followup BETWEEN $1 AND $2
  ORDER BY lf.next_followup ASC
`;

    const newlyAssignedCustomersQuery = `
  SELECT *
  FROM customer
  WHERE ownership = $1
    AND created_at BETWEEN $2 AND $3
  ORDER BY created_at DESC
`;



    const [
        currentMonthSalesResult,
        lastMonthSalesResult,
        saleDetailsQueryResult,
        feedbackQueryResult,
        visitQueryResult,
        allTasksQueryResult,
        pendingPaymentsResult,
        pendingPartsPaymentResult,
        pendingDeliveriesResult,
        topFollowResult,
        newlyAssignedCustomersResult,

    ] = await Promise.all([
        pool.query(machinesSoldQuery, [currentMonthStart, currentMonthEnd, uid]),
        pool.query(machinesSoldQuery, [lastMonthStart, lastMonthEnd, uid]),
        pool.query(`
        SELECT 
          s.id, s.customer_id, s.contract_date, s.serial_no, s.price, 
          c.name AS customer_name, c.owner AS customer_owner 
        FROM sale s 
        LEFT JOIN customer c ON s.customer_id = c.id 
        WHERE s.contract_date BETWEEN $1 AND $2 
        AND s.sell_by = $3`, [currentMonthStart, currentMonthEnd, uid]),
        saleCustomerIds.length > 0
            ? pool.query(`
            SELECT COUNT(DISTINCT customer_id) AS feedbacks_taken 
            FROM feedback 
            WHERE created_at BETWEEN $1 AND $2 
            AND user_id = $3 
            AND customer_id = ANY($4)`, [currentMonthStart, currentMonthEnd, uid, saleCustomerIds])
            : { rows: [{ feedbacks_taken: 0 }] },
        pool.query(`
        SELECT COUNT(*) AS total_visits 
        FROM visit 
        WHERE created_at BETWEEN $1 AND $2 
        AND user_id = $3`, [currentMonthStart, currentMonthEnd, uid]),
        pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [uid]),
        pool.query(pendingPaymentsQuery, [uid]),

        pool.query(pendingPartsPaymentQuery, [uid]),

        pool.query(pendingDeliveriesQuery, [uid]),

        pool.query(topFollowQuery, [currentMonthStart, currentMonthEnd, uid]),

        pool.query(newlyAssignedCustomersQuery, [
            uid,
            currentMonthStart,
            currentMonthEnd,
        ]),


    ]);

    const machinesSoldThisMonth = parseInt(currentMonthSalesResult.rows[0].total, 10) || 0;
    const machinesSoldLastMonth = parseInt(lastMonthSalesResult.rows[0].total, 10) || 0;
    const feedbacksTakenThisMonth = parseInt(feedbackQueryResult.rows[0].feedbacks_taken, 10) || 0;
    const totalVisits = parseInt(visitQueryResult.rows[0].total_visits, 10) || 0;
    const percentageChange =
        machinesSoldLastMonth === 0
            ? machinesSoldThisMonth > 0 ? 100 : 0
            : ((machinesSoldThisMonth - machinesSoldLastMonth) / machinesSoldLastMonth) * 100;
    const remainingFeedbacks = totalCustomersWithSale - feedbacksTakenThisMonth;

    const enrichedCustomers = customersWithSale.map((customer) => {
        const filledCount = profileFields.reduce((count, field) => {
            const value = customer[field];
            const filled =
                field === "rating"
                    ? typeof value === "number" && value > 0
                    : Array.isArray(value)
                        ? value.length > 0
                        : typeof value === "string"
                            ? value.trim() !== "" && value !== "null"
                            : value !== null && value !== undefined;
            return filled ? count + 1 : count;
        }, 0);

        const customerSales = sales
            .filter(s => s.customer_id === customer.id)
            .map(sale => {
                let machineFilled = 0;

                const hasContractImages =
                    (Array.isArray(sale.contract_images_pdf) && sale.contract_images_pdf.length > 0) ||
                    (Array.isArray(sale.contract_images_png) && sale.contract_images_png.length > 0);

                if (hasContractImages) machineFilled++;

                let checkingFields = []

                if (sale.type === 'machine') {
                    checkingFields = [...saleFields]
                } else {
                    checkingFields = [...partFields]
                }


                checkingFields.forEach(field => {
                    const value = sale[field];
                    const filled =
                        Array.isArray(value)
                            ? value.length > 0
                            : typeof value === "string"
                                ? value.trim() !== "" && value !== "null"
                                : typeof value === "number"
                                    ? !isNaN(value)
                                    : value !== null && value !== undefined;

                    if (filled) machineFilled++;
                });

                const totalFields = checkingFields.length + 1;
                const completion = Math.round((machineFilled / totalFields) * 100);

                return {
                    id: sale.id,
                    serial_no: sale.serial_no,
                    payments: payments.filter(p => p.machine_id === sale.id),
                    percentage_completion: completion,
                    price: sale.price,
                    speed_money_amount: sale.speed_money_amount
                };
            });

        return {

            profile_completion: Math.round((filledCount / profileFields.length) * 100),
            sales: customerSales,
            id: customer.id,
            name: customer.name,
            owner: customer.owner,
            industry: customer.industry,
            number: customer.number.join(", "),
            location: customer.location,
            created_at: customer.created_at,
            member: customer.member
        };
    });


    const pendingPayments = pendingPaymentsResult.rows.map((item: any) => ({
        ...item,
        total_paid: Number(item.total_paid || 0),
        pending_amount: Number(item.pending_amount || 0),
    }));

    const totalPendingPaymentAmount = pendingPayments.reduce(
        (sum: number, item: any) => sum + Number(item.pending_amount || 0),
        0
    );

    const pendingPartsPayments = pendingPartsPaymentResult.rows
        .map((invoice: any) => {
            const itemsTotal = Array.isArray(invoice.fields)
                ? invoice.fields.reduce((sum: number, item: any) => {
                    const val = Number(item?.total ?? 0);
                    return sum + (isNaN(val) ? 0 : val);
                }, 0)
                : 0;

            const discount = Number(invoice.discount ?? 0);
            const finalAmount = itemsTotal - discount;
            const totalPaid = Number(invoice.total_paid ?? 0);
            const pendingAmount = Math.max(finalAmount - totalPaid, 0);

            let status = "NA";

            if (itemsTotal === 0) status = "Paid";
            else if (totalPaid === 0) status = "Pending";
            else if (pendingAmount > 0) status = "Partial";
            else status = "Paid";

            return {
                ...invoice,
                items_total: itemsTotal,
                discount,
                total_paid: totalPaid,
                final_amount: pendingAmount,
                status,
            };
        })
        .filter(
            (item: any) =>
                moment(item.created_at).isSameOrAfter("2025-12-01") ||
                item.payment === false
        )
        .filter((item: any) => item.status !== "Paid");

    const totalPendingPartsPaymentAmount = pendingPartsPayments.reduce(
        (sum: number, item: any) => sum + Number(item.final_amount || 0),
        0
    );

    const customersWithSaleOrMember = enrichedCustomers.filter(
        (customer: any) => customer.member === true || customer.sales.length > 0
    );



    return {

        totalCustomersWithSale,
        machinesSoldThisMonth,
        machinesSoldLastMonth,
        machinesSoldThisMonthDetail: saleDetailsQueryResult.rows,
        feedbacksTakenThisMonth,
        remainingFeedbacks,
        totalVisits,
        allTasks: allTasksQueryResult.rows.length,
        percentageChange: percentageChange.toFixed(2),
        customers: enrichedCustomers,
        new_entries: {
            pending_payments: {
                total: pendingPayments.length,
                total_amount: totalPendingPaymentAmount,
                data: pendingPayments,
            },

            pending_parts_payments: {
                total: pendingPartsPayments.length,
                total_amount: totalPendingPartsPaymentAmount,
                data: pendingPartsPayments,
            },

            pending_deliveries: {
                total: pendingDeliveriesResult.rows.length,
                data: pendingDeliveriesResult.rows,
            },

            top_follow: {
                total: topFollowResult.rows.length,
                data: topFollowResult.rows,
            },

            newly_assigned_customers: {
                total: newlyAssignedCustomersResult.rows.length,
                data: newlyAssignedCustomersResult.rows,
            },



            customers_with_sale_or_member: {
                total: customersWithSaleOrMember.length,
                data: customersWithSaleOrMember,
            },
        },
    }
}

async function getCRMAfterSalesData(currentMonthStart: string, currentMonthEnd: string, uid: string) {


    const customersResult = await pool.query(`
    SELECT
        id,
        name,
        location,
        number,
        owner,
        member,
        created_at
    FROM customer
    WHERE member IS TRUE
      AND office = 'karachi'
`);

    const customers = customersResult.rows;

    const feedbackResult = await pool.query(
        `
    SELECT DISTINCT ON (f.customer_id)
        f.customer_id,
        f.created_at,
         u.name AS user_name
    FROM feedback f
    INNER JOIN users u ON u.id = f.user_id
    WHERE u.designation = 'Customer Relationship Manager (After Sales)'
      AND LOWER(u.office) = LOWER($1)
      AND f.created_at BETWEEN $2 AND $3
    ORDER BY f.customer_id, f.created_at DESC
    `,
        ['karachi', currentMonthStart, currentMonthEnd]
    );

    const feedbackMap = new Map(
        feedbackResult.rows.map(row => [
            row.customer_id,
            {
                feedback_date: row.created_at,
                user_name: row.user_name,
            },
        ])
    );

    const customersWithFeedback = [];
    const customersWithoutFeedback = [];

    for (const customer of customers) {
        const feedbackInfo = feedbackMap.get(customer.id);

        if (feedbackInfo) {
            customersWithFeedback.push({
                ...customer,
                feedback_date: feedbackInfo.feedback_date,
                user_name: feedbackInfo.user_name,
            });
        } else {
            customersWithoutFeedback.push(customer);
        }
    }

    const allTasksQueryResult = await pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [uid])

    return { withFeedback: customersWithFeedback, withoutFeedback: customersWithoutFeedback, allTasks: allTasksQueryResult.rows.length }

}

async function getEngineerData(uid: string) {
    const allTasksQueryResult = await pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [uid])
    const allComplaintsQueryResult = await pool.query(`
       SELECT COUNT(*) AS total
      FROM complaint_assignments ca
      JOIN complaints c ON ca.complaint_id = c.id
      WHERE ca.engineer_id = $1 AND c.status != 'completed'
        `, [uid])
    return NextResponse.json({ allTasks: allTasksQueryResult.rows.length, allComplaints: allComplaintsQueryResult.rows[0].total }, { status: 200 })
}

async function getStoreData(uid: string) {
    const TIMEZONE = "Asia/Karachi";

    const now = moment.tz(TIMEZONE);

    const todayStart = now.clone().startOf("day").toISOString();
    const todayEnd = now.clone().endOf("day").toISOString();

    const currentWeekStart = now.clone().startOf("isoWeek").toISOString();
    const currentWeekEnd = now.clone().endOf("isoWeek").toISOString();

    const currentMonthStart = now.clone().startOf("month").toISOString();
    const currentMonthEnd = now.clone().endOf("month").toISOString();

    const lastMonthStart = now
        .clone()
        .subtract(1, "month")
        .startOf("month")
        .toISOString();

    const lastMonthEnd = now
        .clone()
        .subtract(1, "month")
        .endOf("month")
        .toISOString();

    const userId = Number(uid);

    if (!Number.isInteger(userId)) {
        throw new Error("Invalid user id");
    }

    const pendingInvoicesQuery = `
    SELECT
      si.*,
      COALESCE(
        NULLIF(TRIM(si.manager), ''),
        u.name,
        ''
      ) AS manager,
      COALESCE(
        NULLIF(TRIM(c.location), ''),
        si.address,
        ''
      ) AS customer_location,
      COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
    FROM savedinvoices_karachi si
    LEFT JOIN customer_parts_karachi cp
      ON cp.part_id = si.id
    LEFT JOIN customer c
      ON c.id = si.customer_id
    LEFT JOIN users u
      ON u.id = c.ownership
    WHERE si.owner_paid IS FALSE
    GROUP BY si.id, u.name, c.location
    ORDER BY si.created_at DESC
  `;

    const availableOrderItemsQuery = `
    SELECT
      oi.machine_model,
      oi.machine_power,
      COUNT(*)::int AS quantity,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', oi.id,
          'machine_serial', oi.machine_serial,
          'machine_model', oi.machine_model,
          'machine_power', oi.machine_power
        )
        ORDER BY oi.id DESC
      ) AS data
    FROM order_items oi
    WHERE oi.booked IS FALSE
    AND LOWER(oi.location) = 'karachi'
    GROUP BY oi.machine_model, oi.machine_power
    ORDER BY oi.machine_model ASC, oi.machine_power ASC
  `;


    const todayTasksQuery = `
    SELECT
      t.*,
      u.id AS user_id, 
    u.name AS assigned_to_name,
    u.email AS assigned_to_email,
    c.name AS customer_name,
    c.owner AS customer_owner,
    c.number AS customer_number,
    c.address AS customer_address,
    c.pin AS customer_pin
    FROM task t
    INNER JOIN users u ON t.assigned_to = u.id
    LEFT JOIN customer c
      ON c.id = t.customer_id
    WHERE t.assigned_to = $1
    AND t.created_at BETWEEN $2 AND $3
    ORDER BY t.created_at DESC
  `;

    const salesInvoicesQuery = `
    SELECT
      id,
      fields,
      discount,
      created_at,
      payment,
      owner_paid,
      customer_id,
      name,
      company,
      phone,
      address
    FROM savedinvoices_karachi
    WHERE created_at BETWEEN $1 AND $2
    ORDER BY created_at DESC
  `;

    const branchExpensesQuery = `
    SELECT
      be.*
    FROM branchexpenses be
    WHERE be.submitted_by = $1
    AND be.date BETWEEN $2 AND $3
    ORDER BY be.date DESC
  `;

    const lowStockQuery = `
  SELECT *
  FROM inventory_karachi
  WHERE threshold IS NOT NULL
    AND qty IS NOT NULL
    AND qty <= threshold
  ORDER BY name ASC
`;

    const [
        pendingInvoicesResult,
        availableOrderItemsResult,
        todayTasksResult,
        salesInvoicesResult,
        branchExpensesResult,
        lowStockResult
    ] = await Promise.all([
        pool.query(pendingInvoicesQuery),
        pool.query(availableOrderItemsQuery),
        pool.query(todayTasksQuery, [userId, todayStart, todayEnd]),
        pool.query(salesInvoicesQuery, [lastMonthStart, currentMonthEnd]),
        pool.query(branchExpensesQuery, [
            userId,
            currentMonthStart,
            currentMonthEnd,
        ]),
        pool.query(lowStockQuery)
    ]);





    const teamTasks = todayTasksResult.rows
    const updatedTasks = teamTasks.map(task => {

        if (task.customer_id) {
            const [firstPart] = task.task_name.split("-");
            const customerInfo = task.customer_name || task.customer_owner || "";
            const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
            return {
                ...task,
                task_name: updatedTitle,

            };
        }
        return task;
    }).map((item) => {
        return { ...item, created_at_time: item.created_at }
    })


    const getInvoiceItemsTotal = (fields: any) => {
        if (!Array.isArray(fields)) return 0;

        return fields.reduce((sum: number, item: any) => {
            const value = Number(item?.total ?? 0);
            return sum + (Number.isNaN(value) ? 0 : value);
        }, 0);
    };

    const getInvoiceFinalAmount = (invoice: any) => {
        const itemsTotal = getInvoiceItemsTotal(invoice.fields);
        const discount = Number(invoice.discount ?? 0);

        return Math.max(itemsTotal - discount, 0);
    };



    const statusInvoices = pendingInvoicesResult.rows
        .map((invoice) => {
            const itemsTotal = getInvoiceItemsTotal(invoice.fields);
            const discount = Number(invoice.discount ?? 0);
            const finalAmount = Math.max(itemsTotal - discount, 0);
            const totalPaid = Number(invoice.total_paid ?? 0);
            const pendingAmount = Math.max(finalAmount - totalPaid, 0);

            let status = "NA";

            if (itemsTotal === 0) status = "Paid";
            else if (totalPaid === 0) status = "Pending";
            else if (pendingAmount > 0) status = "Partial";
            else status = "Paid";

            return {
                ...invoice,
                items_total: itemsTotal,
                 total : finalAmount,
                discount,
                total_paid: totalPaid,
                final_amount: pendingAmount,
                status,
            };
        })


    const pendingInvoices = statusInvoices.filter(
        (item) =>
            moment(item.created_at).isSameOrAfter("2025-12-01") ||
            item.payment === false
    )
        .filter((item) => item.status !== "Paid");

    const completedInvoices = statusInvoices.filter((item) => item.status === 'Paid')
    const partialInvoices = statusInvoices.filter((item) => item.status === 'Partial')
    const cancelledInvoices = statusInvoices.filter((item) => item.items_total === 0)



    const availableStock = availableOrderItemsResult.rows.map((group) => ({
        machine_model: group.machine_model,
        machine_power: group.machine_power,
        quantity: Number(group.quantity || 0),
        data: group.data || [],
    }));

    const totalAvailableStock = availableStock.reduce(
        (sum, group) => sum + Number(group.quantity || 0),
        0
    );

    const salesInvoices = salesInvoicesResult.rows.map((invoice) => ({
        ...invoice,
        items_total: getInvoiceItemsTotal(invoice.fields),
        final_amount: getInvoiceFinalAmount(invoice),
    }));

    const isBetween = (date: string, start: string, end: string) => {
        return moment(date).isBetween(start, end, undefined, "[]");
    };

    const getSalesTotal = (start: string, end: string) => {
        return salesInvoices
            .filter((invoice) => isBetween(invoice.created_at, start, end))
            .reduce((sum, invoice) => sum + Number(invoice.final_amount || 0), 0);
    };

    const todaySaleTotal = getSalesTotal(todayStart, todayEnd);
    const weekSaleTotal = getSalesTotal(currentWeekStart, currentWeekEnd);
    const monthSaleTotal = getSalesTotal(currentMonthStart, currentMonthEnd);
    const lastMonthSaleTotal = getSalesTotal(lastMonthStart, lastMonthEnd);

    const branchExpenses = branchExpensesResult.rows.map((expense) => ({
        ...expense,
        amount: Number(expense.amount || 0),
    }));

    const branchExpenseTotalToday = branchExpenses
        .filter((expense) => isBetween(expense.date, todayStart, todayEnd))
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const branchExpenseTotalThisMonth = branchExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    const responseData = {
        pos_stats: {
            pending: {
                data: pendingInvoices,
                length: pendingInvoices.length,
                total: pendingInvoices.reduce(
                    (sum, item) => sum + Number(item.final_amount || 0),
                    0
                )
            },

            completed: {
                data: completedInvoices,
                length: completedInvoices.length,
                total: completedInvoices.reduce(
                    (sum, item) => sum + Number(item.total_paid || 0),
                    0
                )
            },

             partial: {
                data: partialInvoices,
                length: partialInvoices.length,
                total: partialInvoices.reduce(
                    (sum, item) => sum + Number(item.final_amount || 0),
                    0
                )
            },

             cancelled: {
                data: cancelledInvoices,
                length: cancelledInvoices.length,
                total: cancelledInvoices.reduce(
                    (sum, item) => sum + Number(item.final_amount || 0),
                    0
                )
            },
        },

        available_stock: {
            total_quantity: totalAvailableStock,
            groups: availableStock,
        },

        today_tasks: {
            total: updatedTasks.length,
            data: updatedTasks,
        },

        sales_stats: {
            today: todaySaleTotal,
            this_week: weekSaleTotal,
            this_month: monthSaleTotal,
            last_month: lastMonthSaleTotal,
            data: salesInvoices,
        },

        branch_expenses: {
            today_total: branchExpenseTotalToday,
            this_month_total: branchExpenseTotalThisMonth,
            data: branchExpenses,
        },
        low_stock: {
            total: lowStockResult.rows.length,
            data: lowStockResult.rows
        }

    };

    return responseData;
}


export const revalidate = 0;
