import {karachi_pool as pool} from "@/config/db"
import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"


export async function DELETE(req, { params }) {

    const { id } = await params
    if (!id) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }

    try {
        const result = await pool.query(`
            WITH RECURSIVE descendants AS (
                SELECT id FROM superadmin_folder WHERE id = $1
                UNION
                SELECT f.id FROM superadmin_folder f
                INNER JOIN descendants d ON f.parent_folder = d.id
            )
            SELECT id FROM descendants;
        `, [id])

        const folderIds = result.rows.map((row) => row.id)

        const docResult = await pool.query(`
            SELECT path FROM superadmin_document WHERE folder_id = ANY($1)
        `, [folderIds])

        const paths = docResult.rows.map((row) => row.path)

        if (paths.length > 0) {
            const { error: storageError } = await supabase
                .storage
                .from('superadmin.documents')
                .remove(paths)

            if (storageError) {
                console.log("Storage delete error:", storageError)
                return NextResponse.json({ message: "Failed to delete files from storage" }, { status: 500 })
            }

        }

        await pool.query(`DELETE FROM superadmin_folder WHERE id = $1`, [id])

        return NextResponse.json({ message: "Folder and documents deleted" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
    }

}

export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE superadmin_folder 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    console.log("Folder data updated successfully");
    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0