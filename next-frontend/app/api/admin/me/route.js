import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const adminKey = cookieStore.get("adminKey")?.value || null;
  return NextResponse.json({ adminKey });
}
