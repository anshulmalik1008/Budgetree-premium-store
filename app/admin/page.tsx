// app/admin/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  BarChart3,
  Settings,
  FileSpreadsheet,
  Plus,
  Bell,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type DashboardData = {
  products: number;
  siripayProducts: number;
  categories: number;
  customers: number;
  orders: number;
  siripayConnected: boolean;
};

export default function AdminPage() {
  const [data, setData] = useState<DashboardData>({
    products: 0,
    siripayProducts: 0,
    categories: 0,
    customers: 0,
    orders: 0,
    siripayConnected: false,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products?limit=100", {
            cache: "no-store",
          }),
          fetch("/api/categories", {
            cache: "no-store",
          }),
        ]);

        const productsJson = productsRes.ok
          ? await productsRes.json()
          : {};

        const categoriesJson = categoriesRes.ok
          ? await categoriesRes.json()
          : {};

        const products = Array.isArray(productsJson?.products)
          ? productsJson.products
          : Array.isArray(productsJson?.data)
            ? productsJson.data
            : [];

        const categories = Array.isArray(
          categoriesJson?.categories
        )
          ? categoriesJson.categories
          : Array.isArray(categoriesJson?.data)
            ? categoriesJson.data
            : [];

        setData({
          products: products.length,
          siripayProducts:
            productsJson?.source === "SIRIPAY"
              ? products.length
              : 0,
          categories: categories.length,
          customers: 0,
          orders: 0,
          siripayConnected:
            productsJson?.source === "SIRIPAY" ||
            productsJson?.siripayConnected === true,
        });
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f8f1] text-[#17261c]">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-[260px] shrink-0 border-r border-[#dfe8dc] bg-white lg:flex lg:flex-col">

          <div className="flex h-[84px] items-center border-b border-[#e4ebe1] px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08783b] text-white">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-[15px] font-bold text-[#075d32]">
                  BUDGETREE
                </p>

                <p className="text-[9px] uppercase tracking-[0.28em] text-[#78907d]">
                  Premium Store
                </p>
              </div>

            </div>

          </div>

          <div className="flex-1 px-4 py-6">

            <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8ca08d]">
              Workspace
            </p>

            <nav className="space-y-1">

              <SideItem
                href="/admin"
                icon={<LayoutDashboard size={17} />}
                label="Dashboard"
                active
              />

              <SideItem
                href="/admin/orders"
                icon={<ShoppingBag size={17} />}
                label="Orders"
              />

              <SideItem
                href="/admin/products"
                icon={<Package size={17} />}
                label="Products"
              />

              <SideItem
                href="/admin/products/bulk-import"
                icon={<FileSpreadsheet size={17} />}
                label="Bulk Import"
              />

              <SideItem
                href="/admin/categories"
                icon={<Boxes size={17} />}
                label="Categories"
              />

              <SideItem
                href="/admin/customers"
                icon={<Users size={17} />}
                label="Customers"
              />

              <SideItem
                href="/admin/analytics"
                icon={<BarChart3 size={17} />}
                label="Analytics"
              />

              <SideItem
                href="/admin/external-api"
                icon={<Settings size={17} />}
                label="API Settings"
              />

            </nav>

            <p className="mb-3 mt-9 px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8ca08d]">
              System
            </p>

            <SideItem
              href="/admin/settings"
              icon={<Settings size={17} />}
              label="Settings"
            />

          </div>

          <div className="border-t border-[#e4ebe1] p-4">

            <Link
              href="/api/admin/logout"
              className="flex items-center gap-3 rounded-xl bg-[#f6f9f4] p-3 text-xs font-semibold text-[#68786d] hover:text-[#08783b]"
            >
              <LogOut size={16} />
              Logout
            </Link>

          </div>

        </aside>

        {/* MAIN */}

        <section className="min-w-0 flex-1">

          {/* HEADER */}

          <header className="flex h-[84px] items-center justify-between border-b border-[#dfe8dc] bg-white px-5 md:px-8">

            <div>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.25em] text-[#78907d] sm:block">
                EXECUTIVE CONTROL
              </p>

              <h1 className="text-base font-bold">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden items-center gap-2 rounded-full bg-[#f0f8eb] px-4 py-2 text-xs font-semibold text-[#08783b] sm:flex">

                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    data.siripayConnected
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />

                SiriPay{" "}
                {data.siripayConnected
                  ? "Live"
                  : "Offline"}

              </div>

              <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce7dc] bg-white"
              >
                <Bell
                  size={18}
                  className="text-[#08783b]"
                />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f0b400]" />
              </button>

              <Link
                href="/admin/products/new"
                className="hidden items-center gap-2 rounded-xl bg-[#08783b] px-5 py-3 text-sm font-bold text-white sm:flex"
              >
                <Plus size={17} />
                Add Product
              </Link>

            </div>

          </header>

          <div className="mx-auto max-w-[1500px] p-5 md:p-8">

            {/* HERO */}

            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#07843f] via-[#0a783a] to-[#2f8138] px-7 py-10 text-white md:px-14">

              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">

                <div>

                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                    BPS ADMIN PORTAL
                  </p>

                  <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl">
                    Welcome back,{" "}
                    <span className="text-[#ffd928]">
                      BPS
                    </span>
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">
                    Manage your catalogue, products,
                    categories, orders and customers
                    from one powerful control center.
                  </p>

                </div>

                <Link
                  href="/admin/products"
                  className="flex w-fit items-center gap-3 rounded-2xl bg-[#ffd928] px-7 py-5 text-sm font-extrabold text-[#075d32]"
                >
                  <Package size={18} />

                  <span>
                    Manage
                    <br />
                    Catalogue
                  </span>

                  <ChevronRight size={18} />
                </Link>

              </div>

            </div>

            {/* STATS */}

            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

              <Stat
                title="Total Products"
                value={data.products}
                icon={<Package size={22} />}
                loading={loading}
              />

              <Stat
                title="SiriPay Products"
                value={data.siripayProducts}
                icon={<Sparkles size={22} />}
                yellow
                loading={loading}
              />

              <Stat
                title="Categories"
                value={data.categories}
                icon={<Boxes size={22} />}
                loading={loading}
              />

              <Stat
                title="Customers"
                value={data.customers}
                icon={<Users size={22} />}
                yellow
                loading={loading}
              />

            </div>

            {/* MANAGEMENT */}

            <div className="mt-8">

              <div className="mb-5">

                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8ca08d]">
                  Quick Access
                </p>

                <h2 className="mt-1 text-xl font-extrabold">
                  Store Management
                </h2>

              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                <Action
                  href="/admin/products"
                  icon={<Package size={20} />}
                  title="Products"
                  text="Manage complete catalogue"
                />

                <Action
                  href="/admin/categories"
                  icon={<Boxes size={20} />}
                  title="Categories"
                  text="Manage all categories"
                />

                <Action
                  href="/admin/orders"
                  icon={<ShoppingBag size={20} />}
                  title="Orders"
                  text="Manage customer orders"
                />

                <Action
                  href="/admin/customers"
                  icon={<Users size={20} />}
                  title="Customers"
                  text="Manage customer accounts"
                />

              </div>

            </div>

            {/* SIRIPAY */}

            <div className="mt-7 rounded-[26px] border border-[#dce7d9] bg-white p-6">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf8e8] text-[#08783b]">
                    <Sparkles size={20} />
                  </div>

                  <div>

                    <h3 className="text-sm font-bold">
                      SiriPay Catalogue
                    </h3>

                    <p className="mt-1 text-xs text-[#7c8c80]">
                      Live external product catalogue
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      data.siripayConnected
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  />

                  <span className="text-xs font-bold text-[#08783b]">
                    {data.siripayConnected
                      ? "Connected"
                      : "Not Connected"}
                  </span>

                  <Link
                    href="/admin/external-api"
                    className="rounded-xl border border-[#dce7d9] px-4 py-2 text-xs font-bold text-[#53665a] hover:border-[#08783b] hover:text-[#08783b]"
                  >
                    API Settings
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

/* SIDEBAR */

function SideItem({
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
      className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold transition ${
        active
          ? "bg-[#ffd928] text-[#075d32]"
          : "text-[#6c7d70] hover:bg-[#f3f8f1] hover:text-[#08783b]"
      }`}
    >
      {icon}

      <span className="flex-1">
        {label}
      </span>

      {!active && (
        <ChevronRight
          size={13}
          className="opacity-0 group-hover:opacity-50"
        />
      )}
    </Link>
  );
}

/* STAT */

function Stat({
  title,
  value,
  icon,
  yellow = false,
  loading = false,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  yellow?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[26px] border border-[#dce7d9] bg-white p-7 shadow-sm">

      <div className="flex items-start justify-between">

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            yellow
              ? "bg-[#fff7c9]"
              : "bg-[#edf8e8]"
          } text-[#08783b]`}
        >
          {icon}
        </div>

        <span className="rounded-full bg-[#f0f8eb] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#08783b]">
          Live
        </span>

      </div>

      <p className="mt-8 text-sm text-[#738578]">
        {title}
      </p>

      {loading ? (
        <div className="mt-3 h-10 w-24 animate-pulse rounded-lg bg-[#edf2ea]" />
      ) : (
        <p className="mt-1 text-4xl font-extrabold">
          {value.toLocaleString("en-IN")}
        </p>
      )}

    </div>
  );
}

/* ACTION */

function Action({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[25px] border border-[#dce7d9] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf8e8] text-[#08783b]">
          {icon}
        </div>

        <ChevronRight
          size={17}
          className="text-[#a4b1a7] transition group-hover:translate-x-1 group-hover:text-[#08783b]"
        />

      </div>

      <h3 className="mt-5 text-base font-bold">
        {title}
      </h3>

      <p className="mt-2 text-xs text-[#7b8b80]">
        {text}
      </p>

    </Link>
  );
}
