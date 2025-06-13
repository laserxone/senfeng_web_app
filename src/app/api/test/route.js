import pool from "@/config/db";
import { NextResponse } from "next/server"
import moment from "moment";
import admin from "@/lib/firebaseAdmin";


export async function GET() {




    // const { duplicates, matched, unmatched } = await getComparisonData();

    // for (const match of matched) {
    //     const { firebase, matchedPsql } = match;

    //     const firebaseImage = firebase.images || null;

    //     for (const psql of matchedPsql) {
    //         const paymentId = psql.id;

    //         if (firebaseImage) {
    //             await pool.query(
    //                 `UPDATE payment SET firebase_img = $1 WHERE id = $2`,
    //                 [firebaseImage, paymentId]
    //             );
    //         }
    //     }
    // }

    // const {duplicates} = await getPaymentsWithDuplicateImages()
    // return NextResponse.json({ duplicates }, { status: 200 })
     return NextResponse.json({ message : "done" }, { status: 200 })
}



export const revalidate = 0


async function getPaymentsWithDuplicateImages() {
    const res = await pool.query(`
    SELECT 
      p.*, 
      s.id AS sale_id,
      s.customer_id,
      c.name AS customer_name,
      c.owner AS customer_owner
    FROM payment p
    LEFT JOIN sale s ON p.machine_id = s.id
    LEFT JOIN customer c ON s.customer_id = c.id
  `);

    const enrichedPayments = res.rows;

    // Group payments by image
    const imageMap = new Map();

    for (const payment of enrichedPayments) {
        const imageKey = payment.image?.trim();
        if (!imageKey) continue;

        if (!imageMap.has(imageKey)) {
            imageMap.set(imageKey, []);
        }
        imageMap.get(imageKey).push(payment);
    }

    // Filter only duplicated image entries
    const duplicates = [];
    for (const [image, entries] of imageMap.entries()) {
        if (entries.length > 1) {
            duplicates.push({
                image,
                payments: entries,
            });
        }
    }

    return {
        enrichedPayments, // full list with sale and customer info
        duplicates,       // grouped by duplicated image
    };
}

async function getComparisonData() {

    const db = admin.firestore();

    const customersSnapshot = await db.collection('Customer').get();
    const customerMap = {};
    customersSnapshot.forEach(doc => {
        const data = doc.data();
        customerMap[doc.id] = {
            customerCompany: data.company || '',
            customerOwner: data.owner || '',
        };
    });

    const snapshot = await db.collection('Payments').get();
    const firebasePayments = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        const customerInfo = customerMap[data.clientID] || {
            customerCompany: '',
            customerOwner: '',
        };
        firebasePayments.push({
            id: doc.id,
            note: data.note,
            amount: data.amount,
            ...data,
            ...customerInfo
        });
    });

    // STEP 2: Group by note
    const noteGroups = {};
    for (const payment of firebasePayments) {
        const note = payment.note || 'undefined';
        if (!noteGroups[note]) noteGroups[note] = [];
        noteGroups[note].push(payment);
    }

    const firebaseDuplicates = [];
    const firebaseUnique = [];

    for (const note in noteGroups) {
        const group = noteGroups[note];
        if (group.length > 1) {
            firebaseDuplicates.push({ note, entries: group });
        } else {
            firebaseUnique.push(group[0]);
        }
    }

    // STEP 3: Fetch PostgreSQL payments
    const res = await pool.query(
        `
         SELECT 
      p.*,
      s.customer_id, 
      c.name as customer_name,
      c.owner as customer_owner
    FROM payment p
    LEFT JOIN sale s ON p.machine_id = s.id
    LEFT JOIN customer c ON s.customer_id = c.id`
    );
    const psqlPayments = res.rows;

    // STEP 4: Match Firebase unique entries with PSQL payments
    const matchedPsqlEntries = [];
    const unmatchedFirebaseEntries = [];

    for (const fb of firebaseUnique) {
        const matches = psqlPayments.filter(
            ps => ps.note === fb.note && Number(ps.amount) === Number(fb.amount)
        );

        if (matches.length > 0) {
            matchedPsqlEntries.push({
                firebase: fb,
                matchedPsql: matches,
            });
        } else {
            unmatchedFirebaseEntries.push(fb);
        }
    }

    return {
        duplicates: firebaseDuplicates,
        matched: matchedPsqlEntries,
        unmatched: unmatchedFirebaseEntries,
    };
}