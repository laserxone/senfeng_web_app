import pool from "@/config/db";
import { storage } from "@/config/firebase";
import { deleteObject, ref } from "firebase/storage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest, { params }:{params:Promise<{id:string}>}) {
  try {
    const queryResult = await pool.query(`
  SELECT 
   s.id,
    s.order_no_arr,
    s.delivery_date,
    s.power,
    s.source,
    s.delivery_information,
    s.serial_no,
    s.dispatch_information, 
    s.customer_id,
    c.name AS customer_name, 
    c.owner AS customer_owner,
    u.name AS ownership_name
  FROM sale s
  JOIN customer c ON s.customer_id = c.id
  JOIN users u ON c.ownership = u.id
  WHERE s.ready_for_delivery IS TRUE AND delivery_date IS NULL
  AND c.office = 'karachi'
  ORDER BY s.delivery_request_date ASC
`);

    return NextResponse.json(queryResult.rows, { status: 200 });
  } catch (error:any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req:NextRequest) {
  const data = await req.json();

  try {
    const existingNamePlate = await pool.query(
      `SELECT machine_nameplate_images FROM sale WHERE id = $1`,
      [data.machine_id],
    );
    const existing =
      existingNamePlate.rows?.[0]?.machine_nameplate_images || [];
    const combinedNamePlates = [...existing, ...data.machine_nameplate_images];

    await pool.query(
      `UPDATE sale SET machine_nameplate_images = $1, order_no_arr  =$2, delivery_date = $3, dispatch_information = $4 WHERE id = $5`,
      [
        combinedNamePlates,
        data.order_no_arr,
        data.delivery_date,
        data.dispatch_information,
        data.machine_id,
      ],
    );

    await pool.query(
      `
        UPDATE order_items SET status = $1 WHERE machine_id = $2`,
      ["Dispatched", data.machine_id],
    );


    return NextResponse.json({ message: "Done" }, { status: 200 });
  } catch (error:any) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req:NextRequest) {
  const data = await req.json();

  try {
    const existingNamePlate = await pool.query(
      `SELECT machine_nameplate_images FROM sale WHERE id = $1`,
      [data.machine_id],
    );
    const existing =
      existingNamePlate.rows?.[0]?.machine_nameplate_images || [];
    const incoming = data.machine_nameplate_images;
    const combinedNamePlates = [...new Set([...existing, ...incoming])];

    await pool.query(
      `UPDATE sale SET machine_nameplate_images = $1, order_no_arr  =$2, delivery_date = $3, dispatch_information = $4 WHERE id = $5`,
      [
        combinedNamePlates,
        data.order_no_arr,
        data.delivery_date,
        data.dispatch_information,
        data.machine_id,
      ],
    );

   

    return NextResponse.json({ message: "Done" }, { status: 200 });
  } catch (error:any) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req:NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  try {
    if (!id) {
      return NextResponse.json({ message: "ID is missing" }, { status: 400 });
    }

    await pool.query("BEGIN");

    const checking = await pool.query(
      `SELECT machine_nameplate_images, dispatch_information FROM sale WHERE id = $1`,
      [id],
    );
    const namePlate = Array.isArray(
      checking.rows?.[0]?.machine_nameplate_images,
    )
      ? checking.rows[0].machine_nameplate_images
      : [];
    const dispatch = checking.rows?.[0]?.dispatch_information ?? null;
    let newNamePlate = [];
    let img = null;
    if (dispatch && typeof dispatch === "object") {
      img = dispatch?.other_information?.image;
    }

    if (img) {
      try {
        await deleteObject(ref(storage, img));
      } catch (err : any) {
        console.warn("Image delete failed:", err?.message);
        throw err;
      }
      newNamePlate = namePlate?.filter((item:any) => item !== img);
    }

    await pool.query(
      `UPDATE sale SET delivery_date = $1, dispatch_information = '{}'::jsonb, machine_nameplate_images = $2 WHERE id = $3`,
      [null, newNamePlate, id],
    );
    await pool.query(
      `UPDATE order_items SET status = $1 WHERE machine_id = $2`,
      ["Delivery Requested", id],
    );

    await pool.query("COMMIT");

   

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 },
    );
  } catch (error:any) {
    await pool.query("ROLLBACK");
    console.log(error);

    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
