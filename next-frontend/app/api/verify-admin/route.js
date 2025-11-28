import { NextResponse } from "next/server";

export async function POST(req) {
  const { key } = await req.json();

  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ success: false });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("adminKey", key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return response;
}
