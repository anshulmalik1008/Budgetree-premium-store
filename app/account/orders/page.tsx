import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  ShoppingBag,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/customer-auth";

export default async function OrdersPage() {
  const userId = await getCurrentCustomerId();

  // Customer login nahi hai
  if (!userId) {
    redirect("/auth/login?redirect=/account/orders");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // Invalid / non-customer account
  if (!user || user.role !== "CUSTOMER") {
    redirect("/auth/login?redirect=/account/orders");
  }

  // REAL CUSTOMER ORDERS
  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
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
              },
            },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#fffaf5] text-[#222]">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#eadfd5] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm text-[#555]"
          >
            <ArrowLeft size={17} />
            Back to Store
          </Link>

          <Link
            href="/"
            className="text-xl font-semibold tracking-[-0.05em]"
          >
            BPS
          </Link>

          <Link
            href="/account"
            className="text-xs font-medium text-[#8d5f3c] hover:underline"
          >
            My Account
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
        {/* TITLE */}

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#b47b45]">
            My Account
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
            My Orders
          </h1>

          <p className="mt-3 text-sm text-[#777]">
            Welcome back, {user.name}.
          </p>
        </div>

        {/* ORDERS */}

        {orders.length === 0 ? (
          <div className="mt-12 rounded-[28px] border border-[#eadfd5] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4e9]">
              <ShoppingBag
                size={27}
                className="text-[#b47b45]"
              />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#888]">
              You haven&apos;t placed any orders yet. Explore our
              collection and find something special.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-[#b47b45] px-6 text-xs font-medium text-white transition hover:bg-[#996438]"
            >
              Start Shopping
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {orders.map((order) => {
              const orderDate = new Date(
                order.createdAt
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-[28px] border border-[#eadfd5] bg-white shadow-sm"
                >
                  {/* ORDER TOP */}

                  <div className="flex flex-col gap-5 border-b border-[#eee5dd] p-5 md:flex-row md:items-center md:justify-between md:p-7">
                    <div className="flex flex-wrap gap-x-10 gap-y-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-[#999]">
                          Order
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          #{order.orderNumber}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-[#999]">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {orderDate}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-[#999]">
                          Total
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          ₹
                          {Number(order.total).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />

                      <Link
                        href={`/track-order?order=${encodeURIComponent(
                          order.orderNumber
                        )}`}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfd1c5] px-4 text-[11px] font-medium text-[#795437] transition hover:bg-[#fff8f1]"
                      >
                        Track
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* PRODUCTS */}

                  <div className="divide-y divide-[#eee5dd]">
                    {order.items.map((item) => {
                      const image =
                        item.product?.images?.[0]?.url;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-5 md:p-6"
                        >
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#faf5f0]">
                            {image ? (
                              <img
                                src={image}
                                alt={item.productName}
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <Package
                                size={25}
                                className="text-[#c7a98d]"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.productName}
                            </p>

                            <p className="mt-1 text-xs text-[#999]">
                              Qty: {item.quantity}
                            </p>

                            <p className="mt-1 text-xs text-[#999]">
                              ₹
                              {Number(
                                item.price
                              ).toLocaleString("en-IN")}{" "}
                              each
                            </p>
                          </div>

                          <p className="text-sm font-semibold">
                            ₹
                            {Number(
                              item.total
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* BOTTOM */}

                  <div className="flex flex-wrap items-center justify-between gap-4 bg-[#fffaf5] px-5 py-4 md:px-7">
                    <div className="flex items-center gap-2 text-xs text-[#777]">
                      <span>
                        Payment:
                      </span>

                      <span className="font-medium text-[#555]">
                        {order.paymentStatus}
                      </span>
                    </div>

                    <Link
                      href={`/order-success/${order.id}`}
                      className="text-xs font-medium text-[#a66f43] hover:underline"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================
   STATUS
========================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
  };

  return (
    <span className="rounded-full bg-[#f5eee8] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8d5f3c]">
      {labels[status] || status}
    </span>
  );
}
