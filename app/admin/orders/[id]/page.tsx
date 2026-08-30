"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  IndianRupee,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  subtotal: string | number;
  shippingFee: string | number;
  discount: string | number;
  total: string | number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  items: {
    id: number;
    productName: string;
    quantity: number;
    price: string | number;
    total: string | number;
  }[];
};

const ORDER_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PAYMENT_STATUSES = [
  "ALL",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

function money(value: string | number) {
  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(status: string) {
  switch (status) {
    case "DELIVERED":
    case "PAID":
      return "border-green-200 bg-green-50 text-green-700";

    case "CANCELLED":
    case "FAILED":
    case "REFUNDED":
      return "border-red-200 bg-red-50 text-red-700";

    case "SHIPPED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "CONFIRMED":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");

  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load orders"
        );
      }

      setOrders(data.orders ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber
          .toLowerCase()
          .includes(query) ||
        order.customerName
          .toLowerCase()
          .includes(query) ||
        order.customerEmail
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        status === "ALL" ||
        order.status === status;

      const matchesPayment =
        paymentStatus === "ALL" ||
        order.paymentStatus === paymentStatus;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [orders, search, status, paymentStatus]);

  const totalSales = orders
    .filter(
      (order) =>
        order.status !== "CANCELLED" &&
        order.status !== "REFUNDED"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-xl font-semibold">
                Orders
              </h1>

              <p className="text-xs text-gray-500">
                Manage your store orders
              </p>
            </div>
          </div>

          <Link
            href="/admin/orders/new"
            className="flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + New Order
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={orders.length}
            icon={<ShoppingBag size={19} />}
          />

          <StatCard
            title="Total Sales"
            value={money(totalSales)}
            icon={<IndianRupee size={19} />}
          />

          <StatCard
            title="Pending"
            value={pendingOrders}
            icon={<Clock3 size={19} />}
          />

          <StatCard
            title="Delivered"
            value={deliveredOrders}
            icon={<CheckCircle2 size={19} />}
          />
        </div>

        {/* MAIN CARD */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
          {/* TOP */}
          <div className="border-b border-black/10 p-6 lg:p-7">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                  Store Management
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  All Orders
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredOrders.length} order
                  {filteredOrders.length === 1
                    ? ""
                    : "s"} shown
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search order or customer..."
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-11 pr-4 text-sm outline-none transition focus:border-black/30"
                />
              </div>
            </div>

            {/* FILTERS */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
              >
                {ORDER_STATUSES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    Status: {label(item)}
                  </option>
                ))}
              </select>

              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value)
                }
                className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
              >
                {PAYMENT_STATUSES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    Payment: {label(item)}
                  </option>
                ))}
              </select>

              {(search ||
                status !== "ALL" ||
                paymentStatus !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatus("ALL");
                    setPaymentStatus("ALL");
                  }}
                  className="h-11 rounded-xl border border-black/10 px-4 text-sm font-medium transition hover:bg-gray-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Loader2
                  size={22}
                  className="animate-spin"
                />
                Loading orders...
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <Package
                size={42}
                className="text-gray-300"
              />

              <h3 className="mt-4 font-semibold">
                No orders found
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/10 bg-[#fafafa] text-left">
                      <th className="px-7 py-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Order
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Items
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Total
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Payment
                      </th>

                      <th className="px-7 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/5">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-[#fafafa]"
                      >
                        <td className="px-7 py-5">
                          <p className="font-semibold">
                            {order.orderNumber}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(
                              order.createdAt
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="text-sm font-medium">
                            {order.customerName}
                          </p>

                          <p className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
                            {order.customerEmail}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {order.items.reduce(
                              (sum, item) =>
                                sum + item.quantity,
                              0
                            )}{" "}
                            item
                            {order.items.reduce(
                              (sum, item) =>
                                sum + item.quantity,
                              0
                            ) === 1
                              ? ""
                              : "s"}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {money(order.total)}
                          </p>

                          {order.paymentMethod && (
                            <p className="mt-1 text-xs text-gray-400">
                              {order.paymentMethod}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                              order.status
                            )}`}
                          >
                            {label(order.status)}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                              order.paymentStatus
                            )}`}
                          >
                            {label(
                              order.paymentStatus
                            )}
                          </span>
                        </td>

                        <td className="px-7 py-5 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-medium transition hover:bg-gray-100"
                          >
                            <Eye size={14} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}
              <div className="divide-y divide-black/5 md:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>

                      <p className="font-semibold">
                        {money(order.total)}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium">
                        {order.customerName}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {order.customerEmail}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                          order.status
                        )}`}
                      >
                        {label(order.status)}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                          order.paymentStatus
                        )}`}
                      >
                        {label(
                          order.paymentStatus
                        )}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {order.items.reduce(
                          (sum, item) =>
                            sum + item.quantity,
                          0
                        )}{" "}
                        items
                      </span>
                    </div>

                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-medium transition hover:bg-gray-100"
                    >
                      <Eye size={15} />
                      View Order
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {title}
          </p>

          <p className="mt-3 text-2xl font-semibold">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}
