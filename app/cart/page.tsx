"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  quantity: number;
  image?: string | null;
  sku?: string;
};

const CART_KEY = "bps_cart";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("CART LOAD ERROR:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify(items)
      );

      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: items,
        })
      );
    } catch (error) {
      console.error("CART SAVE ERROR:", error);
    }
  }, [items, loaded]);

  function updateQuantity(
    id: number,
    quantity: number
  ) {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  function removeItem(id: number) {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return (
        total +
        getItemPrice(item) * item.quantity
      );
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [items]);

  const shipping = subtotal >= 5000 || subtotal === 0
    ? 0
    : 199;

  const total = subtotal + shipping;

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#d4b76b]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080808]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 md:px-8 lg:px-12">
          <Link href="/">
            <div className="text-xl font-semibold tracking-[-0.04em]">
              BPS
            </div>

            <div className="mt-0.5 text-[7px] uppercase tracking-[0.3em] text-white/30">
              Budgetree Premium Store
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[10px] text-white/50 transition hover:border-white/20 hover:text-white"
            >
              <ArrowLeft size={13} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE */}

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#c8a65a]/10 blur-[140px]" />

        <div className="relative mx-auto max-w-[1500px] px-5 py-14 md:px-8 lg:px-12 lg:py-20">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#c8a65a]">
            Your Selection
          </p>

          <div className="mt-4 flex items-end justify-between gap-5">
            <div>
              <h1 className="text-5xl font-semibold tracking-[-0.055em] md:text-7xl">
                Your Cart
              </h1>

              <p className="mt-4 text-sm text-white/30">
                {totalItems === 0
                  ? "Your cart is waiting for something special."
                  : `${totalItems} ${
                      totalItems === 1
                        ? "item"
                        : "items"
                    } selected`}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/25 transition hover:text-red-300 sm:flex"
              >
                <Trash2 size={13} />
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </section>

      {/* EMPTY */}

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <section className="mx-auto max-w-[1500px] px-5 py-10 md:px-8 lg:px-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* ITEMS */}

            <div>
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onIncrease={() =>
                      updateQuantity(
                        item.id,
                        item.quantity + 1
                      )
                    }
                    onDecrease={() =>
                      updateQuantity(
                        item.id,
                        item.quantity - 1
                      )
                    }
                    onRemove={() =>
                      removeItem(item.id)
                    }
                  />
                ))}
              </div>

              {/* TRUST */}

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <TrustCard
                  icon={<ShieldCheck size={16} />}
                  title="Secure Checkout"
                />

                <TrustCard
                  icon={<Truck size={16} />}
                  title="Premium Delivery"
                />

                <TrustCard
                  icon={<ShoppingBag size={16} />}
                  title="Quality Assured"
                />
              </div>
            </div>

            {/* SUMMARY */}

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[28px] border border-white/[0.08] bg-[#101010] p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Order Summary
                  </h2>

                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                    {totalItems} Items
                  </span>
                </div>

                <div className="my-6 h-px bg-white/[0.07]" />

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/35">
                      Subtotal
                    </span>

                    <span className="text-white/80">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/35">
                      Delivery
                    </span>

                    <span
                      className={
                        shipping === 0
                          ? "text-emerald-400/80"
                          : "text-white/80"
                      }
                    >
                      {shipping === 0
                        ? "FREE"
                        : formatPrice(shipping)}
                    </span>
                  </div>
                </div>

                {shipping > 0 && (
                  <p className="mt-4 rounded-xl border border-[#c8a65a]/10 bg-[#c8a65a]/[0.03] p-3 text-[9px] leading-5 text-[#c8a65a]/60">
                    Add {formatPrice(5000 - subtotal)} more
                    for free delivery.
                  </p>
                )}

                <div className="my-6 h-px bg-white/[0.07]" />

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                      Total
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                      {formatPrice(total)}
                    </p>
                  </div>

                  <span className="pb-1 text-[9px] text-white/25">
                    incl. delivery
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="group mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#d4b76b] text-xs font-semibold text-black transition hover:bg-[#e3ca83]"
                >
                  Proceed to Checkout

                  <ArrowRight
                    size={15}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href="/shop"
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 text-[10px] text-white/40 transition hover:border-white/20 hover:text-white"
                >
                  Continue Shopping
                </Link>

                <p className="mt-5 text-center text-[8px] leading-5 text-white/20">
                  Your cart is saved on this device.
                </p>
              </div>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}

/* ===================================================== */
/* CART ITEM */
/* ===================================================== */

function CartItemCard({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  const price = getItemPrice(item);

  return (
    <div className="group rounded-[26px] border border-white/[0.07] bg-[#101010] p-4 transition hover:border-white/[0.12] sm:p-5">
      <div className="flex gap-4 sm:gap-6">
        {/* IMAGE */}

        <Link
          href={`/product/${item.id}`}
          className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0b0b0b] sm:h-36 sm:w-32"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-contain p-3 transition duration-500 group-hover:scale-105"
              sizes="128px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag
                size={32}
                strokeWidth={1}
                className="text-[#c8a65a]/20"
              />
            </div>
          )}
        </Link>

        {/* DETAILS */}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex justify-between gap-4">
            <div className="min-w-0">
              <Link
                href={`/product/${item.id}`}
                className="line-clamp-2 text-sm font-medium text-white/90 hover:text-[#d4b76b] sm:text-base"
              >
                {item.name}
              </Link>

              {item.sku && (
                <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20">
                  {item.sku}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onRemove}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/20 transition hover:bg-red-500/10 hover:text-red-300"
              aria-label={`Remove ${item.name}`}
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
            {/* QUANTITY */}

            <div className="flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.02]">
              <button
                type="button"
                onClick={onDecrease}
                className="flex h-9 w-9 items-center justify-center text-white/40 transition hover:text-white"
              >
                <Minus size={13} />
              </button>

              <span className="w-8 text-center text-xs">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={onIncrease}
                className="flex h-9 w-9 items-center justify-center text-white/40 transition hover:text-white"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* PRICE */}

            <div className="text-right">
              <p className="text-sm font-semibold">
                {formatPrice(
                  price * item.quantity
                )}
              </p>

              {item.quantity > 1 && (
                <p className="mt-1 text-[8px] text-white/20">
                  {formatPrice(price)} each
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================================================== */
/* EMPTY CART */
/* ===================================================== */

function EmptyCart() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-20 md:px-8 lg:py-28">
      <div className="flex flex-col items-center rounded-[32px] border border-dashed border-white/10 bg-white/[0.015] px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#c8a65a]/10 bg-[#c8a65a]/[0.04]">
          <ShoppingBag
            size={32}
            strokeWidth={1}
            className="text-[#c8a65a]/50"
          />
        </div>

        <p className="mt-7 text-[9px] uppercase tracking-[0.3em] text-[#c8a65a]">
          Nothing here yet
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Your cart is empty
        </h2>

        <p className="mt-3 max-w-md text-sm leading-6 text-white/25">
          Discover our premium collection and find
          something worth gifting.
        </p>

        <Link
          href="/shop"
          className="group mt-8 flex h-12 items-center gap-3 rounded-xl bg-[#d4b76b] px-6 text-xs font-semibold text-black transition hover:bg-[#e3ca83]"
        >
          Explore Collection

          <ArrowRight
            size={15}
            className="transition group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}

/* ===================================================== */
/* TRUST CARD */
/* ===================================================== */

function TrustCard({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d4b76b]/10 text-[#d4b76b]">
        {icon}
      </div>

      <span className="text-[9px] text-white/35">
        {title}
      </span>
    </div>
  );
}

/* ===================================================== */
/* HELPERS */
/* ===================================================== */

function getItemPrice(item: CartItem) {
  if (
    item.salePrice !== null &&
    item.salePrice !== undefined &&
    Number(item.salePrice) < Number(item.price)
  ) {
    return Number(item.salePrice);
  }

  return Number(item.price);
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}