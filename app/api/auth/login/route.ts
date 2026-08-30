import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setCustomerAuthCookie } from "@/lib/auth"; 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const password = String(body.password ?? "");

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

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please use the admin login for this account",
        },
        { status: 403 }
      );
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    await setCustomerAuthCookie(user.id);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "CUSTOMER LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to login",
      },
      { status: 500 }
    );
  }
}
