import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

type IncomingItem = {
  productId?: number | string;
  quantity?: number | string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = await getCurrentUserId();

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      state,
      pincode,
      paymentMethod = "COD",
      shippingFee = 0,
      discount = 0,
      items,
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !shippingAddress ||
      !city ||
      !state ||
      !pincode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill all required details.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart is empty.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * RESOLVE PRODUCTS
     *
     * Cart ka productId:
     * 1. Local Prisma Product.id ho sakta hai
     * 2. SiriPay external product_id ho sakta hai
     *
     * Isliye dono check karenge.
     * -------------------------------------------------------
     */

    const resolvedItems = [];

    for (const item of items as IncomingItem[]) {
      const incomingId = String(item.productId ?? "").trim();

      const quantity = Math.max(
        1,
        Math.floor(Number(item.quantity) || 1)
      );

      if (!incomingId) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product ID.",
          },
          { status: 400 }
        );
      }

      const numericId = Number(incomingId);

      let product = null;

      // ---------------------------------------------------
      // FIRST: local Product.id
      // ---------------------------------------------------

      if (
        Number.isInteger(numericId) &&
        numericId > 0
      ) {
        product = await prisma.product.findUnique({
          where: {
            id: numericId,
          },
        });
      }

      // ---------------------------------------------------
      // SECOND: SiriPay externalId
      // ---------------------------------------------------

      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            externalId: incomingId,
          },
        });
      }

      if (!product) {
        console.error(
          "ORDER PRODUCT NOT FOUND:",
          incomingId
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Some cart products are not available in the local product database.",
            productId: incomingId,
          },
          { status: 400 }
        );
      }

      resolvedItems.push({
        product,
        quantity,
      });
    }

    /*
     * -------------------------------------------------------
     * CALCULATE TOTAL FROM DATABASE PRODUCTS
     * -------------------------------------------------------
     */

    let subtotal = 0;

    const orderItems = resolvedItems.map(
      ({ product, quantity }) => {
        const price = Number(
          product.salePrice ??
            product.price
        );

        const itemTotal =
          price * quantity;

        subtotal += itemTotal;

        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          price,
          total: itemTotal,
        };
      }
    );

    const shipping = Number(shippingFee) || 0;
    const discountAmount = Number(discount) || 0;

    const total =
      subtotal +
      shipping -
      discountAmount;

    /*
     * -------------------------------------------------------
     * ORDER NUMBER
     * -------------------------------------------------------
     */

    const orderNumber =
      `BGT-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    /*
     * -------------------------------------------------------
     * CREATE ORDER
     * -------------------------------------------------------
     */

    const order = await prisma.order.create({
      data: {
        orderNumber,

        userId: userId
          ? Number(userId)
          : null,

        customerName:
          String(customerName).trim(),

        customerEmail:
          String(customerEmail)
            .trim()
            .toLowerCase(),

        customerPhone:
          String(customerPhone).trim(),

        shippingAddress:
          String(shippingAddress).trim(),

        city: String(city).trim(),

        state: String(state).trim(),

        pincode:
          String(pincode).trim(),

        subtotal,

        shippingFee: shipping,

        discount: discountAmount,

        total,

        status: "PENDING",

        paymentStatus: "PENDING",

        paymentMethod:
          String(paymentMethod),

        items: {
          create: orderItems,
        },
      },

      include: {
        items: true,
      },
    });

    console.log(
      "ORDER CREATED:",
      order.orderNumber
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Order placed successfully.",

        order: {
          id: order.id,
          orderNumber:
            order.orderNumber,
          subtotal:
            order.subtotal.toString(),
          shippingFee:
            order.shippingFee.toString(),
          discount:
            order.discount.toString(),
          total:
            order.total.toString(),
          status: order.status,
          paymentStatus:
            order.paymentStatus,
          paymentMethod:
            order.paymentMethod,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create order.",
      },
      { status: 500 }
    );
  }
}