import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setCustomerAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email and password are required",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid name",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await setCustomerAuthCookie(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CUSTOMER REGISTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create account",
      },
      { status: 500 }
    );
  }
}
