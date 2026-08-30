import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/auth";

export async function GET() {
  try {
    // Logged-in customer ki ID JWT cookie se milegi
    const userId = await getCurrentCustomerId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Please login first",
        },
        { status: 401 }
      );
    }

    // Sirf isi logged-in customer ke orders
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                  take: 1,
                  select: {
                    url: true,
                    alt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      authenticated: true,
      orders,
    });
  } catch (error) {
    console.error("MY ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer orders",
      },
      { status: 500 }
    );
  }
}
