import { NextResponse } from "next/server";
import { clearCustomerAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearCustomerAuthCookie();

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("CUSTOMER LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to logout",
      },
      { status: 500 }
    );
  }
}
