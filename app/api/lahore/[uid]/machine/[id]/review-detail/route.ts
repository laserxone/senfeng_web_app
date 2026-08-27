import pool from "@/config/db";
import { NextResponse } from "next/server";

export const createMachineReviewDetailHandler = (office: "lahore" | "karachi") => async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  const { id, uid } = await params;
  try {
    const userResult = await pool.query(
      `SELECT designation, office FROM users WHERE id = $1`,
      [uid],
    );
    const user = userResult.rows[0];
    if (user?.designation !== "Owner" || user.office?.toLowerCase() !== office) {
      return NextResponse.json({ message: "Only an owner of this office can view this review" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT
         json_build_object(
           'name', c.name,
           'address', c.address,
           'location', c.location,
           'owner', c.owner,
           'industry', c.industry
         ) AS customer,
         json_build_object(
           'power', s.power,
           'source', s.source,
           'serial_no', s.serial_no,
           'review_status', s.review_status
         ) AS machine,
         COALESCE(
           json_agg(row_to_json(mi) ORDER BY mi.date ASC)
             FILTER (WHERE mi.id IS NOT NULL),
           '[]'::json
         ) AS installments
       FROM sale s
       INNER JOIN customer c ON c.id = s.customer_id
       LEFT JOIN machine_installments mi ON mi.sale_id = s.id
       WHERE s.id = $1
       GROUP BY s.id, c.id`,
      [id],
    );
    if (!result.rows[0]) return NextResponse.json({ message: "Machine not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Machine review detail error:", error);
    return NextResponse.json({ message: "Unable to load machine review details" }, { status: 500 });
  }
};

export const GET = createMachineReviewDetailHandler("lahore");
