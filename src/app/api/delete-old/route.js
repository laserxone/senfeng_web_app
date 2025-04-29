import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import moment from "moment";
import { NextResponse } from "next/server";



export async function GET(req) {

    try {
        const threeMonthsBack = moment().subtract(3, 'months').startOf('month').toDate();
        const branchexpensesQuery = `
            SELECT * 
            FROM branchexpenses 
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;
        const branchexpensesResults = await pool.query(branchexpensesQuery, [threeMonthsBack]);
        const reimbursementQuery = `
            SELECT * 
            FROM reimbursement 
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;
        const reimbursementResults = await pool.query(reimbursementQuery, [threeMonthsBack]);
        const imagesToDelete = [];
        branchexpensesResults.rows.forEach(item => {
            if (item.image) imagesToDelete.push(item.image);
        });
        reimbursementResults.rows.forEach(item => {
            if (item.image) imagesToDelete.push(item.image);
        });
        const storage = admin.storage().bucket();
        const promises = imagesToDelete.map(imageRef => {

            if (imageRef && !imageRef.includes('http')) {
                const file = storage.file(imageRef);
                return file.delete();
            } else if (imageRef && imageRef.includes('http')) {
                const refPath = getStoragePathFromUrl(imageRef);
                if (refPath) {
                    const file = storage.file(refPath);
                    return file.delete();
                }
            }
            return null;
        }).filter(p => p !== null)

        await Promise.all(promises);


        const updateBranchexpensesQuery = `
            UPDATE branchexpenses 
            SET image = ''
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;
        const updateReimbursementQuery = `
            UPDATE reimbursement 
            SET image = ''
            WHERE date < $1 AND (image IS NOT NULL AND image != '')
        `;

        // Execute update queries
        await pool.query(updateBranchexpensesQuery, [threeMonthsBack]);
        await pool.query(updateReimbursementQuery, [threeMonthsBack]);

        return NextResponse.json({ message: "Old Data updated" }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { message: "Failed ", details: err.message },
            { status: 500 }
        );
    }
}


function getStoragePathFromUrl(url) {
    try {
        const match = url.match(/\/o\/(.*?)\?alt=media/);
        if (match && match[1]) return decodeURIComponent(match[1]);
        return null;
    } catch {
        return null;
    }
}

export const revalidate = 0