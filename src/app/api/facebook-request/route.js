import { NextResponse } from "next/server";
import axios from "axios";
import pool from "@/config/db";

const verify_token = process.env.FB_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const hub_mode = searchParams.get("hub.mode");
  const hub_verify_token = searchParams.get("hub.verify_token");
  const hub_challenge = searchParams.get("hub.challenge");

  if (hub_mode === "subscribe" && hub_verify_token === verify_token) {
    return new NextResponse(hub_challenge, { status: 200 });
  } else {
    return new NextResponse("Verification failed.", { status: 403 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Incoming webhook:", body);

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadId = changes?.value?.leadgen_id;

    if (!leadId) {
      return new NextResponse("No lead ID found", { status: 200 });
    }

    // const leadDetails = await fetchLeadDetails(leadId);
    // await saveLeadToDB(leadId, leadDetails);

    return new NextResponse("EVENT_RECEIVED", { status: 200 }); 
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

async function fetchLeadDetails(leadId) {
  const url = `https://graph.facebook.com/v17.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`;
  const { data } = await axios.get(url);
  return data; // contains field_data array
}

async function saveLeadToDB(leadId, leadDetails) {
  // Extract values from field_data
  let fullName = "";
  let email = "";
  let phone = "";

  if (Array.isArray(leadDetails.field_data)) {
    for (const field of leadDetails.field_data) {
      if (field.name === "full_name") fullName = field.values[0];
      if (field.name === "email") email = field.values[0];
      if (field.name === "phone_number") phone = field.values[0];
    }
  }

  // Example: save to PostgreSQL (uncomment in real app)
  // await pool.query(
  //   `INSERT INTO leads (fb_lead_id, full_name, email, phone) 
  //    VALUES ($1, $2, $3, $4)
  //    ON CONFLICT (fb_lead_id) DO NOTHING`,
  //   [leadId, fullName, email, phone]
  // );

  console.log(`✅ Lead ${leadId} saved to DB`, { fullName, email, phone });
}
