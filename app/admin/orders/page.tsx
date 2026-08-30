"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  Loader2,
  Menu,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

type OrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  quantity: number;
  price: string | number;
  total: string | number;
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
  subtotal: string | number;
  shippingFee: string | number;
  discount: string | number;
  total: string | number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  items: OrderItem[];
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  async function loadOrders(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
      console.error("LOAD ORDERS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrder(
    id: number,
    field: "status" | "paymentStatus",
    value: string
  ) {
    try {
      setUpdating(id);
      setError("");

      const response = await fetch(
        `/api/admin/orders/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [field]: value,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update order"
        );
      }

      setOrders((previous) =>
        previous.map((order) =>
          order.id === id
            ? {
                ...order,
                [field]: value,
              }
            : order
        )
      );
    } catch (error) {
      console.error("UPDATE ORDER ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order"
      );
    } finally {
      setUpdating(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        (order.customerPhone ?? "").includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" ||
        order.paymentStatus === paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
  ]);

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  const paidCount = orders.filter(
    (order) => order.paymentStatus === "PAID"
  ).length;

  function formatMoney(value: string | number) {
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

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusLabel(status: string) {
    return status.replaceAll("_", " ");
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#a47d2e]/[0.06] blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-[#66458b]/[0.045] blur-[150px]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[255px] shrink-0 border-r border-white/[0.07] bg-[#0a0a0a] lg:flex lg:flex-col">
          <div className="flex h-[82px] items-center border-b border-white/[0.07] px-6">
            <Link
              href="/admin"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2dfaa] via-[#c9a85b] to-[#8d6826] text-black shadow-[0_0_35px_rgba(200,169,90,0.15)]">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-tight">
                  BUDGETREE
                </p>

                <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a85b]/60">
                  Admin Studio
                </p>
              </div>
            </Link>
          </div>

          <div className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-[8px] uppercase tracking-[0.25em] text-white/20">
              Workspace
            </p>

            <nav className="space-y-1">
              <NavItem
                href="/admin"
                icon={<Sparkles size={16} />}
                label="Dashboard"
              />

              <NavItem
                href="/admin/orders"
                icon={<ShoppingBag size={16} />}
                label="Orders"
                active
              />

              <NavItem
                href="/admin/products"
                icon={<Package size={16} />}
                label="Products"
              />

              <NavItem
                href="/admin/products/bulk-import"
                icon={<FileText size={16} />}
                label="Bulk Import"
              />

              <NavItem
                href="/admin/customers"
                icon={<Users size={16} />}
                label="Customers"
              />
            </nav>
          </div>

          <div className="border-t border-white/[0.07] p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f1dda7] to-[#9a742e] text-xs font-bold text-black">
                A
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium">
                  Admin Portal
                </p>

                <p className="mt-1 text-[9px] text-white/25">
                  Premium Store
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* HEADER */}
          <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between border-b border-white/[0.07] bg-[#080808]/85 px-5 backdrop-blur-2xl md:px-8">
            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 lg:hidden">
                <Menu size={18} />
              </button>

              <Link
                href="/admin"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white md:flex"
              >
                <ArrowLeft size={17} />
              </Link>

              <div>
                <p className="hidden text-[8px] uppercase tracking-[0.25em] text-[#c9a85b]/60 sm:block">
                  Commerce Control
                </p>

                <h1 className="text-sm font-semibold sm:text-base">
                  Orders
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white">
                <Bell size={16} />

                {pendingCount > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d4b15e] shadow-[0_0_8px_#d4b15e]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => loadOrders(true)}
                disabled={refreshing}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-white/60 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] p-5 md:p-8">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-[30px] border border-[#c9a85b]/15 bg-gradient-to-br from-[#181612] via-[#101010] to-[#0b0b0b] p-7 md:p-9">
              <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-[#c9a85b]/10 blur-[100px]" />

              <div className="relative">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c9a85b]/20 bg-[#c9a85b]/[0.05] px-3 py-1.5 text-[8px] uppercase tracking-[0.2em] text-[#d7bc77]">
                  <Sparkles size={10} />
                  Premium Order Management
                </div>

                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.045em] md:text-5xl">
                      Order{" "}
                      <span className="bg-gradient-to-r from-[#f3e1aa] via-[#c9a85b] to-[#98702c] bg-clip-text text-transparent">
                        Command Center
                      </span>
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/35">
                      Track every order, payment and customer
                      transaction from one premium workspace.
                    </p>
                  </div>

                  <Link
                    href="/admin/products"
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[#f0dda7] to-[#aa8135] px-5 py-3 text-xs font-semibold text-black shadow-[0_10px_35px_rgba(200,169,90,0.12)] transition hover:brightness-110"
                  >
                    <Package size={15} />
                    Products
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* STAT CARDS */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Orders"
                value={orders.length}
                icon={<ShoppingBag size={18} />}
                type="gold"
              />

              <StatCard
                title="Total Revenue"
                value={formatMoney(totalRevenue)}
                icon={<TrendingUp size={18} />}
                type="purple"
              />

              <StatCard
                title="Pending Orders"
                value={pendingCount}
                icon={<Bell size={18} />}
                type="blue"
              />

              <StatCard
                title="Delivered"
                value={deliveredCount}
                icon={<CheckCircle2 size={18} />}
                type="green"
              />
            </div>

            {/* FILTER BAR */}
            <div className="mt-5 rounded-[25px] border border-white/[0.08] bg-[#0e0e0e] p-4 md:p-5">
              <div className="flex flex-col gap-3 xl:flex-row">
                {/* SEARCH */}
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search order number, customer, email..."
                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-11 pr-10 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#c9a85b]/30"
                  />

                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      <XCircle size={15} />
                    </button>
                  )}
                </div>

                {/* STATUS */}
                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    "ALL",
                    ...ORDER_STATUSES,
                  ]}
                />

                {/* PAYMENT */}
                <FilterSelect
                  value={paymentFilter}
                  onChange={setPaymentFilter}
                  options={[
                    "ALL",
                    ...PAYMENT_STATUSES,
                  ]}
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-4">
                <p className="text-[10px] text-white/25">
                  Showing{" "}
                  <span className="text-white/60">
                    {filteredOrders.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-white/60">
                    {orders.length}
                  </span>{" "}
                  orders
                </p>

                <p className="text-[9px] text-white/20">
                  {paidCount} paid orders
                </p>
              </div>
            </div>

            {/* TABLE */}
            <div className="mt-5 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0e0e0e]">
              {error && (
                <div className="m-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-xs text-red-300">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex min-h-[500px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a85b]/20 bg-[#c9a85b]/[0.05]">
                      <Loader2
                        size={24}
                        className="animate-spin text-[#c9a85b]"
                      />
                    </div>

                    <p className="mt-4 text-xs text-white/30">
                      Loading orders...
                    </p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <EmptyOrders />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.015]">
                        <HeaderCell>
                          Order
                        </HeaderCell>

                        <HeaderCell>
                          Customer
                        </HeaderCell>

                        <HeaderCell>
                          Items
                        </HeaderCell>

                        <HeaderCell>
                          Amount
                        </HeaderCell>

                        <HeaderCell>
                          Status
                        </HeaderCell>

                        <HeaderCell>
                          Payment
                        </HeaderCell>

                        <HeaderCell>
                          Date
                        </HeaderCell>

                        <HeaderCell align="right">
                          Action
                        </HeaderCell>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.045]">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="group transition hover:bg-[#c9a85b]/[0.025]"
                        >
                          {/* ORDER */}
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a85b]/10 bg-[#c9a85b]/[0.04] text-[#c9a85b]">
                                <ShoppingBag size={16} />
                              </div>

                              <div>
                                <p className="text-xs font-semibold">
                                  {order.orderNumber}
                                </p>

                                <p className="mt-1 text-[9px] text-white/20">
                                  Order ID #{order.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* CUSTOMER */}
                          <td className="px-5 py-5">
                            <p className="text-xs font-medium">
                              {order.customerName}
                            </p>

                            <p className="mt-1 max-w-[190px] truncate text-[9px] text-white/30">
                              {order.customerEmail}
                            </p>
                          </td>

                          {/* ITEMS */}
                          <td className="px-5 py-5">
                            <p className="text-xs font-medium">
                              {order.items.length}{" "}
                              {order.items.length === 1
                                ? "item"
                                : "items"}
                            </p>

                            <p className="mt-1 max-w-[200px] truncate text-[9px] text-white/20">
                              {order.items
                                .map(
                                  (item) =>
                                    `${item.productName} × ${item.quantity}`
                                )
                                .join(", ")}
                            </p>
                          </td>

                          {/* AMOUNT */}
                          <td className="px-5 py-5">
                            <p className="text-sm font-semibold">
                              {formatMoney(order.total)}
                            </p>

                            <p className="mt-1 text-[9px] text-white/20">
                              Subtotal{" "}
                              {formatMoney(
                                order.subtotal
                              )}
                            </p>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-5">
                            <PremiumSelect
                              value={order.status}
                              disabled={
                                updating === order.id
                              }
                              onChange={(value) =>
                                updateOrder(
                                  order.id,
                                  "status",
                                  value
                                )
                              }
                              options={ORDER_STATUSES}
                            />
                          </td>

                          {/* PAYMENT */}
                          <td className="px-5 py-5">
                            <PremiumSelect
                              value={order.paymentStatus}
                              disabled={
                                updating === order.id
                              }
                              onChange={(value) =>
                                updateOrder(
                                  order.id,
                                  "paymentStatus",
                                  value
                                )
                              }
                              options={PAYMENT_STATUSES}
                              payment
                            />
                          </td>

                          {/* DATE */}
                          <td className="px-5 py-5">
                            <p className="text-xs text-white/60">
                              {formatDate(order.createdAt)}
                            </p>

                            <p className="mt-1 text-[9px] text-white/20">
                              {formatTime(
                                order.createdAt
                              )}
                            </p>
                          </td>

                          {/* ACTION */}
                          <td className="px-5 py-5 text-right">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-[10px] font-medium text-white/50 transition hover:border-[#c9a85b]/25 hover:bg-[#c9a85b]/[0.05] hover:text-[#d8bd77]"
                            >
                              <Eye size={14} />
                              View
                              <ArrowUpRight
                                size={12}
                              />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* BOTTOM */}
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <BottomCard
                title="Order Pipeline"
                value={orders.length}
                text="Total orders in system"
              />

              <BottomCard
                title="Payment Success"
                value={paidCount}
                text="Orders marked as paid"
              />

              <BottomCard
                title="Delivery Rate"
                value={
                  orders.length
                    ? `${Math.round(
                        (deliveredCount /
                          orders.length) *
                          100
                      )}%`
                    : "0%"
                }
                text="Orders successfully delivered"
              />
            </div>

            {/* FOOTER */}
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#0b0b0b] px-5 py-4 text-[9px] text-white/20 sm:flex-row sm:items-center">
              <span>
                Budgetree Premium Commerce Console
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a85b] shadow-[0_0_8px_#c9a85b]" />
                Orders API Connected
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* NAV ITEM */

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition ${
        active
          ? "bg-gradient-to-r from-[#f0dda7] to-[#aa8135] font-semibold text-black shadow-[0_8px_25px_rgba(200,169,90,0.12)]"
          : "text-white/40 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      {icon}

      <span className="flex-1">
        {label}
      </span>

      <ChevronDown
        size={12}
        className={`-rotate-90 ${
          active
            ? "opacity-40"
            : "opacity-0 group-hover:opacity-40"
        }`}
      />
    </Link>
  );
}

/* STAT CARD */

function StatCard({
  title,
  value,
  icon,
  type,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  type: "gold" | "purple" | "blue" | "green";
}) {
  const styles = {
    gold: {
      box: "bg-[#c9a85b]/[0.05]",
      border: "border-[#c9a85b]/15",
      text: "text-[#d7bc77]",
      glow: "bg-[#c9a85b]/10",
    },

    purple: {
      box: "bg-[#8e67b7]/[0.05]",
      border: "border-[#8e67b7]/15",
      text: "text-[#b896d3]",
      glow: "bg-[#8e67b7]/10",
    },

    blue: {
      box: "bg-[#5d8eb5]/[0.05]",
      border: "border-[#5d8eb5]/15",
      text: "text-[#91bad8]",
      glow: "bg-[#5d8eb5]/10",
    },

    green: {
      box: "bg-[#669b78]/[0.05]",
      border: "border-[#669b78]/15",
      text: "text-[#9bcaa9]",
      glow: "bg-[#669b78]/10",
    },
  };

  const s = styles[type];

  return (
    <div
      className={`relative overflow-hidden rounded-[25px] border bg-[#0e0e0e] p-5 ${s.border}`}
    >
      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${s.glow}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${s.border} ${s.box} ${s.text}`}
          >
            {icon}
          </div>

          <ArrowUpRight
            size={14}
            className="text-white/15"
          />
        </div>

        <p className="mt-6 text-[10px] text-white/30">
          {title}
        </p>

        <p className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em]">
          {value}
        </p>
      </div>
    </div>
  );
}

/* FILTER */

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 min-w-[170px] appearance-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 pr-9 text-[10px] uppercase tracking-wider text-white/50 outline-none focus:border-[#c9a85b]/30"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#111] text-white"
          >
            {option === "ALL"
              ? "All"
              : option.replaceAll("_", " ")}
          </option>
        ))}
      </select>

      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/25"
      />
    </div>
  );
}

/* PREMIUM SELECT */

function PremiumSelect({
  value,
  options,
  disabled,
  onChange,
  payment = false,
}: {
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
  payment?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 min-w-[125px] appearance-none rounded-xl border bg-white/[0.025] px-3 pr-8 text-[9px] uppercase tracking-wide outline-none transition disabled:opacity-50 ${
          payment
            ? "border-[#8e67b7]/15 text-[#b896d3]"
            : "border-[#c9a85b]/15 text-[#d7bc77]"
        }`}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#111] text-white"
          >
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>

      <ChevronDown
        size={11}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20"
      />
    </div>
  );
}

/* HEADER CELL */

function HeaderCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-4 text-${align} text-[8px] font-medium uppercase tracking-[0.18em] text-white/25`}
    >
      {children}
    </th>
  );
}

/* EMPTY */

function EmptyOrders() {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c9a85b]/10 bg-[#c9a85b]/[0.04]">
        <ShoppingBag
          size={28}
          className="text-[#c9a85b]/40"
        />
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        No orders found
      </h3>

      <p className="mt-2 max-w-md text-xs leading-6 text-white/25">
        No orders match your current search or filters.
        Try clearing the filters or wait for a new
        customer order.
      </p>
    </div>
  );
}

/* BOTTOM CARD */

function BottomCard({
  title,
  value,
  text,
}: {
  title: string;
  value: string | number;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-[#0e0e0e] p-5">
      <p className="text-[9px] uppercase tracking-[0.18em] text-[#c9a85b]/50">
        {title}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-white/25">
        {text}
      </p>
    </div>
  );
}