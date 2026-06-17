import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";
import oldMoment from 'moment'


export async function GET(req:NextRequest, { params }:{params:Promise<{uid:string}>}) {

    const { uid } = await params;

    const id = uid

    try {

        const [userResult] = await Promise.all([
            pool.query("SELECT id, dp, name, designation, limited_access FROM users WHERE id = $1", [id])
        ]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const user = userResult.rows[0];


        if (user?.designation === 'Social Media Manager') {
            const queryParams = []
            let query
            if (user.limited_access) {
                query = `SELECT id, name, owner, industry, number, location, created_at FROM customer WHERE lead = $1`
                queryParams.push(id)
            } else {
                query = `SELECT id, name, owner, industry, number, location, created_at FROM customer`
            }

            const result = await pool.query(query, queryParams)

            const customers = result.rows

            const feedbackQuery = await pool.query(`
            SELECT id, customer_id, feedback, next_followup, top_follow, created_at
            FROM feedback
            WHERE user_id = $1
            `, [id]);

            const feedbacks = feedbackQuery.rows;

            const feedbackMap = new Map();
            feedbacks.forEach((fb) => {
                if (!feedbackMap.has(fb.customer_id)) {
                    feedbackMap.set(fb.customer_id, []);
                }
                feedbackMap.get(fb.customer_id).push(fb);
            });


            const startOfThisMonth = oldMoment().startOf("month");
            const endOfThisMonth = oldMoment().endOf("month");

            const startOfNextMonth = oldMoment().add(1, "month").startOf("month");
            const endOfNextMonth = oldMoment().add(1, "month").endOf("month");

            const withoutFeedback:any[] = [];
            const thisMonth:any[] = [];
            const nextMonth:any[] = [];
            const topFollow:any[] = [];


            customers.forEach((customer) => {
                const fbList = feedbackMap.get(customer.id);

                if (!fbList || fbList.length === 0) {
                    withoutFeedback.push({ ...customer, number: customer.number.join(", ") });
                    return;
                }

                // Sort by created_at descending to get latest
                const sorted = fbList.sort((a:any, b:any) =>
                    oldMoment(b.created_at).diff(oldMoment(a.created_at))
                );
                const latest = sorted[0];
                const nextFollow = latest.next_followup ? oldMoment(latest.next_followup) : null;

                // Category: This Month
                if (!nextFollow || nextFollow.isSameOrBefore(endOfThisMonth)) {
                    thisMonth.push({ ...customer, number: customer.number.join(", ") });
                }
                // Category: Next Month
                else if (nextFollow.isBetween(startOfNextMonth, endOfNextMonth, null, "[]")) {
                    nextMonth.push({ ...customer, number: customer.number.join(", ") });
                }

                // Top Follow based on latest only
                if (latest.top_followup === true) {
                    topFollow.push({ ...customer, number: customer.number.join(", ") });
                }
            });

            return NextResponse.json({
                user,
                allCustomers: customers,
                withoutFeedback,
                thisMonth,
                nextMonth,
                topFollow,
            }, { status: 200 })




        }

        if (user?.designation === 'Customer Relationship Manager') {
            const queryParams = []
            let query
            if (user.limited_access) {
                query = `SELECT id, name, owner, industry, number, location, created_at FROM customer WHERE lead = $1`
                queryParams.push(id)
            } else {
                query = `SELECT id, name, owner, industry, number, location, created_at FROM customer`
            }

            const result = await pool.query(query, queryParams)

            const customers = result.rows

            const customerIds = customers.map((customer) => customer.id);

            const feedbackQuery = await pool.query(`
            SELECT id, customer_id, feedback, next_followup, top_follow, created_at
            FROM feedback
            WHERE customer_id = ANY($1)
            `, [customerIds]);

            const feedbacks = feedbackQuery.rows;

            const feedbackMap = new Map();
            feedbacks.forEach((fb) => {
                if (!feedbackMap.has(fb.customer_id)) {
                    feedbackMap.set(fb.customer_id, []);
                }
                feedbackMap.get(fb.customer_id).push(fb);
            });


            const startOfThisMonth = oldMoment().startOf("month");
            const endOfThisMonth = oldMoment().endOf("month");

            const startOfNextMonth = oldMoment().add(1, "month").startOf("month");
            const endOfNextMonth = oldMoment().add(1, "month").endOf("month");

            const withoutFeedback:any[] = [];
            const thisMonth:any[] = [];
            const nextMonth:any[] = [];
            const topFollow:any[] = [];


            customers.forEach((customer) => {
                const fbList = feedbackMap.get(customer.id);

                if (!fbList || fbList.length === 0) {
                    withoutFeedback.push({ ...customer, number: customer.number.join(", ") });
                    return;
                }

                // Sort by created_at descending to get latest
                const sorted = fbList.sort((a:any, b:any) =>
                    oldMoment(b.created_at).diff(oldMoment(a.created_at))
                );
                const latest = sorted[0];
                const nextFollow = latest.next_followup ? oldMoment(latest.next_followup) : null;

                // Category: This Month
                if (!nextFollow || nextFollow.isSameOrBefore(endOfThisMonth)) {
                    thisMonth.push({ ...customer, number: customer.number.join(", ") });
                }
                // Category: Next Month
                else if (nextFollow.isBetween(startOfNextMonth, endOfNextMonth, null, "[]")) {
                    nextMonth.push({ ...customer, number: customer.number.join(", ") });
                }

                // Top Follow based on latest only
                if (latest.top_follow === true) {
                    topFollow.push({ ...customer, number: customer.number.join(", ") });
                }
            });

            return NextResponse.json({
                user,
                allCustomers: customers,
                withoutFeedback,
                thisMonth,
                nextMonth,
                topFollow,
            }, { status: 200 })




        }

        if (user?.designation === 'Sales') {
            const queryParams = []
            let query
            query = `SELECT id, name, owner, industry, number, location, created_at FROM customer WHERE ownership = $1`
            queryParams.push(id)


            const result = await pool.query(query, queryParams)

            const customers = result.rows

            const feedbackQuery = await pool.query(`
            SELECT id, customer_id, feedback, next_followup, top_follow, created_at
            FROM feedback
            `);

            const feedbacks = feedbackQuery.rows;

            const feedbackMap = new Map();
            feedbacks.forEach((fb) => {
                if (!feedbackMap.has(fb.customer_id)) {
                    feedbackMap.set(fb.customer_id, []);
                }
                feedbackMap.get(fb.customer_id).push(fb);
            });


            const startOfThisMonth = oldMoment().startOf("month");
            const endOfThisMonth = oldMoment().endOf("month");

            const startOfNextMonth = oldMoment().add(1, "month").startOf("month");
            const endOfNextMonth = oldMoment().add(1, "month").endOf("month");

            const withoutFeedback:any[] = [];
            const thisMonth:any[] = [];
            const nextMonth:any[] = [];
            const topFollow:any[] = [];


            customers.forEach((customer) => {
                const fbList = feedbackMap.get(customer.id);

                if (!fbList || fbList.length === 0) {
                    withoutFeedback.push({ ...customer, number: customer.number.join(", ") });
                    return;
                }

                // Sort by created_at descending to get latest
                const sorted = fbList.sort((a:any, b:any) =>
                    oldMoment(b.created_at).diff(oldMoment(a.created_at))
                );
                const latest = sorted[0];
                const nextFollow = latest.next_followup ? oldMoment(latest.next_followup) : null;

                // Category: This Month
                if (!nextFollow || nextFollow.isSameOrBefore(endOfThisMonth)) {
                    thisMonth.push({ ...customer, number: customer.number.join(", ") });
                }
                // Category: Next Month
                else if (nextFollow.isBetween(startOfNextMonth, endOfNextMonth, null, "[]")) {
                    nextMonth.push({ ...customer, number: customer.number.join(", ") });
                }

                // Top Follow based on latest only
                if (latest.top_follow === true) {
                    topFollow.push({ ...customer, number: customer.number.join(", ") });
                }
            });

            return NextResponse.json({
                user,
                allCustomers: customers,
                withoutFeedback,
                thisMonth,
                nextMonth,
                topFollow,
            }, { status: 200 })




        }
        return NextResponse.json({}, { status: 200 })

    } catch (error:any) {
        console.log(error)
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export const revalidate = 0