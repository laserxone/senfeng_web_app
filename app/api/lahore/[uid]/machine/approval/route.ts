import pool from "@/config/db";
import { NextResponse } from "next/server";

export const createMachineApprovalHandler = (office: "lahore" | "karachi") =>
  async function GET() {
    try {
      const { rows } = await pool.query(
        `SELECT
           s.id,
           s.customer_id,
           s.type,
           s.serial_no,
           s.power,
           s.source,
           s.parts_information,
           c.member,
           c.name AS customer_name,
           c.owner AS customer_owner,
           sell_user.name AS sell_by_name,
           owner_user.name AS ownership_name
         FROM sale s
         JOIN users sell_user ON sell_user.id = s.sell_by
         LEFT JOIN customer c ON c.id = s.customer_id
         LEFT JOIN users owner_user ON owner_user.id = c.ownership
         WHERE s.review_status = 'pending'
           AND LOWER(sell_user.office) = $1
           AND NOT EXISTS (
             SELECT 1
             FROM cancelled_machine cm
             WHERE cm.machine_id = s.id
           )`,
        [office],
      );

      return NextResponse.json(rows);
    } catch (error) {
      console.error("Machine approval fetch error:", error);
      return NextResponse.json(
        { message: "Unable to fetch pending machine approvals" },
        { status: 500 },
      );
    }
  };

  export const revalidate = 0

export const GET = createMachineApprovalHandler("lahore");
