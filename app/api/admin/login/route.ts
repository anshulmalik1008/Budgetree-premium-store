import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || user.role === "CUSTOMER") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin credentials",
        },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin credentials",
        },
        { status: 401 }
      );
    }

    const token = await createAdminToken(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "bps_admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
      },
      { status: 500 }
    );
  }
}
