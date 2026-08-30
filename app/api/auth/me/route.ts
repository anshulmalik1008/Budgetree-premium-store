import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/customer-auth";

export async function GET() {
  try {
    const userId = await getCurrentCustomerId();

    if (!userId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error(
      "CUSTOMER ME ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        user: null,
      },
      { status: 500 }
    );
  }
}
