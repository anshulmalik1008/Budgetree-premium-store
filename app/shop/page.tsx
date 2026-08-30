"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";

type Product = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  salePrice?: string | number | null;
  stock: number;
  status: string;
  featured: boolean;
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

type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
};

type Customer = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadShop();
    loadCustomer();
  }, []);

  async function loadShop() {
    try {
      setLoading(true);

      const [productsResponse, categoriesResponse] =
        await Promise.all([
          fetch("/api/products", {
            cache: "no-store",
          }),
          fetch("/api/categories", {
            cache: "no-store",
          }),
        ]);

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setProducts(productsData.products ?? []);
      setCategories(categoriesData.categories ?? []);
    } catch (error) {
      console.error("SHOP LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomer() {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        setCustomer(data.user);
        await loadWishlist();
      } else {
        setCustomer(null);
        setWishlist([]);
      }
    } catch (error) {
      console.error("CUSTOMER LOAD ERROR:", error);
    }
  }

  async function loadWishlist() {
    try {
      const response = await fetch("/api/wishlist", {
        cache: "no-store",
      });

      if (!response.ok) {
        setWishlist([]);
        return;
      }

      const data = await response.json();

      const ids =
        data.items?.map((item: any) =>
          Number(item.productId ?? item.product?.id)
        ) ?? [];

      setWishlist(ids);
    } catch (error) {
      console.error("WISHLIST LOAD ERROR:", error);
    }
  }

  async function toggleWishlist(productId: number) {
    if (!customer) {
      window.location.href = "/auth";
      return;
    }

    try {
      setWishlistLoading(productId);

      const alreadyAdded = wishlist.includes(productId);

      const response = await fetch("/api/wishlist", {
        method: alreadyAdded ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth";
          return;
        }

        alert(data.message || "Wishlist update failed");
        return;
      }

      if (alreadyAdded) {
        setWishlist((current) =>
          current.filter((id) => id !== productId)
        );
      } else {
        setWishlist((current) => [
          ...current,
          productId,
        ]);
      }
    } catch (error) {
      console.error("WISHLIST ERROR:", error);
    } finally {
      setWishlistLoading(null);
    }
  }

  const filteredProducts = useMemo(() => {
    let result = [...products].filter(
      (product) => product.status === "ACTIVE"
    );

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category?.name
            ?.toLowerCase()
            .includes(query)
        );
      });
    }

    if (category !== "all") {
      result = result.filter(
        (product) =>
          product.category?.slug === category
      );
    }

    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          getFinalPrice(a) - getFinalPrice(b)
      );
    }

    if (sort === "price-high") {
      result.sort(
        (a, b) =>
          getFinalPrice(b) - getFinalPrice(a)
      );
    }

    if (sort === "newest") {
      result.sort((a, b) => b.id - a.id);
    }

    if (sort === "featured") {
      result.sort(
        (a, b) =>
          Number(b.featured) -
          Number(a.featured)
      );
    }

    return result;
  }, [products, search, category, sort]);

  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#24201f]">
      {/* TOP STRIP */}

      <div className="bg-[#f7e5df] px-4 py-2 text-center text-[9px] font-medium uppercase tracking-[0.18em] text-[#6f4c47]">
        Thoughtful gifts for every occasion
      </div>

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-[#eadfd9] bg-[#fffaf7]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1450px] items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7d514b] text-sm font-semibold text-white">
              B
            </div>

            <div>
              <div className="text-lg font-semibold tracking-[-0.04em]">
                BPS
              </div>

              <div className="text-[7px] uppercase tracking-[0.25em] text-black/35">
                Budgetree Premium Store
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-xs md:flex">
            <Link
              href="/"
              className="text-black/55 transition hover:text-[#7d514b]"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="font-medium text-[#7d514b]"
            >
              Shop
            </Link>

            <Link
              href="/shop?sort=featured"
              className="text-black/55 transition hover:text-[#7d514b]"
            >
              Collections
            </Link>

            <Link
              href="/shop?category=corporate"
              className="text-black/55 transition hover:text-[#7d514b]"
            >
              Corporate
            </Link>

            <Link
              href="/track-order"
              className="text-black/55 transition hover:text-[#7d514b]"
            >
              Track Order
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#e7dad4] transition hover:bg-[#f7e5df] sm:flex"
            >
              <Search size={16} />
            </Link>

            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e7dad4] transition hover:bg-[#f7e5df]"
            >
              <Heart size={16} />

              {wishlist.length > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7d514b] px-1 text-[8px] text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7d514b] text-white transition hover:bg-[#623d38]"
            >
              <ShoppingBag size={16} />
            </Link>

            <Link
              href={customer ? "/account" : "/auth"}
              className="flex h-10 items-center gap-2 rounded-full border border-[#e7dad4] px-3 transition hover:bg-[#f7e5df]"
            >
              <User size={15} />

              <span className="hidden max-w-[85px] truncate text-xs sm:block">
                {customer
                  ? customer.name
                  : "Login"}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}

      <section className="border-b border-[#eadfd9] bg-[#fff7f3]">
        <div className="mx-auto max-w-[1450px] px-5 py-12 md:px-8 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#9b6b63]">
                The gifting edit
              </p>

              <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] md:text-6xl">
                Find a gift
                <br />
                <span className="text-[#9b6b63]">
                  worth remembering.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-black/45">
                Discover beautiful gifts curated for
                birthdays, celebrations, relationships,
                festivals and every little moment in between.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#products"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#7d514b] px-6 text-xs font-medium text-white transition hover:bg-[#623d38]"
                >
                  Shop gifts
                  <ArrowRight size={14} />
                </a>

                <Link
                  href="/wishlist"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[#d9c6c0] bg-white px-6 text-xs transition hover:bg-[#f7e5df]"
                >
                  <Heart size={14} />
                  Wishlist
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-5 rounded-[40px] bg-[#e9c9bf] blur-3xl opacity-50" />

              <div className="relative overflow-hidden rounded-[32px] border border-[#eadbd5] bg-white p-4 shadow-sm">
                {products[0]?.images?.[0]?.url ? (
                  <img
                    src={products[0].images[0].url}
                    alt={products[0].name}
                    className="h-[330px] w-full object-contain p-5"
                  />
                ) : (
                  <div className="flex h-[330px] items-center justify-center bg-[#faf1ed]">
                    <ShoppingBag
                      size={80}
                      strokeWidth={1}
                      className="text-[#9b6b63]/25"
                    />
                  </div>
                )}

                <div className="rounded-2xl bg-[#fff7f3] p-5">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-[#9b6b63]">
                    Featured pick
                  </p>

                  <p className="mt-2 text-base font-medium">
                    {products[0]?.name ||
                      "Beautiful gifts, thoughtfully chosen"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}

      <section className="mx-auto max-w-[1450px] px-5 py-9 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] uppercase tracking-[0.25em] text-[#9b6b63]">
              Browse
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              Shop by category
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden items-center gap-1 text-xs text-black/45 sm:flex"
          >
            View all
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory("all")}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs transition ${
              category === "all"
                ? "bg-[#7d514b] text-white"
                : "border border-[#e5d8d2] bg-white text-black/55 hover:bg-[#f7e5df]"
            }`}
          >
            All Gifts
          </button>

          {categories.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.slug)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs transition ${
                category === item.slug
                  ? "bg-[#7d514b] text-white"
                  : "border border-[#e5d8d2] bg-white text-black/55 hover:bg-[#f7e5df]"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}

      <section
        id="products"
        className="border-y border-[#eadfd9] bg-white"
      >
        <div className="mx-auto max-w-[1450px] px-5 py-10 md:px-8 md:py-14">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.25em] text-[#9b6b63]">
                Our collection
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
                Gifts for every moment
              </h2>

              <p className="mt-2 text-sm text-black/40">
                {filteredProducts.length} products to explore
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search gifts..."
                  className="h-10 w-48 rounded-full border border-[#e5d8d2] bg-[#fffaf7] pl-9 pr-4 text-xs outline-none transition placeholder:text-black/30 focus:border-[#9b6b63] sm:w-56"
                />
              </div>

              <button
                onClick={() =>
                  setShowFilters((value) => !value)
                }
                className="flex h-10 items-center gap-2 rounded-full border border-[#e5d8d2] px-4 text-xs"
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fff7f3] p-4">
              <span className="text-xs font-medium">
                Sort by
              </span>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
                className="h-9 rounded-full border border-[#dfcec7] bg-white px-4 text-xs outline-none"
              >
                <option value="featured">
                  Featured
                </option>
                <option value="newest">
                  Newest
                </option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
              </select>

              {(search || category !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setSort("featured");
                  }}
                  className="flex items-center gap-1 text-xs text-[#9b6b63]"
                >
                  <X size={13} />
                  Clear
                </button>
              )}
            </div>
          )}

          {loading ? (
            <ProductSkeleton />
          ) : filteredProducts.length > 0 ? (
            <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  liked={wishlist.includes(product.id)}
                  wishlistLoading={
                    wishlistLoading === product.id
                  }
                  onWishlist={() =>
                    toggleWishlist(product.id)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f7e5df]">
                <Search
                  size={25}
                  className="text-[#9b6b63]"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No gifts found
              </h3>

              <p className="mt-2 text-sm text-black/40">
                Try another search or category.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="mt-5 rounded-full bg-[#7d514b] px-5 py-2.5 text-xs text-white"
              >
                View all gifts
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CORPORATE BANNER */}

      <section className="mx-auto max-w-[1450px] px-5 py-12 md:px-8">
        <div className="relative overflow-hidden rounded-[30px] bg-[#7d514b] px-7 py-10 text-white md:px-12 md:py-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-white/60">
                Corporate gifting
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] md:text-4xl">
                Thoughtful gifts for
                <br />
                teams & clients.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
                Curated gifting solutions for celebrations,
                events and business relationships.
              </p>
            </div>

            <Link
              href="/shop?category=corporate"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-medium text-[#7d514b]"
            >
              Explore corporate
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-[#eadfd9] bg-[#fff7f3]">
        <div className="mx-auto max-w-[1450px] px-5 py-12 md:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7d514b] text-white">
                  B
                </div>

                <div>
                  <p className="font-semibold">
                    Budgetree Premium Store
                  </p>

                  <p className="text-[8px] uppercase tracking-[0.2em] text-black/30">
                    Gifts worth remembering
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-md text-xs leading-6 text-black/40">
                Thoughtfully curated gifts for celebrations,
                relationships, milestones and meaningful
                moments.
              </p>
            </div>

            <FooterColumn
              title="Shop"
              links={[
                ["All Gifts", "/shop"],
                ["Collections", "/shop?sort=featured"],
                ["Wishlist", "/wishlist"],
                ["Corporate", "/shop?category=corporate"],
              ]}
            />

            <FooterColumn
              title="Account"
              links={[
                ["My Account", "/account"],
                ["My Orders", "/account/orders"],
                ["Track Order", "/track-order"],
                ["Contact", "/contact"],
                ["Admin Portal", "/admin"],
              ]}
            />
          </div>

          <div className="mt-10 border-t border-[#eadfd9] pt-5 text-[9px] text-black/30">
            © {new Date().getFullYear()} Budgetree Premium
            Store. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* PRODUCT CARD */

function ProductCard({
  product,
  liked,
  wishlistLoading,
  onWishlist,
}: {
  product: Product;
  liked: boolean;
  wishlistLoading: boolean;
  onWishlist: () => void;
}) {
  const price = Number(product.price);

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  const finalPrice =
    salePrice !== null && salePrice < price
      ? salePrice
      : price;

  const discount =
    salePrice !== null && salePrice < price
      ? Math.round(
          ((price - salePrice) / price) * 100
        )
      : 0;

  const image =
    product.images?.[0]?.url ?? null;

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-[20px] bg-[#f9f3f0]">
        <Link
          href={`/product/${product.id}`}
          className="block"
        >
          <div className="aspect-[0.9]">
            {image ? (
              <img
                src={image}
                alt={
                  product.images?.[0]?.alt ||
                  product.name
                }
                className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingBag
                  size={50}
                  strokeWidth={1}
                  className="text-[#9b6b63]/25"
                />
              </div>
            )}
          </div>
        </Link>

        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.featured && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[7px] font-medium uppercase tracking-[0.1em] text-[#7d514b]">
              Featured
            </span>
          )}

          {discount > 0 && (
            <span className="rounded-full bg-[#7d514b] px-2.5 py-1 text-[7px] font-medium text-white">
              {discount}% OFF
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onWishlist}
          disabled={wishlistLoading}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition ${
            liked
              ? "text-[#b65f67]"
              : "text-black/45 hover:text-[#7d514b]"
          }`}
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          <Heart
            size={16}
            fill={liked ? "currentColor" : "none"}
          />
        </button>
      </div>

      <Link
        href={`/product/${product.id}`}
        className="block px-0.5 pt-3"
      >
        <p className="truncate text-[8px] uppercase tracking-[0.14em] text-[#9b6b63]">
          {product.category?.name ||
            "Premium Gift"}
        </p>

        <h3 className="mt-1.5 line-clamp-2 min-h-[34px] text-xs font-medium leading-5 text-black/80">
          {product.name}
        </h3>

        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatPrice(finalPrice)}
          </span>

          {discount > 0 && (
            <span className="text-[10px] text-black/30 line-through">
              {formatPrice(price)}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

/* FOOTER */

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-black/35">
        {title}
      </p>

      <div className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="block text-xs text-black/45 transition hover:text-[#7d514b]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* LOADING */

function ProductSkeleton() {
  return (
    <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map(
        (_, index) => (
          <div key={index}>
            <div className="aspect-[0.9] animate-pulse rounded-[20px] bg-[#f4ebe7]" />

            <div className="mt-3 h-2 w-20 animate-pulse rounded bg-[#f4ebe7]" />

            <div className="mt-2 h-4 w-full animate-pulse rounded bg-[#f4ebe7]" />

            <div className="mt-2 h-4 w-16 animate-pulse rounded bg-[#f4ebe7]" />
          </div>
        )
      )}
    </div>
  );
}

/* PRICE */

function getFinalPrice(product: Product) {
  const price = Number(product.price);

  const sale =
    product.salePrice !== null &&
    product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  return sale !== null && sale < price
    ? sale
    : price;
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}
