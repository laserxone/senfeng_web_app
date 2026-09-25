import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export const createAvailablePartsHandler = (office: "lahore" | "karachi") =>
  async function GET(req: NextRequest) {
    const location = req.nextUrl.searchParams.get("location")?.toLowerCase();
    const selectedLocation = ["all", "lahore", "karachi"].includes(
      location || "",
    )
      ? location!
      : office;

    try {
      const result = await pool.query(
        `SELECT MIN(oi.id) AS id, MIN(oi.order_id) AS order_id, oi.name,
          oi.machine_model, oi.machine_power, MIN(oi.machine_serial) AS machine_serial,
          MIN(oi.location) AS location, MIN(o.title) AS order_title,
          COUNT(*)::int AS available_qty
         FROM order_items oi
         LEFT JOIN orders o ON o.id = oi.order_id
         WHERE oi.is_machine IS FALSE AND oi.booked IS FALSE AND oi.show IS TRUE
           AND ($1 = 'all' OR LOWER(oi.location) = $1)
         GROUP BY oi.name, oi.machine_model, oi.machine_power
         ORDER BY MIN(oi.id) DESC`,
        [selectedLocation],
      );
      return NextResponse.json(result.rows);
    } catch (error) {
      console.error("Error getting available parts:", error);
      return NextResponse.json(
        { message: "Unable to get available parts" },
        { status: 500 },
      );
    }
  };

export const GET = createAvailablePartsHandler("lahore");
