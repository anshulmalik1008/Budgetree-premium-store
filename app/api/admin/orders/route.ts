import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ALL ADMIN ORDERS
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET ADMIN ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

// CREATE ORDER FROM ADMIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      state,
      pincode,
      items,
      shippingFee = 0,
      discount = 0,
      paymentMethod,
      userId,
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer name, email and order items are required",
        },
        { status: 400 }
      );
    }

    const productIds = items
      .map((item: { productId: number | string }) =>
        Number(item.productId)
      )
      .filter((id: number) => Number.isInteger(id));

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid products found",
        },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more products were not found",
        },
        { status: 400 }
      );
    }

    let subtotal = 0;

    const orderItems = items.map(
      (item: {
        productId: number | string;
        quantity: number | string;
      }) => {
        const product = products.find(
          (p) => p.id === Number(item.productId)
        );

        if (!product) {
          throw new Error("Product not found");
        }

        const quantity = Math.max(
          1,
          Number(item.quantity) || 1
        );

        const price = Number(
          product.salePrice ?? product.price
        );

        const total = price * quantity;

        subtotal += total;

        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          price,
          total,
        };
      }
    );

    const finalShippingFee = Number(shippingFee || 0);
    const finalDiscount = Number(discount || 0);

    const total =
      subtotal +
      finalShippingFee -
      finalDiscount;

    const orderNumber = `BPS-${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,

        userId: userId
          ? Number(userId)
          : null,

        customerName,
        customerEmail,
        customerPhone:
          customerPhone || null,

        shippingAddress:
          shippingAddress || null,

        city: city || null,
        state: state || null,
        pincode: pincode || null,

        subtotal,
        shippingFee: finalShippingFee,
        discount: finalDiscount,
        total,

        paymentMethod:
          paymentMethod || null,

        items: {
          create: orderItems,
        },
      },

      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE ADMIN ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order",
      },
      { status: 500 }
    );
  }
}
