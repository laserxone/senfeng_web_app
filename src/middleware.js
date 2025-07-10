import { NextResponse } from "next/server";

export async function middleware(req) {
  const { pathname, origin } = req.nextUrl;
  
  if (req.method === 'OPTIONS') {
    const res = NextResponse.next();
    res.headers.append('Access-Control-Allow-Credentials', 'true');
    res.headers.append('Access-Control-Allow-Origin', '*');
    res.headers.append('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
    res.headers.append(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    return res;
  }

  const match = pathname.match(/^\/api\/([^\/]+)\//);
  const uid = match?.[1];

  if (uid && !isNaN(uid)) {
    try {
      const check = await fetch(`${origin}/api/checkuser?uid=${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!check.ok) {
        return NextResponse.json(
          { message: 'You are not authorized to access the system' },
          { status: 403 }
        );
      }

      const data = await check.json();
      if (!data.active) {
        return NextResponse.json(
          { message: 'You are not authorized to access the system' },
          { status: 403 }
        );
      }
    } catch (err) {
      console.error('Middleware error:', err);
      return NextResponse.json({ message: 'Error validating user.' }, { status: 500 });
    }
  }

  return NextResponse.next();
}



export const config = {
    matcher: '/api/:path*',
}