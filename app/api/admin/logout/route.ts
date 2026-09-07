import { NextResponse } from "next/server";
import { clearAdminAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  await clearAdminAuthCookie();

  return NextResponse.redirect(
    new URL("/admin/login", request.url)
  );
}
