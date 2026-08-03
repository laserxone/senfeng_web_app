import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const foldersResult = await pool.query("SELECT * FROM folder")

    const documentsResult = await pool.query("SELECT * FROM document")

    const tree = await buildFolderTree(foldersResult.rows, documentsResult.rows)

    return NextResponse.json(tree)
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 }
      )
    }
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ")

    const query = `
        INSERT INTO folder (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING id
    `

    const res = await pool.query(query, values)

    console.log("data inserted successfully")
    return NextResponse.json(
      { message: "Inserted successfully", id: res.rows?.[0]?.id ?? null },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error inserting data: ", error)
    return NextResponse.json(
      { message: "Error adding customer" },
      { status: 500 }
    )
  }
}

async function formatFile(doc: any) {
  return {
    id: doc.id,
    name: doc.path,
    path: doc.path,
    folderId: doc.folder_id,
    createdAt: doc.created_at,
    addedBy: doc.added_by,
    size: doc.size,
    type: doc.type,
    thumbnail: doc.thumbnail_path,
  }
}

async function buildFolderTree(folders: any[], documents: any[]) {
  const folderMap = new Map()

  folders.forEach((folder: any) => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parent_folder,
      children: [],
      files: [],
    })
  })

  const root: any = {
    id: "root",
    name: "Root",
    parentId: null,
    children: [],
    files: [],
  }

  // attach folders
  folders.forEach((folder: any) => {
    const current = folderMap.get(folder.id)

    if (folder.parent_folder) {
      const parent = folderMap.get(folder.parent_folder)
      if (parent) parent.children.push(current)
    } else {
      root.children.push(current)
    }
  })

  const files = await Promise.all(documents.map((doc: any) => formatFile(doc)))

  files.forEach((file: any, index) => {
    const doc = documents[index]

    if (doc.folder_id && folderMap.has(doc.folder_id)) {
      folderMap.get(doc.folder_id).files.push(file)
    } else {
      root.files.push(file)
    }
  })

  return root
}
