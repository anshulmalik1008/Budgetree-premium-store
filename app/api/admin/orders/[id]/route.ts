import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET SINGLE ORDER
export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: {
            id: "asc",
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                salePrice: true,
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
      order,
    });
  } catch (error) {
    console.error(
      "GET ADMIN ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}

// UPDATE ORDER
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { status, paymentStatus } = body;

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];

    const allowedPaymentStatuses = [
      "PENDING",
      "PAID",
      "FAILED",
      "REFUNDED",
    ];

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status",
        },
        { status: 400 }
      );
    }

    if (
      paymentStatus !== undefined &&
      !allowedPaymentStatuses.includes(paymentStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status",
        },
        { status: 400 }
      );
    }

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        ...(status !== undefined
          ? { status }
          : {}),

        ...(paymentStatus !== undefined
          ? { paymentStatus }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: {
            id: "asc",
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
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

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "UPDATE ADMIN ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order",
      },
      { status: 500 }
    );
  }
}
