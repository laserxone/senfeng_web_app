import { NextResponse } from "next/server"

const verify_token = "123456"
export async function GET(req) {
    const searchParams = req.nextUrl.searchParams
    const hub_mode = searchParams.get('hub_mode')
    const hub_verify_token = searchParams.get('hub_verify_token')
    const hub_challenge = searchParams.get("hub_challenge")

    if (hub_mode === 'subscribe' && hub_verify_token === verify_token) {
        return NextResponse.json({ hub_challenge })
    } else {
        return NextResponse.json("Verification failed.", { status: 500 })
    }


}