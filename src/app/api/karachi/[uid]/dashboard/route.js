import pool from "@/config/db";
import { NextResponse } from "next/server";
import momentT from 'moment-timezone';
import moment from "moment/moment";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { partFields, profileFields, saleFields } from "@/constants/data";

export async function GET(req, { params }) {

    const { uid } = await params
    const searchParams = req.nextUrl.searchParams
    const office = searchParams.get('office')



    try {
        const isAdmin = await checkSuperadmin(uid)
        if (isAdmin) {

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
    AND users.office = '${office}'
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

            const teamTasks = taskResult.rows
            const updatedTasks = teamTasks.map(user => {
                const updatedUserTasks = user.tasks.map(task => {
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
                feedback_status_last_6_months: formattedFeedbackData,
                team_progress: tempProgressResult.rows,
                team_task: updatedTasks
            };

            return NextResponse.json(responseData, { status: 200 });

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
            console.log(user.designation)

            if (user?.designation === 'Dealer') {

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

                return NextResponse.json(responseData, { status: 200 });

            } else if (user?.designation === 'Sales') {
                const [customersQuery] = await Promise.all([
                    pool.query("SELECT * FROM customer WHERE ownership = $1", [uid]),

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

                const [
                    currentMonthSalesResult,
                    lastMonthSalesResult,
                    saleDetailsQueryResult,
                    feedbackQueryResult,
                    visitQueryResult,
                    allTasksQueryResult
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
                    pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [uid])
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
                            
                                                        if (machine.type === 'machine') {
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



                return NextResponse.json({
                    user,
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
                });
            } else if (user?.designation === 'Customer Relationship Manager (After Sales)') {

                const customersResult = await pool.query(
                    `SELECT id, name, location, number, owner, member, created_at
            FROM customer
            WHERE member IS TRUE`
                );

                const customers = customersResult.rows;

                const customersWithFeedback = [];
                const customersWithoutFeedback = [];

                for (const customer of customers) {
                    const feedbackResult = await pool.query(
                        `
              SELECT id, customer_id, user_id, created_at FROM feedback
              WHERE customer_id = $1
              AND user_id = $2
              AND created_at BETWEEN $3 AND $4
              ORDER BY created_at DESC
              LIMIT 1
              `,
                        [customer.id, uid, currentMonthStart, currentMonthEnd]
                    );

                    if (feedbackResult.rows.length > 0) {
                        customersWithFeedback.push({ ...customer, feedback_date: feedbackResult.rows[0].created_at });
                    } else {
                        customersWithoutFeedback.push(customer);
                    }
                }

                const allTasksQueryResult = await pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [uid])

                return NextResponse.json({ user, withFeedback: customersWithFeedback, withoutFeedback: customersWithoutFeedback, allTasks: allTasksQueryResult.rows.length }, { status: 200 })

            } else if (user?.designation === 'Engineer') {
                const allTasksQueryResult = await pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [uid])
                const allComplaintsQueryResult = await pool.query(`
       SELECT COUNT(*) AS total
      FROM complaint_assignments ca
      JOIN complaints c ON ca.complaint_id = c.id
      WHERE ca.engineer_id = $1 AND c.status != 'completed'
        `, [uid])
                return NextResponse.json({ user, allTasks: allTasksQueryResult.rows.length, allComplaints: allComplaintsQueryResult.rows[0].total }, { status: 200 })
            } else {
                return NextResponse.json({ user }, { status: 200 })
            }

        }


    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
    }
}

export const revalidate = 0;
