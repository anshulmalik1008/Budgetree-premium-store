import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export default async function AdminDashboard() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role === "CUSTOMER") {
    redirect("/admin/login");
  }

  const [
    products,
    customers,
    ordersCount,
    revenueData,
    recentOrders,
    pendingOrders,
    deliveredOrders,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.user.count({
      where: {
        role: "CUSTOMER",
      },
    }),

    prisma.order.count(),

    prisma.order.aggregate({
      _sum: {
        total: true,
      },
    }),

    prisma.order.findMany({
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),

    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        status: "DELIVERED",
      },
    }),
  ]);

  const revenue = Number(revenueData._sum.total ?? 0);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-[265px] shrink-0 border-r border-white/[0.07] bg-[#0b0b0b] lg:flex lg:flex-col">

          {/* BRAND */}
          <div className="flex h-[84px] items-center border-b border-white/[0.07] px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5e6b3] via-[#c8a95a] to-[#8d6b28] text-black shadow-[0_0_30px_rgba(200,169,90,0.18)]">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-[15px] font-semibold tracking-tight">
                  BUDGETREE
                </p>

                <p className="text-[9px] uppercase tracking-[0.28em] text-[#c8a95a]/60">
                  Premium Store
                </p>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-[9px] uppercase tracking-[0.22em] text-white/25">
              Workspace
            </p>

            <nav className="space-y-1">
              <SidebarItem
                href="/admin"
                icon={<LayoutDashboard size={17} />}
                label="Dashboard"
                active
              />

              <SidebarItem
                href="/admin/orders"
                icon={<ShoppingBag size={17} />}
                label="Orders"
              />

              <SidebarItem
                href="/admin/products"
                icon={<Package size={17} />}
                label="Products"
              />

              <SidebarItem
                href="/admin/products/bulk-import"
                icon={<FileSpreadsheet size={17} />}
                label="Bulk Import"
              />

              <SidebarItem
                href="/admin/categories"
                icon={<Boxes size={17} />}
                label="Categories"
              />

              <SidebarItem
                href="/admin/customers"
                icon={<Users size={17} />}
                label="Customers"
              />

              <SidebarItem
                href="/admin/analytics"
                icon={<BarChart3 size={17} />}
                label="Analytics"
              />
            </nav>

            <p className="mb-3 mt-9 px-3 text-[9px] uppercase tracking-[0.22em] text-white/25">
              System
            </p>

            <SidebarItem
              href="/admin/settings"
              icon={<Settings size={17} />}
              label="Settings"
            />
          </div>

          {/* USER */}
          <div className="border-t border-white/[0.07] p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5e6b3] to-[#a47d2e] text-xs font-bold text-black">
                {user.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {user.name}
                </p>

                <p className="truncate text-[10px] text-white/30">
                  {user.email}
                </p>
              </div>

              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={14} />
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <section className="min-w-0 flex-1">

          {/* TOP BAR */}
          <header className="flex h-[84px] items-center justify-between border-b border-white/[0.07] bg-[#090909]/90 px-5 backdrop-blur-xl md:px-8">

            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 lg:hidden">
                <Menu size={18} />
              </button>

              <div>
                <p className="hidden text-[9px] uppercase tracking-[0.25em] text-[#c8a95a]/60 sm:block">
                  Executive Control
                </p>

                <h1 className="text-sm font-semibold sm:text-base">
                  Dashboard
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 transition hover:bg-white/5">
                <Bell size={17} className="text-white/60" />

                {pendingOrders > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d7b45c] shadow-[0_0_8px_#d7b45c]" />
                )}
              </button>

              <Link
                href="/admin/products"
                className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#f1dfaa] via-[#c9a85b] to-[#a47b2e] px-4 py-2.5 text-xs font-semibold text-black shadow-[0_8px_30px_rgba(200,169,90,0.12)] transition hover:brightness-110 sm:flex"
              >
                <Plus size={15} />
                Add Product
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] p-5 md:p-8">

            {/* HERO */}
            <div className="relative overflow-hidden rounded-[32px] border border-[#c8a95a]/15 bg-gradient-to-br from-[#191713] via-[#101010] to-[#0a0a0a] p-7 shadow-[0_25px_80px_rgba(0,0,0,0.35)] md:p-10">

              <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-[#c8a95a]/10 blur-[100px]" />

              <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#6f4ea1]/10 blur-[100px]" />

              <div className="relative">

                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c8a95a]/20 bg-[#c8a95a]/[0.06] px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-[#d8bd78]">
                  <Activity size={11} />
                  Live Store Command Center
                </div>

                <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

                  <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.045em] md:text-5xl">
                      Welcome back,{" "}
                      <span className="bg-gradient-to-r from-[#f4e4b5] to-[#9e7931] bg-clip-text text-transparent">
                        {user.name?.split(" ")[0]}
                      </span>
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40">
                      Your premium commerce operations, orders,
                      products and revenue — all from one place.
                    </p>
                  </div>

                  <Link
                    href="/admin/orders"
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#c8a95a]/20 bg-[#c8a95a]/[0.06] px-5 py-3 text-xs font-medium text-[#d8bd78] transition hover:bg-[#c8a95a]/10"
                  >
                    <ShoppingBag size={15} />
                    View Orders
                    <ArrowRight size={14} />
                  </Link>

                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <PremiumStat
                title="Products"
                value={products.toLocaleString("en-IN")}
                icon={<Package size={18} />}
                accent="gold"
              />

              <PremiumStat
                title="Customers"
                value={customers.toLocaleString("en-IN")}
                icon={<Users size={18} />}
                accent="purple"
              />

              <PremiumStat
                title="Orders"
                value={ordersCount.toLocaleString("en-IN")}
                icon={<ShoppingBag size={18} />}
                accent="blue"
              />

              <PremiumStat
                title="Total Revenue"
                value={`₹${revenue.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}`}
                icon={<CircleDollarSign size={18} />}
                accent="green"
              />

            </div>

            {/* ANALYTICS + ORDERS */}
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">

              {/* REVENUE */}
              <div className="rounded-[28px] border border-white/[0.08] bg-[#0f0f0f] p-6 md:p-7">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#c8a95a]/50">
                      Financial Overview
                    </p>

                    <h3 className="mt-2 text-lg font-semibold">
                      Revenue
                    </h3>

                    <p className="mt-1 text-xs text-white/25">
                      Lifetime revenue from orders
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#c8a95a]/15 bg-[#c8a95a]/[0.05] px-3 py-2">
                    <CircleDollarSign
                      size={16}
                      className="text-[#c8a95a]"
                    />
                  </div>

                </div>

                <div className="mt-8 rounded-2xl border border-white/[0.05] bg-[#0a0a0a] p-6">

                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                    Total Revenue
                  </p>

                  <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
                    ₹
                    {revenue.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </p>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#8d6b28] via-[#d7b45c] to-[#f2dfa8]" />
                  </div>

                  <div className="mt-4 flex justify-between text-[10px] text-white/25">
                    <span>Store Revenue</span>
                    <span>Live from PostgreSQL</span>
                  </div>

                </div>

                {/* MINI METRICS */}
                <div className="mt-4 grid grid-cols-2 gap-3">

                  <MiniMetric
                    title="Pending"
                    value={pendingOrders}
                  />

                  <MiniMetric
                    title="Delivered"
                    value={deliveredOrders}
                  />

                </div>
              </div>

              {/* RECENT ORDERS */}
              <div className="rounded-[28px] border border-white/[0.08] bg-[#0f0f0f] p-6 md:p-7">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#c8a95a]/50">
                      Commerce
                    </p>

                    <h3 className="mt-2 text-lg font-semibold">
                      Recent Orders
                    </h3>
                  </div>

                  <Link
                    href="/admin/orders"
                    className="text-[10px] text-white/30 transition hover:text-[#d7b45c]"
                  >
                    View all
                  </Link>

                </div>

                <div className="mt-5 space-y-2">

                  {recentOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/[0.08] px-5 py-10 text-center">
                      <ShoppingBag
                        size={28}
                        className="mx-auto text-white/10"
                      />

                      <p className="mt-3 text-xs text-white/30">
                        No orders yet
                      </p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="group flex items-center gap-3 rounded-2xl border border-white/[0.045] bg-white/[0.02] p-3 transition hover:border-[#c8a95a]/20 hover:bg-[#c8a95a]/[0.025]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-[#c8a95a]">
                          <ShoppingBag size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {order.customerName}
                          </p>

                          <p className="mt-1 truncate text-[9px] text-white/25">
                            {order.orderNumber}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-medium">
                            ₹
                            {Number(order.total).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <OrderStatus status={order.status} />
                        </div>

                        <ChevronRight
                          size={13}
                          className="text-white/15 transition group-hover:translate-x-1 group-hover:text-[#c8a95a]"
                        />
                      </Link>
                    ))
                  )}

                </div>
              </div>
            </div>

            {/* LOWER PANELS */}
            <div className="mt-5 grid gap-5 lg:grid-cols-3">

              <DashboardPanel
                title="Product Management"
                subtitle="Manage your complete catalogue"
                icon={<Package size={17} />}
              >
                <PanelLink
                  href="/admin/products"
                  text="Manage Products"
                />

                <PanelLink
                  href="/admin/products/bulk-import"
                  text="Bulk Catalogue Import"
                />
              </DashboardPanel>

              <DashboardPanel
                title="Customer Management"
                subtitle="Customer database overview"
                icon={<Users size={17} />}
              >
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                    Total Customers
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {customers.toLocaleString("en-IN")}
                  </p>
                </div>

                <PanelLink
                  href="/admin/customers"
                  text="Open Customers"
                />
              </DashboardPanel>

              <DashboardPanel
                title="System Status"
                subtitle="Core services"
                icon={<Activity size={17} />}
              >
                <SystemRow
                  name="PostgreSQL"
                  status="Connected"
                />

                <SystemRow
                  name="Prisma"
                  status="Connected"
                />

                <SystemRow
                  name="Orders API"
                  status="Operational"
                />

                <SystemRow
                  name="Bulk Import"
                  status="Operational"
                />
              </DashboardPanel>

            </div>

            {/* FOOTER */}
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#0c0c0c] px-5 py-4 text-[10px] text-white/25 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8a95a] shadow-[0_0_8px_#c8a95a]" />
                Budgetree Premium Admin
              </div>

              <span>
                {ordersCount} orders · ₹
                {revenue.toLocaleString("en-IN")} revenue
              </span>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}

/* SIDEBAR */

function SidebarItem({
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
          ? "bg-gradient-to-r from-[#f1dfaa] to-[#b48a39] text-black shadow-[0_8px_25px_rgba(200,169,90,0.12)]"
          : "text-white/45 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      {icon}

      <span className="flex-1">
        {label}
      </span>

      {!active && (
        <ChevronRight
          size={13}
          className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-50"
        />
      )}
    </Link>
  );
}

/* STAT */

function PremiumStat({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: "gold" | "purple" | "blue" | "green";
}) {
  const accentClasses = {
    gold:
      "from-[#f3df9d]/20 to-[#8e6b2b]/5 text-[#d8bd78]",
    purple:
      "from-[#b695dc]/20 to-[#67408f]/5 text-[#b695dc]",
    blue:
      "from-[#8eb9df]/20 to-[#3f6485]/5 text-[#8eb9df]",
    green:
      "from-[#9bc9aa]/20 to-[#477455]/5 text-[#9bc9aa]",
  };

  return (
    <div className="group relative overflow-hidden rounded-[25px] border border-white/[0.08] bg-[#0f0f0f] p-5 transition hover:-translate-y-1 hover:border-white/[0.14]">
      <div
        className={`absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl ${accentClasses[accent]}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accentClasses[accent]}`}
          >
            {icon}
          </div>

          <span className="text-[8px] uppercase tracking-[0.15em] text-white/20">
            Live
          </span>
        </div>

        <p className="mt-6 text-[10px] text-white/35">
          {title}
        </p>

        <p className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em]">
          {value}
        </p>
      </div>
    </div>
  );
}

/* MINI */

function MiniMetric({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
      <p className="text-[9px] uppercase tracking-[0.15em] text-white/25">
        {title}
      </p>

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}

/* STATUS */

function OrderStatus({
  status,
}: {
  status: string;
}) {
  const label = status.replaceAll("_", " ");

  return (
    <span className="mt-1 inline-flex rounded-full border border-[#c8a95a]/15 bg-[#c8a95a]/[0.05] px-2 py-0.5 text-[8px] uppercase tracking-wider text-[#c8a95a]">
      {label}
    </span>
  );
}

/* PANEL */

function DashboardPanel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-white/[0.08] bg-[#0f0f0f] p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c8a95a]/[0.06] text-[#c8a95a]">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-[10px] text-white/25">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {children}
      </div>
    </div>
  );
}

/* PANEL LINK */

function PanelLink({
  href,
  text,
}: {
  href: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-[11px] text-white/50 transition hover:border-[#c8a95a]/20 hover:bg-[#c8a95a]/[0.04] hover:text-white"
    >
      {text}

      <ArrowRight
        size={13}
        className="text-white/20 transition group-hover:translate-x-1 group-hover:text-[#c8a95a]"
      />
    </Link>
  );
}

/* SYSTEM */

function SystemRow({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
      <span className="text-[11px] text-white/40">
        {name}
      </span>

      <span className="flex items-center gap-1.5 text-[9px] text-[#9bc9aa]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#9bc9aa] shadow-[0_0_7px_#9bc9aa]" />
        {status}
      </span>
    </div>
  );
}
