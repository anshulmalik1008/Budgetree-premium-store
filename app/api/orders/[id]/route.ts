import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
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
          message: "Order not found",
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
    console.error("GET ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}
