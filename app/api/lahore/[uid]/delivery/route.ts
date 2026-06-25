import pool from "@/config/db";
import { storage } from "@/config/firebase";
import { deleteObject, ref } from "firebase/storage";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
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

    pr.slip AS payment_slip,

    COALESCE(s.sell_by, c.ownership) AS ownership_id,
    COALESCE(sell_user.name, owner_user.name) AS ownership_name

  FROM sale s
  LEFT JOIN customer c ON s.customer_id = c.id
  LEFT JOIN payment_requests pr ON pr.sale_id = s.id

  LEFT JOIN users sell_user 
    ON sell_user.id = s.sell_by

  LEFT JOIN users owner_user 
    ON owner_user.id = c.ownership

  WHERE s.ready_for_delivery IS TRUE
    AND s.delivery_date IS NULL
    AND LOWER(c.office) = 'lahore'

  ORDER BY s.delivery_request_date ASC
`);

    return NextResponse.json(queryResult.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();



  try {
    const data = await req.json();
    await client.query("BEGIN");

    const existingNamePlate = await client.query(
      `SELECT machine_nameplate_images FROM sale WHERE id = $1`,
      [data.machine_id],
    );
    const existing =
      existingNamePlate.rows?.[0]?.machine_nameplate_images || [];
    const combinedNamePlates = [...existing, ...data.machine_nameplate_images];

    await client.query(
      `UPDATE sale SET machine_nameplate_images = $1, order_no_arr  =$2, delivery_date = $3, dispatch_information = $4 WHERE id = $5`,
      [
        combinedNamePlates,
        data.order_no_arr,
        data.delivery_date,
        data.dispatch_information,
        data.machine_id,
      ],
    );

    await client.query(
      `
        UPDATE order_items SET status = $1 WHERE machine_id = $2`,
      ["Dispatched", data.machine_id],
    );

    if (data.transportation && Number(data.transportation) > 0) {
      await client.query(
        ` INSERT INTO payment_requests (
        request_type,
        amount,
        sale_id,
        office
      )
      VALUES (
        $1,$2,$3, $4
      )`,
        [true, data.transportation, data.machine_id, "lahore"],
      );
    }



    // ////////////////////////////

    // const { order_no_data } = data;

    // const newSerial = order_no_data?.machine_serial;

    // if (data.machine_id && newSerial) {
    //   await client.query("BEGIN");

    //   try {
    //     const oldItemRes = await client.query(
    //       `
    //   SELECT 
    //     id,
    //     machine_serial,
    //     booked,
    //     booking_date,
    //     status,
    //     booked_by,
    //     machine_id,
    //     customer_id
    //   FROM order_items
    //   WHERE machine_id = $1
    //     AND booked = true
    //   LIMIT 1
    //   FOR UPDATE
    //   `,
    //       [data.machine_id]
    //     );

    //     if (!oldItemRes.rows.length) {
    //       throw new Error("Previously booked machine not found");
    //     }

    //     const oldItem = oldItemRes.rows[0];

    //     if (String(oldItem.machine_serial) !== String(newSerial)) {
    //       const newItemRes = await client.query(
    //         `
    //     SELECT 
    //       id,
    //       machine_serial,
    //       booked,
    //       booking_date,
    //       status,
    //       booked_by,
    //       machine_id,
    //       customer_id
    //     FROM order_items
    //     WHERE machine_serial = $1
    //     LIMIT 1
    //     FOR UPDATE
    //     `,
    //         [newSerial]
    //       );

    //       if (!newItemRes.rows.length) {
    //         throw new Error("Selected delivery machine serial not found");
    //       }

    //       const newItem = newItemRes.rows[0];

    //       if (newItem.booked) {
    //         await client.query(
    //           `
    //       UPDATE order_items
    //       SET 
    //         booked = $1,
    //         booking_date = $2,
    //         status = $3,
    //         booked_by = $4,
    //         machine_id = $5,
    //         customer_id = $6
    //       WHERE id = $7
    //       `,
    //           [
    //             oldItem.booked,
    //             oldItem.booking_date,
    //             oldItem.status,
    //             oldItem.booked_by,
    //             oldItem.machine_id,
    //             oldItem.customer_id,
    //             newItem.id,
    //           ]
    //         );

    //         await client.query(
    //           `
    //       UPDATE order_items
    //       SET 
    //         booked = $1,
    //         booking_date = $2,
    //         status = $3,
    //         booked_by = $4,
    //         machine_id = $5,
    //         customer_id = $6
    //       WHERE id = $7
    //       `,
    //           [
    //             newItem.booked,
    //             newItem.booking_date,
    //             newItem.status,
    //             newItem.booked_by,
    //             newItem.machine_id,
    //             newItem.customer_id,
    //             oldItem.id,
    //           ]
    //         );
    //       } else {
    //         // Case 2: New selected serial is free.
    //         // Move booking information to new machine and clear old machine.
    //         await client.query(
    //           `
    //       UPDATE order_items
    //       SET 
    //         booked = $1,
    //         booking_date = $2,
    //         status = $3,
    //         booked_by = $4,
    //         machine_id = $5,
    //         customer_id = $6
    //       WHERE id = $7
    //       `,
    //           [
    //             oldItem.booked,
    //             oldItem.booking_date,
    //             oldItem.status,
    //             oldItem.booked_by,
    //             oldItem.machine_id,
    //             oldItem.customer_id,
    //             newItem.id,
    //           ]
    //         );

    //         await client.query(
    //           `
    //       UPDATE order_items
    //       SET 
    //         booked = false,
    //         booking_date = NULL,
    //         status = 'Order Placed',
    //         booked_by = NULL,
    //         machine_id = NULL,
    //         customer_id = NULL
    //       WHERE id = $1
    //       `,
    //           [oldItem.id]
    //         );
    //       }
    //     }

    //     await client.query("COMMIT");
    //   } catch (error) {
    //     await client.query("ROLLBACK");
    //     throw error;
    //   }
    // }


    // /////////////////////////////


    await client.query("COMMIT");

    return NextResponse.json({ message: "Done" }, { status: 200 });
  } catch (error: any) {
    console.log(error);
    await client.query("ROLLBACK");
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }

}

export async function PUT(req: NextRequest) {
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
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
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
      } catch (err: any) {
        console.warn("Image delete failed:", err?.message);
        throw err;
      }
      newNamePlate = namePlate?.filter((item: any) => item !== img);
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
  } catch (error: any) {
    await pool.query("ROLLBACK");
    console.log(error);

    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
