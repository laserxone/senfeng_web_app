import pool from "@/config/db";
import { sendNotification } from "@/lib/sendNotification";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const applicantId = searchParams.get("applicant_id");
    const approverId = searchParams.get("approver_id");

    let result;

    if (applicantId) {
      result = await pool.query(
        `
        SELECT 
          la.*,
          u.name as applicant_name,
          u.designation as applicant_designation,
          ah.name as hierarchy_name,
          json_agg(
            json_build_object(
              'id', lapp.id,
              'approver_id', lapp.approver_id,
              'approval_order', lapp.approval_order,
              'status', lapp.status,
              'comments', lapp.comments,
              'acted_at', lapp.acted_at,
              'approver_name', approver.name,
              'approver_designation', approver.designation
            ) ORDER BY lapp.approval_order
          ) FILTER (WHERE lapp.id IS NOT NULL) as approval_steps
        FROM loan_applications la
        JOIN users u ON la.applicant_id = u.id
        LEFT JOIN approval_hierarchies ah ON la.hierarchy_id = ah.id
        LEFT JOIN loan_approvals lapp ON la.id = lapp.loan_application_id
        LEFT JOIN users approver ON lapp.approver_id = approver.id
        WHERE la.applicant_id = $1
        GROUP BY la.id, u.name, u.designation, ah.name
        ORDER BY la.created_at DESC
        `,
        [parseInt(applicantId)],
      );
    } else if (approverId) {
      const approverIdInt = parseInt(approverId);

      // const userResult = await pool.query(
      //   `SELECT designation, full_access FROM users WHERE id = $1`,
      //   [approverIdInt]
      // );

      // const user = userResult.rows[0];

      // const isAdmin = user?.designation === "Owner" || user?.full_access === true;

      // if (isAdmin) {
      //   result = await pool.query(
      //     `
      //     SELECT
      //       la.*,
      //       u.name as applicant_name,
      //       u.designation as applicant_designation,
      //       ah.name as hierarchy_name,
      //       json_agg(
      //         json_build_object(
      //           'id', lapp.id,
      //           'approver_id', lapp.approver_id,
      //           'approval_order', lapp.approval_order,
      //           'status', lapp.status,
      //           'comments', lapp.comments,
      //           'acted_at', lapp.acted_at,
      //           'approver_name', approver.name,
      //           'approver_designation', approver.designation
      //         ) ORDER BY lapp.approval_order
      //       ) FILTER (WHERE lapp.id IS NOT NULL) as approval_steps,
      //       true as is_my_turn,
      //       null as my_approval_status
      //     FROM loan_applications la
      //     JOIN users u ON la.applicant_id = u.id
      //     LEFT JOIN approval_hierarchies ah ON la.hierarchy_id = ah.id
      //     LEFT JOIN loan_approvals lapp ON la.id = lapp.loan_application_id
      //     LEFT JOIN users approver ON lapp.approver_id = approver.id
      //     WHERE la.status IN ('pending', 'in_progress')
      //     GROUP BY la.id, u.name, u.designation, ah.name
      //     ORDER BY la.created_at DESC
      //     `
      //   );
      // } else {
      result = await pool.query(
        `
          SELECT 
            la.*,
            u.name as applicant_name,
            u.designation as applicant_designation,
            ah.name as hierarchy_name,
            json_agg(
              json_build_object(
                'id', lapp.id,
                'approver_id', lapp.approver_id,
                'approval_order', lapp.approval_order,
                'status', lapp.status,
                'comments', lapp.comments,
                'acted_at', lapp.acted_at,
                'approver_name', approver.name,
                'approver_designation', approver.designation
              ) ORDER BY lapp.approval_order
            ) FILTER (WHERE lapp.id IS NOT NULL) as approval_steps,
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM loan_approvals la2 
                WHERE la2.loan_application_id = la.id 
                  AND la2.approver_id = $1
                  AND la2.approval_order = la.current_approver_order
                  AND la2.status = 'pending'
                  AND la.status = 'in_progress'
              ) THEN true
              ELSE false
            END as is_my_turn,
            (
              SELECT la3.status FROM loan_approvals la3 
              WHERE la3.loan_application_id = la.id 
                AND la3.approver_id = $1
                AND la3.status != 'pending'
              LIMIT 1
            ) as my_approval_status
          FROM loan_applications la
          JOIN users u ON la.applicant_id = u.id
          LEFT JOIN approval_hierarchies ah ON la.hierarchy_id = ah.id
          LEFT JOIN loan_approvals lapp ON la.id = lapp.loan_application_id
          LEFT JOIN users approver ON lapp.approver_id = approver.id
          WHERE EXISTS (
            SELECT 1 FROM loan_approvals la_check 
            WHERE la_check.loan_application_id = la.id 
              AND la_check.approver_id = $1
          )
          GROUP BY la.id, u.name, u.designation, ah.name
          ORDER BY 
            CASE WHEN la.status = 'in_progress' THEN 0 ELSE 1 END,
            la.created_at DESC
          `,
        [approverIdInt],
      );
      // }
    } else {
      result = await pool.query(`
        SELECT 
          la.*,
          u.name as applicant_name,
          u.designation as applicant_designation,
          ah.name as hierarchy_name,
          json_agg(
            json_build_object(
              'id', lapp.id,
              'approver_id', lapp.approver_id,
              'approval_order', lapp.approval_order,
              'status', lapp.status,
              'comments', lapp.comments,
              'acted_at', lapp.acted_at,
              'approver_name', approver.name,
              'approver_designation', approver.designation
            ) ORDER BY lapp.approval_order
          ) FILTER (WHERE lapp.id IS NOT NULL) as approval_steps
        FROM loan_applications la
        JOIN users u ON la.applicant_id = u.id
        LEFT JOIN approval_hierarchies ah ON la.hierarchy_id = ah.id
        LEFT JOIN loan_approvals lapp ON la.id = lapp.loan_application_id
        LEFT JOIN users approver ON lapp.approver_id = approver.id
        GROUP BY la.id, u.name, u.designation, ah.name
        ORDER BY la.created_at DESC
      `);
    }

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.log("Error fetching loan applications:", error);

    return NextResponse.json(
      { message: error?.message || "Failed to fetch loan applications" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const body = await request.json();

    const {
      applicant_id,
      hierarchy_id,
      loan_amount,
      loan_type,
      purpose,
      urgency_level,
      receiving_date,
      return_date,
      first_installment_date,
      num_installments,
      payment_method,
      bank_account,
      guarantor_name,
      guarantor_designation,
      guarantor_phone,
      cheque_images,
      supporting_documents,
      salary_deduction_consent,
      terms_accepted,
    } = body;
    if (!hierarchy_id) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "Approval hierarchy is required" },
        { status: 400 },
      );
    }
    const approversResult = await client.query(
      `SELECT user_id, approval_order FROM hierarchy_approvers WHERE hierarchy_id = $1 ORDER BY approval_order`,
      [hierarchy_id],
    );
    if (!approversResult.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "The selected hierarchy must have at least one approver" },
        { status: 400 },
      );
    }

    const timestamp = Date.now().toString(36).toUpperCase();

    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    const application_number = `LOAN-${timestamp}-${random}`;

    const applicationResult = await client.query(
      `
      INSERT INTO loan_applications (
        application_number,
        applicant_id,
        hierarchy_id,
        loan_amount,
        loan_type,
        purpose,
        urgency_level,
        receiving_date,
        return_date,
        first_installment_date,
        num_installments,
        payment_method,
        bank_account,
        guarantor_name,
        guarantor_designation,
        guarantor_phone,
        cheque_images,
        supporting_documents,
        salary_deduction_consent,
        terms_accepted,
        status,
        current_approver_order
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,'pending',1
      )
      RETURNING *
      `,
      [
        application_number,
        applicant_id,
        hierarchy_id || null,
        loan_amount,
        loan_type,
        purpose,
        urgency_level || "normal",
        receiving_date || null,
        return_date || null,
        first_installment_date || null,
        num_installments,
        payment_method || null,
        bank_account || null,
        guarantor_name || null,
        guarantor_designation || null,
        guarantor_phone || null,
        JSON.stringify(cheque_images || []),
        JSON.stringify(supporting_documents || []),
        salary_deduction_consent || false,
        terms_accepted || false,
      ],
    );

    const application = applicationResult.rows[0];

    if (hierarchy_id) {
      for (const approver of approversResult.rows) {
        await client.query(
          `
          INSERT INTO loan_approvals (
            loan_application_id,
            approver_id,
            approval_order,
            status
          )
          VALUES ($1, $2, $3, 'pending')
          `,
          [application.id, approver.user_id, approver.approval_order],
        );
      }

      await client.query(
        `
        UPDATE loan_applications
        SET status = 'in_progress'
        WHERE id = $1
        `,
        [application.id],
      );

      if (approversResult.rows.length > 0) {
        const nameQuery = await pool.query(
          `SELECT name from users WHERE id = $1`,
          [applicant_id],
        );
        const name = nameQuery.rows?.[0]?.name || "";
        const sendTo = approversResult.rows?.[0].user_id ?? null;
        sendNotification(
          `${name} submitted loan application requesting your approval`,
          `applications/loan?l=${application.id}`,
          sendTo,
          NOTIFICATION_TYPES.loan_application_submitted.title,
          NOTIFICATION_TYPES.loan_application_submitted.category,
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(application, {
      status: 201,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating loan application:", error);

    return NextResponse.json(
      { error: "Failed to create loan application" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
