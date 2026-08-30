import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/auth";

// ===============================
// GET ALL ORDERS
// ===============================

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
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                salePrice: true,
                stock: true,
                status: true,
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
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

// ===============================
// CREATE ORDER
// ===============================

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
    } = body;

    // --------------------------------
    // BASIC VALIDATION
    // --------------------------------

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

    // --------------------------------
    // GET USER FROM AUTH COOKIE
    // --------------------------------

    const currentUserId = await getCurrentCustomerId();

    let userId: number | null = null;

    if (currentUserId) {
      const user = await prisma.user.findUnique({
        where: {
          id: currentUserId,
        },
        select: {
          id: true,
        },
      });

      if (user) {
        userId = user.id;
      }
    }

    // --------------------------------
    // NORMALIZE ITEMS
    // --------------------------------

    const normalizedItems = items
      .map(
        (item: {
          productId: number | string;
          quantity: number | string;
        }) => ({
          productId: Number(item.productId),
          quantity: Math.max(
            1,
            Math.floor(Number(item.quantity) || 1)
          ),
        })
      )
      .filter(
        (item: {
          productId: number;
          quantity: number;
        }) => Number.isInteger(item.productId)
      );

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid products found in order",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // PREVENT DUPLICATE PRODUCT IDS
    // --------------------------------

    const quantityMap = new Map<number, number>();

    for (const item of normalizedItems) {
      const current = quantityMap.get(item.productId) || 0;

      quantityMap.set(
        item.productId,
        current + item.quantity
      );
    }

    const productIds = Array.from(quantityMap.keys());

    // --------------------------------
    // FETCH PRODUCTS
    // --------------------------------

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

    // --------------------------------
    // CHECK PRODUCT STATUS + STOCK
    // --------------------------------

    for (const product of products) {
      const requestedQuantity =
        quantityMap.get(product.id) || 0;

      if (product.status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message: `${product.name} is currently unavailable`,
          },
          { status: 400 }
        );
      }

      if (product.stock < requestedQuantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Only ${product.stock} unit(s) available for ${product.name}`,
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------
    // CALCULATE ORDER TOTAL
    // --------------------------------

    let subtotal = 0;

    const orderItems = productIds.map((productId) => {
      const product = products.find(
        (item) => item.id === productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      const quantity =
        quantityMap.get(product.id) || 1;

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
    });

    // --------------------------------
    // SHIPPING + DISCOUNT
    // --------------------------------

    const finalShippingFee = Math.max(
      0,
      Number(shippingFee) || 0
    );

    const finalDiscount = Math.max(
      0,
      Number(discount) || 0
    );

    const total = Math.max(
      0,
      subtotal +
        finalShippingFee -
        finalDiscount
    );

    // --------------------------------
    // UNIQUE ORDER NUMBER
    // --------------------------------

    const orderNumber = `BPS-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`;

    // --------------------------------
    // TRANSACTION
    // --------------------------------

    const order = await prisma.$transaction(
      async (tx) => {
        // Re-check stock inside transaction
        // so two customers cannot easily
        // purchase the same last stock.

        for (const product of products) {
          const requestedQuantity =
            quantityMap.get(product.id) || 0;

          const currentProduct =
            await tx.product.findUnique({
              where: {
                id: product.id,
              },
              select: {
                id: true,
                name: true,
                stock: true,
                status: true,
              },
            });

          if (!currentProduct) {
            throw new Error(
              `Product ${product.id} not found`
            );
          }

          if (
            currentProduct.status !== "ACTIVE"
          ) {
            throw new Error(
              `${currentProduct.name} is unavailable`
            );
          }

          if (
            currentProduct.stock <
            requestedQuantity
          ) {
            throw new Error(
              `Insufficient stock for ${currentProduct.name}`
            );
          }
        }

        // --------------------------------
        // CREATE ORDER
        // --------------------------------

        const createdOrder =
          await tx.order.create({
            data: {
              orderNumber,

              userId,

              customerName:
                String(customerName).trim(),

              customerEmail:
                String(customerEmail)
                  .trim()
                  .toLowerCase(),

              customerPhone:
                customerPhone
                  ? String(customerPhone).trim()
                  : null,

              shippingAddress:
                shippingAddress
                  ? String(shippingAddress).trim()
                  : null,

              city: city
                ? String(city).trim()
                : null,

              state: state
                ? String(state).trim()
                : null,

              pincode: pincode
                ? String(pincode).trim()
                : null,

              subtotal,

              shippingFee:
                finalShippingFee,

              discount:
                finalDiscount,

              total,

              paymentMethod:
                paymentMethod
                  ? String(paymentMethod).trim()
                  : null,

              items: {
                create: orderItems,
              },
            },

            include: {
              items: true,
            },
          });

        // --------------------------------
        // DECREASE STOCK
        // --------------------------------

        for (const product of products) {
          const quantity =
            quantityMap.get(product.id) || 0;

          const updatedProduct =
            await tx.product.update({
              where: {
                id: product.id,
              },

              data: {
                stock: {
                  decrement: quantity,
                },
              },

              select: {
                stock: true,
              },
            });

          // Automatically mark out of stock
          if (updatedProduct.stock <= 0) {
            await tx.product.update({
              where: {
                id: product.id,
              },

              data: {
                stock: 0,
                status: "OUT_OF_STOCK",
              },
            });
          }
        }

        return createdOrder;
      }
    );

    // --------------------------------
    // SUCCESS RESPONSE
    // --------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",

        order: {
          id: order.id,
          orderNumber: order.orderNumber,

          customerName:
            order.customerName,

          customerEmail:
            order.customerEmail,

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

          createdAt:
            order.createdAt,

          items: order.items.map(
            (item) => ({
              id: item.id,
              productId:
                item.productId,
              productName:
                item.productName,
              sku: item.sku,
              quantity:
                item.quantity,
              price:
                item.price.toString(),
              total:
                item.total.toString(),
            })
          ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create order";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
