import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"
export async function GET() {
  try {
    const query = `
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
      LEFT JOIN hierarchy_approvers ha ON ah.id = ha.hierarchy_id
      LEFT JOIN users u ON ha.user_id = u.id
      WHERE ah.is_active = true
      GROUP BY ah.id
      ORDER BY ah.created_at DESC
    `

    const result = await pool.query(query)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching hierarchies:", error)

    return NextResponse.json(
      { error: "Failed to fetch hierarchies" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const body = await request.json()

    const { name, description, hierarchy_type, approvers, created_by } = body

    if (!name || !approvers || approvers.length === 0) {
      return NextResponse.json(
        {
          error: "Name and at least one approver are required",
        },
        { status: 400 }
      )
    }

    // Create hierarchy
    const hierarchyResult = await client.query(
      `
      INSERT INTO approval_hierarchies
      (name, description, hierarchy_type, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [name, description || null, hierarchy_type || "loan", created_by || null]
    )

    const hierarchy = hierarchyResult.rows[0]

    // Insert approvers
    for (let i = 0; i < approvers.length; i++) {
      await client.query(
        `
        INSERT INTO hierarchy_approvers
        (hierarchy_id, user_id, approval_order)
        VALUES ($1, $2, $3)
        `,
        [hierarchy.id, approvers[i], i + 1]
      )
    }

    // Fetch full hierarchy
    const completeHierarchyResult = await client.query(
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
      LEFT JOIN hierarchy_approvers ha ON ah.id = ha.hierarchy_id
      LEFT JOIN users u ON ha.user_id = u.id
      WHERE ah.id = $1
      GROUP BY ah.id
      `,
      [hierarchy.id]
    )

    await client.query("COMMIT")

    return NextResponse.json(completeHierarchyResult.rows[0], { status: 201 })
  } catch (error) {
    await client.query("ROLLBACK")

    console.error("Error creating hierarchy:", error)

    return NextResponse.json(
      { error: "Failed to create hierarchy" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
