"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  ShoppingBag,
  Trash2,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: string | number;
  salePrice?: string | number | null;
  stock: number;
  status: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  images?: {
    id: number;
    url: string;
    alt?: string | null;
    sortOrder?: number;
  }[];
};

type WishlistItem = {
  id: number;
  productId: number;
  product: Product;
};

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/wishlist", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href =
          "/auth/login?redirect=/wishlist";
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load wishlist"
        );
      }

      setWishlist(data.wishlist || []);
    } catch (err) {
      console.error("WISHLIST PAGE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load wishlist"
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(productId: number) {
    try {
      setRemovingId(productId);

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
        }),
      });

      if (response.status === 401) {
        window.location.href =
          "/auth/login?redirect=/wishlist";
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to remove item"
        );
      }

      setWishlist((current) =>
        current.filter(
          (item) => item.productId !== productId
        )
      );
    } catch (err) {
      console.error(
        "REMOVE WISHLIST ERROR:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to remove item"
      );
    } finally {
      setRemovingId(null);
    }
  }

  function formatPrice(value: string | number) {
    const number = Number(value);

    return `₹${number.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  }

  function getFinalPrice(product: Product) {
    const price = Number(product.price);

    if (
      product.salePrice !== null &&
      product.salePrice !== undefined
    ) {
      const sale = Number(product.salePrice);

      if (sale < price) {
        return sale;
      }
    }

    return price;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-[#242424]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#777]">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Loading your wishlist...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#242424]">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f7f5f0]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-8">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <span className="text-2xl font-semibold tracking-[-0.06em]">
              BPS
            </span>

            <span className="hidden text-[9px] uppercase tracking-[0.25em] text-black/35 sm:block">
              Budgetree Premium Store
            </span>
          </Link>

          <div className="flex items-center gap-2">

            <Link
              href="/shop"
              className="flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-xs transition hover:bg-black hover:text-white"
            >
              <ShoppingBag size={15} />
              Shop
            </Link>

            <Link
              href="/account"
              className="hidden h-10 items-center rounded-full border border-black/10 px-4 text-xs sm:flex"
            >
              My Account
            </Link>

          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16">

        {/* BACK */}

        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-xs text-black/50 transition hover:text-black"
        >
          <ArrowLeft size={14} />
          Continue Shopping
        </Link>

        {/* TITLE */}

        <div className="flex items-end justify-between gap-5 border-b border-black/[0.08] pb-7">

          <div>

            <div className="flex items-center gap-3">
              <Heart
                size={22}
                strokeWidth={1.5}
              />

              <h1 className="text-3xl font-medium tracking-[-0.04em] md:text-5xl">
                My Wishlist
              </h1>
            </div>

            <p className="mt-3 text-sm text-black/45">
              {wishlist.length === 0
                ? "Your saved products will appear here."
                : `${wishlist.length} ${
                    wishlist.length === 1
                      ? "item"
                      : "items"
                  } saved`}
            </p>

          </div>

          {wishlist.length > 0 && (
            <div className="hidden text-right sm:block">
              <p className="text-[9px] uppercase tracking-[0.2em] text-black/35">
                Your Collection
              </p>

              <p className="mt-1 text-sm">
                Premium picks
              </p>
            </div>
          )}

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}

            <button
              onClick={loadWishlist}
              className="ml-3 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* EMPTY */}

        {!error && wishlist.length === 0 && (
          <div className="flex min-h-[450px] flex-col items-center justify-center text-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <Heart
                size={32}
                strokeWidth={1}
                className="text-black/25"
              />
            </div>

            <h2 className="mt-7 text-2xl font-medium">
              Your wishlist is empty
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-black/45">
              Save products you love and come back
              whenever you are ready to shop.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex h-12 items-center gap-3 rounded-full bg-[#222] px-7 text-xs font-medium text-white transition hover:bg-[#b8872d]"
            >
              Explore Gifts
              <ArrowRight size={15} />
            </Link>

          </div>
        )}

        {/* PRODUCTS */}

        {!error && wishlist.length > 0 && (
          <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {wishlist.map((item) => {
              const product = item.product;

              const image =
                product.images?.[0]?.url ||
                null;

              const price =
                Number(product.price);

              const finalPrice =
                getFinalPrice(product);

              const onSale =
                finalPrice < price;

              const discount = onSale
                ? Math.round(
                    ((price - finalPrice) /
                      price) *
                      100
                  )
                : 0;

              return (
                <div
                  key={item.id}
                  className="group"
                >

                  {/* IMAGE */}

                  <div className="relative aspect-[0.88] overflow-hidden rounded-[26px] bg-white">

                    <Link
                      href={`/product/${product.id}`}
                      className="absolute inset-0"
                    >

                      {image ? (
                        <img
                          src={image}
                          alt={
                            product.images?.[0]
                              ?.alt ||
                            product.name
                          }
                          className="h-full w-full object-contain p-7 transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <GiftPlaceholder />
                        </div>
                      )}

                    </Link>

                    {/* DISCOUNT */}

                    {discount > 0 && (
                      <span className="absolute left-4 top-4 rounded-full bg-[#b8872d] px-3 py-1.5 text-[9px] font-semibold text-white">
                        {discount}% OFF
                      </span>
                    )}

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={() =>
                        removeFromWishlist(
                          product.id
                        )
                      }
                      disabled={
                        removingId ===
                        product.id
                      }
                      aria-label="Remove from wishlist"
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-black hover:text-white disabled:opacity-50"
                    >
                      {removingId ===
                      product.id ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>

                    {/* VIEW */}

                    <Link
                      href={`/product/${product.id}`}
                      className="absolute bottom-4 left-4 right-4 flex h-11 translate-y-2 items-center justify-center gap-2 rounded-full bg-white/95 text-xs font-medium opacity-0 shadow-sm backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      View Product
                      <ArrowRight
                        size={14}
                      />
                    </Link>

                  </div>

                  {/* DETAILS */}

                  <Link
                    href={`/product/${product.id}`}
                    className="block px-1 pt-5"
                  >

                    <p className="text-[9px] uppercase tracking-[0.18em] text-[#b8872d]">
                      {product.category
                        ?.name ||
                        "Premium Collection"}
                    </p>

                    <h3 className="mt-2 truncate text-sm font-medium">
                      {product.name}
                    </h3>

                    <div className="mt-3 flex items-center gap-3">

                      <span className="text-sm font-semibold">
                        {formatPrice(
                          finalPrice
                        )}
                      </span>

                      {onSale && (
                        <span className="text-xs text-black/30 line-through">
                          {formatPrice(price)}
                        </span>
                      )}

                    </div>

                    {product.stock <= 0 && (
                      <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-red-500">
                        Currently unavailable
                      </p>
                    )}

                  </Link>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* FOOTER */}

      <footer className="mt-10 border-t border-black/[0.07] bg-[#eeeae2]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-5 py-8 text-xs text-black/40 md:flex-row md:items-center md:justify-between md:px-8">

          <div>
            © {new Date().getFullYear()} Budgetree Premium Store
          </div>

          <div className="flex gap-5">
            <Link
              href="/shop"
              className="hover:text-black"
            >
              Shop
            </Link>

            <Link
              href="/account"
              className="hover:text-black"
            >
              Account
            </Link>

            <Link
              href="/track-order"
              className="hover:text-black"
            >
              Track Order
            </Link>
          </div>

        </div>
      </footer>

    </main>
  );
}

function GiftPlaceholder() {
  return (
    <div className="text-center text-black/15">
      <Heart
        size={60}
        strokeWidth={0.8}
      />
    </div>
  );
}
