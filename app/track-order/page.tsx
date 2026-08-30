"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

type OrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  quantity: number;
  price: string;
  total: string;
  image: string | null;
};

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  subtotal: string;
  shippingFee: string;
  discount: string;
  total: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

const steps = [
  {
    key: "PENDING",
    title: "Order Placed",
    description: "Your order has been received",
    icon: Clock3,
  },
  {
    key: "CONFIRMED",
    title: "Confirmed",
    description: "Your order has been confirmed",
    icon: Check,
  },
  {
    key: "PROCESSING",
    title: "Processing",
    description: "Your gift is being prepared",
    icon: Package,
  },
  {
    key: "SHIPPED",
    title: "Shipped",
    description: "Your order is on the way",
    icon: Truck,
  },
  {
    key: "DELIVERED",
    title: "Delivered",
    description: "Order delivered successfully",
    icon: Check,
  },
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");

  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrack(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setOrder(null);

    if (!orderNumber.trim()) {
      setError("Please enter your order number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Order not found.");
        return;
      }

      setOrder(data.order);
    } catch (err) {
      console.error("TRACK ORDER FRONTEND ERROR:", err);
      setError("Unable to track order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#191919]">
      {/* TOP BAR */}

      <div className="bg-[#202020] px-4 py-2 text-center text-[10px] font-medium tracking-[0.18em] text-white/70">
        PREMIUM GIFTS • THOUGHTFULLY CURATED • DELIVERED WITH CARE
      </div>

      {/* NAVBAR */}

      <header className="border-b border-black/[0.07] bg-[#f7f5f0]">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-semibold tracking-[-0.06em]">
              BPS
            </span>

            <span className="text-[7px] uppercase tracking-[0.28em] text-black/35">
              Budgetree Premium Store
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-xs md:flex">
            <Link
              href="/"
              className="text-black/55 transition hover:text-black"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="text-black/55 transition hover:text-black"
            >
              Shop
            </Link>

            <Link
              href="/wishlist"
              className="text-black/55 transition hover:text-black"
            >
              Wishlist
            </Link>

            <Link
              href="/track-order"
              className="font-medium text-[#e85d04]"
            >
              Track Order
            </Link>
          </nav>

          <Link
            href="/shop"
            className="flex items-center gap-2 rounded-full bg-[#e85d04] px-5 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#d95300]"
          >
            Shop Now
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* HERO */}

      <section className="border-b border-black/[0.06] bg-[#fffdf9]">
        <div className="mx-auto max-w-[900px] px-5 py-20 text-center md:py-28">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#e85d04]">
            Order Tracking
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] md:text-6xl">
            Where is my order?
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-black/45">
            Enter your order number below to see the latest status of
            your premium gift delivery.
          </p>

          {/* TRACK FORM */}

          <form
            onSubmit={handleTrack}
            className="mx-auto mt-10 max-w-2xl"
          >
            <div className="rounded-[26px] border border-black/[0.08] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={orderNumber}
                  onChange={(e) =>
                    setOrderNumber(e.target.value)
                  }
                  placeholder="Order number"
                  className="h-12 rounded-2xl border border-black/[0.08] bg-[#faf9f6] px-4 text-xs outline-none transition placeholder:text-black/30 focus:border-[#e85d04]"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Email (optional)"
                  className="h-12 rounded-2xl border border-black/[0.08] bg-[#faf9f6] px-4 text-xs outline-none transition placeholder:text-black/30 focus:border-[#e85d04]"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#e85d04] px-6 text-xs font-semibold text-white transition hover:bg-[#d95300] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search size={14} />

                  {loading ? "Tracking..." : "Track Order"}
                </button>
              </div>
            </div>
          </form>

          {/* ERROR */}

          {error && (
            <div className="mx-auto mt-5 flex max-w-2xl items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
              <XCircle size={15} />
              {error}
            </div>
          )}
        </div>
      </section>

      {/* ORDER RESULT */}

      {order && (
        <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-8">
          {/* ORDER HEADER */}

          <div className="flex flex-col justify-between gap-5 rounded-[28px] border border-black/[0.07] bg-white p-6 md:flex-row md:items-center md:p-8">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
                Order
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                {order.orderNumber}
              </h2>

              <p className="mt-2 text-xs text-black/40">
                Placed on{" "}
                {new Date(
                  order.createdAt
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-[9px] uppercase tracking-[0.2em] text-black/35">
                Order Total
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {formatPrice(order.total)}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-50 text-green-600"
                    : "bg-orange-50 text-[#e85d04]"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* STATUS TIMELINE */}

          <div className="mt-5 rounded-[28px] border border-black/[0.07] bg-white p-6 md:p-10">
            <div className="mb-8">
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#e85d04]">
                Delivery Status
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Your order journey
              </h2>
            </div>

            <OrderTimeline status={order.status} />
          </div>

          {/* PRODUCTS */}

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="rounded-[28px] border border-black/[0.07] bg-white p-6 md:p-8">
              <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
                Your Items
              </p>

              <div className="mt-6 divide-y divide-black/[0.06]">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f3ee]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <Package
                          size={25}
                          className="text-black/20"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium">
                        {item.productName}
                      </h3>

                      {item.sku && (
                        <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-black/30">
                          SKU: {item.sku}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-black/40">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-semibold">
                      {formatPrice(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMARY */}

            <div className="h-fit rounded-[28px] border border-black/[0.07] bg-white p-6 md:p-8">
              <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
                Order Summary
              </p>

              <div className="mt-6 space-y-4 text-xs">
                <SummaryRow
                  label="Subtotal"
                  value={formatPrice(order.subtotal)}
                />

                <SummaryRow
                  label="Shipping"
                  value={
                    Number(order.shippingFee) === 0
                      ? "FREE"
                      : formatPrice(order.shippingFee)
                  }
                />

                {Number(order.discount) > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`-${formatPrice(order.discount)}`}
                  />
                )}

                <div className="border-t border-black/[0.07] pt-4">
                  <SummaryRow
                    label="Total"
                    value={formatPrice(order.total)}
                    strong
                  />
                </div>
              </div>

              {/* ADDRESS */}

              {(order.shippingAddress ||
                order.city ||
                order.pincode) && (
                <div className="mt-8 border-t border-black/[0.07] pt-6">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-black/35">
                    Delivery Address
                  </p>

                  <p className="mt-3 text-xs leading-6 text-black/55">
                    {order.shippingAddress}
                    <br />
                    {order.city}
                    {order.state
                      ? `, ${order.state}`
                      : ""}
                    {order.pincode
                      ? ` - ${order.pincode}`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ACTION */}

          <div className="mt-8 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#e85d04] px-7 py-3.5 text-xs font-semibold text-white transition hover:bg-[#d95300]"
            >
              Continue Shopping
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* EMPTY STATE */}

      {!order && !loading && !error && (
        <section className="mx-auto max-w-[900px] px-5 py-16">
          <div className="rounded-[30px] border border-black/[0.06] bg-white px-6 py-14 text-center">
            <Package
              size={40}
              strokeWidth={1}
              className="mx-auto text-[#e85d04]/50"
            />

            <h3 className="mt-5 text-lg font-semibold">
              Track your premium delivery
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-black/40">
              Enter your order number above and we&apos;ll show
              you the latest information about your order.
            </p>
          </div>
        </section>
      )}

      {/* FOOTER */}

      <footer className="mt-10 border-t border-black/[0.07] bg-[#202020] text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 px-5 py-10 md:flex-row md:items-center md:px-8">
          <div>
            <p className="text-lg font-semibold tracking-[-0.04em]">
              BPS
            </p>

            <p className="mt-1 text-[7px] uppercase tracking-[0.3em] text-white/30">
              Budgetree Premium Store
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-[10px] text-white/40">
            <Link
              href="/shop"
              className="transition hover:text-white"
            >
              Shop
            </Link>

            <Link
              href="/wishlist"
              className="transition hover:text-white"
            >
              Wishlist
            </Link>

            <Link
              href="/track-order"
              className="text-[#e85d04]"
            >
              Track Order
            </Link>

            <Link
              href="/account"
              className="transition hover:text-white"
            >
              Account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// =================================
// TIMELINE
// =================================

function OrderTimeline({
  status,
}: {
  status: string;
}) {
  if (
    status === "CANCELLED" ||
    status === "REFUNDED"
  ) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <div className="flex items-center gap-3 text-red-600">
          <XCircle size={22} />

          <div>
            <p className="text-sm font-semibold">
              Order {status.toLowerCase()}
            </p>

            <p className="mt-1 text-xs text-red-500/70">
              Please contact support if you need assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = steps.findIndex(
    (step) => step.key === status
  );

  return (
    <div className="relative">
      <div className="hidden md:block">
        <div className="absolute left-[8%] right-[8%] top-6 h-px bg-black/[0.08]" />

        <div
          className="absolute left-[8%] top-6 h-px bg-[#e85d04] transition-all duration-500"
          style={{
            width:
              currentIndex <= 0
                ? "0%"
                : `${(currentIndex / (steps.length - 1)) * 84}%`,
          }}
        />
      </div>

      <div className="grid gap-7 md:grid-cols-5 md:gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          const completed =
            index <= currentIndex;

          const current =
            index === currentIndex;

          return (
            <div
              key={step.key}
              className="relative text-center"
            >
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 transition ${
                  completed
                    ? "border-[#e85d04] bg-[#e85d04] text-white"
                    : "border-black/10 bg-white text-black/25"
                } ${
                  current
                    ? "ring-4 ring-[#e85d04]/10"
                    : ""
                }`}
              >
                <Icon size={17} />
              </div>

              <p
                className={`mt-3 text-xs font-semibold ${
                  completed
                    ? "text-black"
                    : "text-black/30"
                }`}
              >
                {step.title}
              </p>

              <p className="mx-auto mt-1 max-w-[130px] text-[9px] leading-4 text-black/35">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =================================
// SUMMARY ROW
// =================================

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "font-semibold text-black"
            : "text-black/45"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-base font-semibold"
            : "font-medium text-black"
        }
      >
        {value}
      </span>
    </div>
  );
}

// =================================
// PRICE
// =================================

function formatPrice(value: string | number) {
  const number = Number(value) || 0;

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}
