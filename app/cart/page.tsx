"use client";

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
  Gift,
  Check,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type ProductImageObject = {
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  image5?: string | null;
};

type CartItem = {
  id?: number | string;
  product_id?: number | string;

  name?: string;
  product_name?: string;

  price?: number | string | null;
  product_price?: number | string | null;

  salePrice?: number | string | null;
  sale_price?: number | string | null;

  product_mrp?: number | string | null;
  basic_price?: number | string | null;

  sku?: string | null;

  image?: string | null;
  images?: ProductImageObject | string[] | string | null;

  primary_category_name?: string | null;
  category_name?: string | null;

  quantity?: number;
};

/* =========================================================
   CART KEYS
   We support both existing keys so old cart data doesn't
   disappear.
========================================================= */

const CART_KEYS = ["bps_cart", "cart"];

/* =========================================================
   HELPERS
========================================================= */

function getProductId(item: CartItem): string {
  return String(item.product_id ?? item.id ?? "");
}

function getProductName(item: CartItem): string {
  return (
    item.product_name?.trim() ||
    item.name?.trim() ||
    "Premium Product"
  );
}

function getProductImage(item: CartItem): string {
  if (typeof item.image === "string" && item.image.trim()) {
    return item.image.trim();
  }

  if (typeof item.images === "string" && item.images.trim()) {
    return item.images.trim();
  }

  if (Array.isArray(item.images)) {
    const image = item.images.find(
      (value) =>
        typeof value === "string" && value.trim().length > 0
    );

    if (image) return image.trim();
  }

  if (
    item.images &&
    typeof item.images === "object" &&
    !Array.isArray(item.images)
  ) {
    const images = item.images as ProductImageObject;

    return (
      images.image1?.trim() ||
      images.image2?.trim() ||
      images.image3?.trim() ||
      images.image4?.trim() ||
      images.image5?.trim() ||
      ""
    );
  }

  return "";
}

function getBasePrice(item: CartItem): number {
  const candidates = [
    item.product_price,
    item.basic_price,
    item.price,
    item.product_mrp,
  ];

  for (const value of candidates) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return 0;
}

function getSalePrice(item: CartItem): number | null {
  const candidates = [
    item.salePrice,
    item.sale_price,
  ];

  for (const value of candidates) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const number = Number(value);

      if (Number.isFinite(number) && number > 0) {
        return number;
      }
    }
  }

  return null;
}

function getItemPrice(item: CartItem): number {
  const salePrice = getSalePrice(item);
  const basePrice = getBasePrice(item);

  if (
    salePrice !== null &&
    basePrice > 0 &&
    salePrice < basePrice
  ) {
    return salePrice;
  }

  return basePrice;
}

function getMRP(item: CartItem): number {
  const mrp = Number(item.product_mrp);

  if (Number.isFinite(mrp) && mrp > 0) {
    return mrp;
  }

  return getBasePrice(item);
}

function getQuantity(item: CartItem): number {
  const quantity = Number(item.quantity);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.floor(quantity);
}

function formatPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "₹0";
  }

  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

/* =========================================================
   NORMALIZE PRODUCT
   Converts Home product format into Cart format
========================================================= */

function normalizeCartItem(item: CartItem): CartItem {
  const id = getProductId(item);
  const name = getProductName(item);
  const image = getProductImage(item);
  const price = getBasePrice(item);
  const salePrice = getSalePrice(item);

  return {
    ...item,

    id,
    product_id: id,

    name,
    product_name: name,

    price,
    product_price: price,

    salePrice,
    sale_price: salePrice,

    image,
    quantity: getQuantity(item),
  };
}

/* =========================================================
   LOAD CART FROM BOTH POSSIBLE STORAGE KEYS
========================================================= */

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    for (const key of CART_KEYS) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter(
            (item): item is CartItem =>
              Boolean(item) &&
              typeof item === "object"
          )
          .map(normalizeCartItem)
          .filter((item) => getProductId(item));
      }
    }
  } catch (error) {
    console.error("CART READ ERROR:", error);
  }

  return [];
}

/* =========================================================
   SAVE CART
========================================================= */

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;

  try {
    const normalized = items.map(normalizeCartItem);
    const json = JSON.stringify(normalized);

    /*
      Save to both keys.

      This keeps compatibility with Home and any older
      component that is still reading "cart".
    */

    localStorage.setItem("bps_cart", json);
    localStorage.setItem("cart", json);

    window.dispatchEvent(
      new CustomEvent("cart-updated", {
        detail: normalized,
      })
    );
  } catch (error) {
    console.error("CART SAVE ERROR:", error);
  }
}

/* =========================================================
   CART PAGE
========================================================= */

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const cart = readCart();

    setItems(cart);
    setLoaded(true);
  }, []);

  /* =======================================================
     SAVE WHEN CART CHANGES
  ======================================================= */

  useEffect(() => {
    if (!loaded) return;

    saveCart(items);
  }, [items, loaded]);

  /* =======================================================
     UPDATE QUANTITY
  ======================================================= */

  function updateQuantity(
    productId: string,
    quantity: number
  ) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (getProductId(item) !== productId) {
          return item;
        }

        return {
          ...item,
          quantity,
        };
      })
    );
  }

  /* =======================================================
     REMOVE
  ======================================================= */

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter(
        (item) => getProductId(item) !== productId
      )
    );
  }

  /* =======================================================
     CLEAR
  ======================================================= */

  function clearCart() {
    setItems([]);

    if (typeof window !== "undefined") {
      localStorage.removeItem("bps_cart");
      localStorage.removeItem("cart");

      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: [],
        })
      );
    }
  }

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return (
        total +
        getItemPrice(item) *
          getQuantity(item)
      );
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + getQuantity(item),
      0
    );
  }, [items]);

  const shipping =
    subtotal === 0 || subtotal >= 499
      ? 0
      : 49;

  const total = subtotal + shipping;

  /* =======================================================
     LOADING
  ======================================================= */

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#fffdf5]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e8f1df] border-t-[#0b7139]" />
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#fffdf5] text-[#10251a]">

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div className="border-b border-yellow-300 bg-[#ffd928]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-center gap-8 px-5 py-2 text-[11px] font-bold text-[#123b25]">
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} />
            100% Genuine Products
          </span>

          <span className="hidden sm:flex items-center gap-2">
            <Truck size={15} />
            Fast Delivery
          </span>

          <span className="hidden md:flex items-center gap-2">
            <ShieldCheck size={15} />
            Secure Payments
          </span>
        </div>
      </div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 md:px-8">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c6b38] text-white shadow-sm">
              <Gift size={24} />
            </div>

            <div className="leading-none">
              <div className="text-[24px] font-black tracking-tight text-[#146b3a]">
                budgetree
              </div>

              <div className="mt-1 text-[8px] font-bold tracking-[2px] text-gray-500">
                PREMIUM STORE
              </div>
            </div>
          </Link>

          <Link
            href="/shop"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#0c713a] px-4 text-xs font-bold text-white transition hover:bg-[#095d30]"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:block">
              Continue Shopping
            </span>
            <span className="sm:hidden">
              Shop
            </span>
          </Link>
        </div>
      </header>

      {/* ===================================================
          TITLE
      =================================================== */}

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-8 md:py-14">

          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0b7139]">
            Your Selection
          </p>

          <div className="mt-3 flex items-end justify-between gap-5">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Your Cart
              </h1>

              <p className="mt-3 text-sm text-gray-500">
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
                className="hidden items-center gap-2 rounded-lg border border-red-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 transition hover:bg-red-50 sm:flex"
              >
                <Trash2 size={14} />
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          EMPTY
      =================================================== */}

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <section className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 md:py-14">

          <div className="grid gap-7 lg:grid-cols-[1fr_390px]">

            {/* =================================================
                CART ITEMS
            ================================================= */}

            <div>

              <div className="space-y-4">
                {items.map((item) => {
                  const productId =
                    getProductId(item);

                  return (
                    <CartItemCard
                      key={productId}
                      item={item}
                      onIncrease={() =>
                        updateQuantity(
                          productId,
                          getQuantity(item) + 1
                        )
                      }
                      onDecrease={() =>
                        updateQuantity(
                          productId,
                          getQuantity(item) - 1
                        )
                      }
                      onRemove={() =>
                        removeItem(productId)
                      }
                    />
                  );
                })}
              </div>

              {/* =================================================
                  TRUST
              ================================================= */}

              <div className="mt-7 grid gap-3 sm:grid-cols-3">

                <TrustCard
                  icon={<ShieldCheck size={18} />}
                  title="Secure Checkout"
                />

                <TrustCard
                  icon={<Truck size={18} />}
                  title="Fast Delivery"
                />

                <TrustCard
                  icon={<Check size={18} />}
                  title="Quality Assured"
                />

              </div>
            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <aside className="lg:sticky lg:top-24 lg:self-start">

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="bg-[#0c6b38] px-6 py-5 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black">
                      Order Summary
                    </h2>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold">
                      {totalItems} Items
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-7">

                  <div className="space-y-4 text-sm">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Subtotal
                      </span>

                      <span className="font-bold text-gray-900">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Delivery
                      </span>

                      <span
                        className={
                          shipping === 0
                            ? "font-bold text-[#0b7139]"
                            : "font-bold text-gray-900"
                        }
                      >
                        {shipping === 0
                          ? "FREE"
                          : formatPrice(shipping)}
                      </span>
                    </div>

                  </div>

                  {shipping > 0 && (
                    <div className="mt-5 rounded-xl bg-[#fff8cf] p-3 text-xs font-medium text-[#6d5a00]">
                      Add{" "}
                      <strong>
                        {formatPrice(
                          499 - subtotal
                        )}
                      </strong>{" "}
                      more for FREE delivery.
                    </div>
                  )}

                  <div className="my-6 h-px bg-gray-100" />

                  <div className="flex items-end justify-between">

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Total
                      </p>

                      <p className="mt-1 text-3xl font-black text-[#0c3520]">
                        {formatPrice(total)}
                      </p>
                    </div>

                    <span className="pb-1 text-[10px] text-gray-400">
                      incl. delivery
                    </span>

                  </div>

                  {/* CHECKOUT */}

                  <Link
                    href="/checkout"
                    className="group mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#ffd21f] text-xs font-black text-[#123b25] shadow-sm transition hover:bg-[#ffca00]"
                  >
                    Proceed to Checkout

                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/shop"
                    className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 text-xs font-bold text-gray-600 transition hover:border-[#0b7139] hover:text-[#0b7139]"
                  >
                    Continue Shopping
                  </Link>

                  <div className="mt-5 flex items-center justify-center gap-2 text-[9px] font-semibold text-gray-400">
                    <ShieldCheck size={13} />
                    Secure & Safe Checkout
                  </div>

                </div>
              </div>

            </aside>

          </div>
        </section>
      )}

    </main>
  );
}

/* =========================================================
   CART ITEM CARD
========================================================= */

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
  const id = getProductId(item);
  const name = getProductName(item);
  const image = getProductImage(item);
  const price = getItemPrice(item);
  const mrp = getMRP(item);
  const quantity = getQuantity(item);

  const category =
    item.primary_category_name ||
    item.category_name ||
    "Premium Product";

  const discount =
    mrp > price
      ? Math.round(
          ((mrp - price) / mrp) * 100
        )
      : 0;

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#b8d7a6] hover:shadow-md sm:p-5">

      <div className="flex gap-4 sm:gap-6">

        {/* =================================================
            IMAGE
        ================================================= */}

        <Link
          href={`/product/${id}`}
          className="relative flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f7faef] sm:h-36 sm:w-32"
        >

          {discount > 0 && (
            <span className="absolute left-2 top-2 z-10 rounded-md bg-[#0c713a] px-2 py-1 text-[9px] font-black text-white">
              {discount}% OFF
            </span>
          )}

          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";

                const parent =
                  event.currentTarget.parentElement;

                if (parent) {
                  parent.classList.add(
                    "image-failed"
                  );
                }
              }}
            />
          ) : (
            <Gift
              size={38}
              className="text-[#0c713a]/30"
            />
          )}

        </Link>

        {/* =================================================
            DETAILS
        ================================================= */}

        <div className="flex min-w-0 flex-1 flex-col">

          <div className="flex justify-between gap-3">

            <div className="min-w-0">

              <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-[#0b7139]">
                {category}
              </p>

              <Link
                href={`/product/${id}`}
                className="line-clamp-2 text-sm font-bold text-gray-800 transition hover:text-[#0b7139] sm:text-base"
              >
                {name}
              </Link>

              {item.sku && (
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                  SKU: {item.sku}
                </p>
              )}

            </div>

            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${name}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <X size={16} />
            </button>

          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">

            {/* =================================================
                QUANTITY
            ================================================= */}

            <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-gray-50">

              <button
                type="button"
                onClick={onDecrease}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center text-gray-500 transition hover:text-[#0b7139]"
              >
                <Minus size={14} />
              </button>

              <span className="w-8 text-center text-sm font-bold text-gray-800">
                {quantity}
              </span>

              <button
                type="button"
                onClick={onIncrease}
                aria-label="Increase quantity"
                className="flex h-10 w-10 items-center justify-center text-gray-500 transition hover:text-[#0b7139]"
              >
                <Plus size={14} />
              </button>

            </div>

            {/* =================================================
                PRICE
            ================================================= */}

            <div className="text-right">

              <p className="text-lg font-black text-[#10251a]">
                {formatPrice(
                  price * quantity
                )}
              </p>

              {mrp > price && (
                <p className="mt-1 text-xs text-gray-400 line-through">
                  {formatPrice(
                    mrp * quantity
                  )}
                </p>
              )}

              {quantity > 1 && (
                <p className="mt-1 text-[9px] font-medium text-gray-400">
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

/* =========================================================
   EMPTY CART
========================================================= */

function EmptyCart() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-8 md:py-24">

      <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#c9dcb8] bg-white px-6 py-20 text-center shadow-sm">

        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f1f8e8] text-[#0c713a]">
          <ShoppingBag
            size={36}
            strokeWidth={1.5}
          />
        </div>

        <p className="mt-7 text-[10px] font-black uppercase tracking-[0.25em] text-[#0b7139]">
          Nothing here yet
        </p>

        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#10251a]">
          Your cart is empty
        </h2>

        <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
          Discover our premium collection and find
          something worth gifting.
        </p>

        <Link
          href="/shop"
          className="group mt-8 flex h-13 items-center gap-3 rounded-xl bg-[#ffd21f] px-7 py-3 text-xs font-black text-[#123b25] shadow-sm transition hover:bg-[#ffca00]"
        >
          Explore Collection

          <ArrowRight
            size={16}
            className="transition group-hover:translate-x-1"
          />
        </Link>

      </div>
    </section>
  );
}

/* =========================================================
   TRUST CARD
========================================================= */

function TrustCard({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f8e8] text-[#0b7139]">
        {icon}
      </div>

      <span className="text-[10px] font-bold text-gray-600">
        {title}
      </span>

    </div>
  );
}
