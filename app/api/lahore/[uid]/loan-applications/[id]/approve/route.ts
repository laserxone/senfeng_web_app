import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approver_id, action, comments, admin_override } = body;

    if (!approver_id || !action) {
      return NextResponse.json(
        { error: "Approver ID and action are required" },
        { status: 400 }
      );
    }

    const applicationId = parseInt(id);

    // Get application
    const applicationRes = await pool.query(
      `SELECT * FROM loan_applications WHERE id = $1`,
      [applicationId]
    );

    const application = applicationRes.rows[0];

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    //Check user role
    const userRes = await pool.query(
      `SELECT designation, full_access FROM users WHERE id = $1`,
      [approver_id]
    );

    const user = userRes.rows[0];
    const isAdmin = user?.designation === "Owner" || user?.full_access === true;

    // ================= ADMIN OVERRIDE =================
    // if (isAdmin && admin_override) {
    //   if (action === "rejected") {
    //     await pool.query(
    //       `
    //       UPDATE loan_approvals
    //       SET status = 'rejected',
    //           comments = COALESCE($1, 'Admin override'),
    //           acted_at = CURRENT_TIMESTAMP
    //       WHERE loan_application_id = $2
    //         AND status = 'pending'
    //       `,
    //       [comments || null, applicationId]
    //     );

    //     await pool.query(
    //       `
    //       UPDATE loan_applications
    //       SET status = 'rejected',
    //           updated_at = CURRENT_TIMESTAMP
    //       WHERE id = $1
    //       `,
    //       [applicationId]
    //     );
    //   } else if (action === "approved") {
    //     await pool.query(
    //       `
    //       UPDATE loan_approvals
    //       SET status = 'approved',
    //           comments = COALESCE($1, 'Admin override'),
    //           acted_at = CURRENT_TIMESTAMP
    //       WHERE loan_application_id = $2
    //         AND status = 'pending'
    //       `,
    //       [comments || null, applicationId]
    //     );

    //     await pool.query(
    //       `
    //       UPDATE loan_applications
    //       SET status = 'approved',
    //           updated_at = CURRENT_TIMESTAMP
    //       WHERE id = $1
    //       `,
    //       [applicationId]
    //     );
    //   }

    //   return NextResponse.json({
    //     success: true,
    //     admin_override: true,
    //   });
    // }

    // ================= CURRENT APPROVAL =================
    const currentApprovalRes = await pool.query(
      `
      SELECT * FROM loan_approvals
      WHERE loan_application_id = $1
        AND approver_id = $2
        AND status = 'pending'
        AND approval_order = $3
      `,
      [applicationId, approver_id, application.current_approver_order]
    );

    const currentApproval = currentApprovalRes.rows[0];

    // ================= ADMIN FALLBACK =================
    if (!currentApproval) {
      if (isAdmin) {
        const pendingRes = await pool.query(
          `
          SELECT * FROM loan_approvals
          WHERE loan_application_id = $1
            AND status = 'pending'
            AND approval_order = $2
          `,
          [applicationId, application.current_approver_order]
        );

        const pendingApproval = pendingRes.rows[0];

        if (pendingApproval) {
          await pool.query(
            `
            UPDATE loan_approvals
            SET status = $1,
                comments = $2,
                acted_at = CURRENT_TIMESTAMP
            WHERE id = $3
            `,
            [
              action,
              comments ? `[Admin] ${comments}` : "[Admin Override]",
              pendingApproval.id,
            ]
          );

          if (action === "rejected") {
            await pool.query(
              `
              UPDATE loan_applications
              SET status = 'rejected',
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
              `,
              [applicationId]
            );
          } else if (action === "approved") {
            const nextRes = await pool.query(
              `
              SELECT * FROM loan_approvals
              WHERE loan_application_id = $1
                AND approval_order = $2
              `,
              [applicationId, application.current_approver_order + 1]
            );

            const nextApprover = nextRes.rows[0];

            if (nextApprover) {
              await pool.query(
                `
                UPDATE loan_applications
                SET current_approver_order = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [application.current_approver_order + 1, applicationId]
              );
            } else {
              const res = await pool.query(
                `
                UPDATE loan_applications
                SET status = 'approved',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 RETURNING applicant_id, loan_amount, purpose 
                `,
                [applicationId]
              );
              const returningRes = res.rows?.[0] ?? null
              if (returningRes) {
                await pool.query(
                  `
      INSERT INTO employee_loans (user_id, loan_amount, remaining_amount, description, loan_applications_id)
      VALUES ($1, $2, $2, $3, $4)
      `,
                  [returningRes.applicant_id, returningRes.loan_amount, returningRes.purpose, applicationId]
                );
              }
            }
          }

          return NextResponse.json({ success: true });
        }
      }

      return NextResponse.json(
        { error: "This application is not pending your approval" },
        { status: 400 }
      );
    }

    // ================= NORMAL APPROVAL =================
    await pool.query(
      `
      UPDATE loan_approvals
      SET status = $1,
          comments = $2,
          acted_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [action, comments || null, currentApproval.id]
    );

    if (action === "rejected") {
      await pool.query(
        `
        UPDATE loan_applications
        SET status = 'rejected',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [applicationId]
      );
    } else if (action === "approved") {
      const nextRes = await pool.query(
        `
        SELECT * FROM loan_approvals
        WHERE loan_application_id = $1
          AND approval_order = $2
        `,
        [applicationId, application.current_approver_order + 1]
      );

      const nextApprover = nextRes.rows[0];

      if (nextApprover) {
        await pool.query(
          `
          UPDATE loan_applications
          SET current_approver_order = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          `,
          [application.current_approver_order + 1, applicationId]
        );
      } else {
        const res = await pool.query(
          `
                UPDATE loan_applications
                SET status = 'approved',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 RETURNING applicant_id, loan_amount, purpose 
                `,
          [applicationId]
        );
        const returningRes = res.rows?.[0] ?? null
        if (returningRes) {
          await pool.query(
            `
      INSERT INTO employee_loans (user_id, loan_amount, remaining_amount, description, loan_applications_id)
      VALUES ($1, $2, $2, $3, $4)
      `,
            [returningRes.applicant_id, returningRes.loan_amount, returningRes.purpose, applicationId]
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing approval:", error);

    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}