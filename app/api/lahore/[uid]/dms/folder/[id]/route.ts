import pool from "@/config/db"
import { supabase } from "@/lib/supabaseClient"
import { NextRequest, NextResponse } from "next/server"


export async function DELETE(req : NextRequest, { params } : {params : Promise<{id : string}>}) {

    const { id } = await params
    if (!id) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }

    try {
        const result = await pool.query(`
            WITH RECURSIVE descendants AS (
                SELECT id FROM folder WHERE id = $1
                UNION
                SELECT f.id FROM folder f
                INNER JOIN descendants d ON f.parent_folder = d.id
            )
            SELECT id FROM descendants;
        `, [id])

        const folderIds = result.rows.map((row) => row.id)

        const docResult = await pool.query(`
            SELECT path, thumbnail_path FROM document WHERE folder_id = ANY($1)
        `, [folderIds])

        const paths = docResult.rows.map((row) => row.path)
        const thumbnail_paths = docResult.rows.map((row)=>row.thumbnail_path)

         if (thumbnail_paths.length > 0) {
            const { error: storageError } = await supabase
                .storage
                .from('documents')
                .remove(thumbnail_paths)

            if (storageError) {
                console.log("Storage delete error:", storageError)
                return NextResponse.json({ message: "Failed to delete files from storage" }, { status: 500 })
            }

        }

        if (paths.length > 0) {
            const { error: storageError } = await supabase
                .storage
                .from('documents')
                .remove(paths)

            if (storageError) {
                console.log("Storage delete error:", storageError)
                return NextResponse.json({ message: "Failed to delete files from storage" }, { status: 500 })
            }

        }

        await pool.query(`DELETE FROM folder WHERE id = $1`, [id])

        return NextResponse.json({ message: "Folder and documents deleted" }, { status: 200 })
    } catch (error : any) {
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
    }

}

export async function PUT(req : NextRequest, { params } : {params : Promise<{id : string}>}) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields : any[] = [];
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
          UPDATE folder 
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