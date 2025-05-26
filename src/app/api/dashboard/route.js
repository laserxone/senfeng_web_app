import pool from "@/config/db";
import { NextResponse } from "next/server";
import momentT from 'moment-timezone';
import moment from "moment/moment";

export async function GET(req) {

    try {
        // Get the current and last month's date range
        const TIMEZONE = 'Asia/Karachi';
        const currentDate = momentT.tz(TIMEZONE);

        // Current Month
        const firstCurrentMonth = currentDate.clone().startOf('month').startOf('day');
        const lastCurrentMonth = currentDate.clone().endOf('month').endOf('day');

        // Last Month
        const firstLastMonth = currentDate.clone().subtract(1, 'month').startOf('month').startOf('day');
        const lastLastMonth = currentDate.clone().subtract(1, 'month').endOf('month').endOf('day');

        // Three Months Ago (start)
        const firstThreeMonthsAgo = currentDate.clone().subtract(2, 'month').startOf('month').startOf('day');

        // Convert to UTC ISO strings
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
        s.contract_date BETWEEN $1 AND $2
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
            FROM 
                payment p
            WHERE 
                p.transaction_date BETWEEN $1 AND $2
        `;

        const machinesSoldQuery = `
            SELECT 
                COUNT(*) AS total_machines_sold
            FROM 
                sale s
            WHERE 
                s.contract_date BETWEEN $1 AND $2
        `;

        // Query to get new customers added this month
        const newCustomersQuery = `
            SELECT 
                COUNT(*) AS total_new_customers
            FROM 
                customer c
            WHERE 
                c.created_at BETWEEN $1 AND $2
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
GROUP BY 
  CASE 
    WHEN industry IS NULL OR industry = '' THEN 'No industry'
    ELSE industry
  END;
        `

        const feedbackQuery = `
        WITH months AS (
            SELECT TO_CHAR(date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' * generate_series(0, 11), 'YYYY-MM') AS month
        )
        SELECT 
            months.month,
            COALESCE(COUNT(CASE WHEN f.status = 'Satisfactory' THEN 1 END), 0) AS satisfactory,
            COALESCE(COUNT(CASE WHEN f.status = 'Unsatisfactory' THEN 1 END), 0) AS unsatisfactory
        FROM months
        LEFT JOIN feedback f ON TO_CHAR(f.created_at, 'YYYY-MM') = months.month
        GROUP BY months.month
        ORDER BY months.month;`;

        // Execute all queries in parallel

        const teamProgressQuery = `
WITH sales_users AS (
  SELECT id, name, email, monthly_target
  FROM users
  WHERE designation = 'Sales'
),
feedback_count AS (
  SELECT user_id, COUNT(*) AS total_feedbacks
  FROM feedback
  WHERE created_at BETWEEN $1 AND $2
  GROUP BY user_id
),
visit_count AS (
  SELECT user_id, COUNT(*) AS total_visits
  FROM visit
  WHERE created_at BETWEEN $1 AND $2
  GROUP BY user_id
),
customer_count AS (
  SELECT ownership AS user_id, COUNT(*) AS total_members
  FROM customer
  GROUP BY ownership
),
sale_sum AS (
  SELECT sell_by AS user_id, SUM(price) AS total_sale_price
  FROM sale
  WHERE contract_date BETWEEN $1 AND $2
  GROUP BY sell_by
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


        // Calculate percentage changes
        const paymentChangePercentage = totalPaymentLastMonth === 0
            ? 0
            : ((totalPaymentThisMonth - totalPaymentLastMonth) / totalPaymentLastMonth) * 100;

        const machinesSoldChangePercentage = totalMachinesSoldLastMonth === 0
            ? 0
            : ((totalMachinesSoldThisMonth - totalMachinesSoldLastMonth) / totalMachinesSoldLastMonth) * 100;

        const newCustomerChangePercentage = totalNewCustomersLastMonth === 0
            ? 0
            : ((totalNewCustomersThisMonth - totalNewCustomersLastMonth) / totalNewCustomersLastMonth) * 100;

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

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
    }
}

export const revalidate = 0;
