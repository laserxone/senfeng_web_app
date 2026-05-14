
import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await pool.query(
      `
      UPDATE approval_hierarchies
      SET is_active = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [parseInt(id)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hierarchy:", error);

    return NextResponse.json(
      { error: "Failed to delete hierarchy" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = await params;

    const body = await request.json();

    const { name, description, approvers } = body;

    // Update hierarchy
    await client.query(
      `
      UPDATE approval_hierarchies
      SET name = $1,
          description = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [name, description || null, parseInt(id)]
    );

    // Remove old approvers
    await client.query(
      `
      DELETE FROM hierarchy_approvers
      WHERE hierarchy_id = $1
      `,
      [parseInt(id)]
    );

    // Insert updated approvers
    for (let i = 0; i < approvers.length; i++) {
      await client.query(
        `
        INSERT INTO hierarchy_approvers
        (hierarchy_id, user_id, approval_order)
        VALUES ($1, $2, $3)
        `,
        [parseInt(id), approvers[i], i + 1]
      );
    }

    // Fetch updated hierarchy
    const updatedHierarchyResult = await client.query(
      `
      SELECT 
        ah.*,
        json_agg(
          json_build_object(
            'id', ha.id,
            'user_id', ha.user_id,
            'approval_order', ha.approval_order,
            'user_name', u.name,
            'user_email', u.email,
            'user_designation', u.designation
          ) ORDER BY ha.approval_order
        ) FILTER (WHERE ha.id IS NOT NULL) as approvers
      FROM approval_hierarchies ah
      LEFT JOIN hierarchy_approvers ha
        ON ah.id = ha.hierarchy_id
      LEFT JOIN users u
        ON ha.user_id = u.id
      WHERE ah.id = $1
      GROUP BY ah.id
      `,
      [parseInt(id)]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      updatedHierarchyResult.rows[0]
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error updating hierarchy:", error);

    return NextResponse.json(
      { error: "Failed to update hierarchy" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}