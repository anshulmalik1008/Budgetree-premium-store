import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/customer-auth";

/* =========================
   GET CUSTOMER WISHLIST
========================= */

export async function GET() {
  try {
    const userId = await getCurrentCustomerId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first",
          wishlist: [],
        },
        { status: 401 }
      );
    }

    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch wishlist",
        wishlist: [],
      },
      { status: 500 }
    );
  }
}

/* =========================
   ADD / REMOVE WISHLIST
========================= */

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentCustomerId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const productId = Number(body.productId);

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid productId is required",
        },
        { status: 400 }
      );
    }

    /* CHECK PRODUCT */

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    /* CHECK EXISTING WISHLIST */

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    /* REMOVE */

    if (existing) {
      await prisma.wishlist.delete({
        where: {
          id: existing.id,
        },
      });

      return NextResponse.json({
        success: true,
        wishlisted: false,
        message: "Removed from wishlist",
      });
    }

    /* ADD */

    const wishlist = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        wishlisted: true,
        message: "Added to wishlist",
        wishlist,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("WISHLIST POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update wishlist",
      },
      { status: 500 }
    );
  }
}
