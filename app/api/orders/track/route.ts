import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const orderNumber = String(
      body.orderNumber ?? ""
    )
      .trim()
      .toUpperCase();

    const email = String(
      body.email ?? ""
    )
      .trim()
      .toLowerCase();

    if (!orderNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Order number is required",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,

        ...(email
          ? {
              customerEmail: email,
            }
          : {}),
      },

      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found. Please check order number and email.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,

      order: {
        id: order.id,
        orderNumber: order.orderNumber,

        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,

        shippingAddress: order.shippingAddress,
        city: order.city,
        state: order.state,
        pincode: order.pincode,

        subtotal: order.subtotal.toString(),
        shippingFee: order.shippingFee.toString(),
        discount: order.discount.toString(),
        total: order.total.toString(),

        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price.toString(),
          total: item.total.toString(),

          image:
            item.product?.images?.[0]?.url ?? null,
        })),
      },
    });
  } catch (error) {
    console.error("TRACK ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to track order",
      },
      { status: 500 }
    );
  }
}