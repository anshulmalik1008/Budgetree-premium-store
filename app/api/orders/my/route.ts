import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

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

    const orders = await prisma.order.findMany({
      where: {
        userId,
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

    const formattedOrders = orders.map((order) => ({
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
    }));

    return NextResponse.json({
      success: true,
      authenticated: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("MY ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message: "Failed to fetch customer orders",
      },
      { status: 500 }
    );
  }
}
