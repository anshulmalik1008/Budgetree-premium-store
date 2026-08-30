import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}
