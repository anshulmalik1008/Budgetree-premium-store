"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Menu,
  Gift,
  Star,
  ArrowRight,
  Tag,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Product = {
  id: number | string;
  externalId?: number | string;

  sku?: string;
  name?: string;
  slug?: string;

  description?: string | null;

  price?: number | string | null;
  salePrice?: number | string | null;
  mrp?: number | string | null;

  stock?: number;
  qty?: number;

  status?: string;
  featured?: boolean;

  categoryId?: number | string | null;
  categoryName?: string;

  brandName?: string;

  image?: string | null;
  images?: string[];
  gallery?: string[];

  externalData?: unknown;
};

type Category = {
  id?: number | string;
  name?: string;
  slug?: string;
  image?: string | null;
};

/* =========================================================
   BANNERS
========================================================= */

const banners = [
  {
    id: 1,
    title: "Premium Gifts.",
    highlight: "Delivered Fast.",
    subtitle:
      "Discover premium products, gifts & lifestyle essentials at trusted prices.",
    offer: "UP TO 30% OFF",
    button: "SHOP NOW",
    link: "/shop",
  },
  {
    id: 2,
    title: "Big Savings.",
    highlight: "Better Choices.",
    subtitle:
      "Explore our latest collection with exclusive offers and genuine products.",
    offer: "EXTRA 10% OFF",
    button: "EXPLORE DEALS",
    link: "/shop",
  },
  {
    id: 3,
    title: "Gift More.",
    highlight: "Spend Smarter.",
    subtitle:
      "Premium merchandise for every occasion, delivered right to your door.",
    offer: "SPECIAL DEALS",
    button: "VIEW COLLECTION",
    link: "/shop",
  },
];

const fallbackCategories: Category[] = [
  {
    id: "fallback-1",
    name: "Home & Kitchen",
  },
  {
    id: "fallback-2",
    name: "Electronics",
  },
  {
    id: "fallback-3",
    name: "Fashion",
  },
  {
    id: "fallback-4",
    name: "Beauty & Grooming",
  },
  {
    id: "fallback-5",
    name: "Personal Care",
  },
  {
    id: "fallback-6",
    name: "Gifts & Combos",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(
  value?: number | string | null
) {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}



function getProductImage(
  product: Product
): string {
  if (
    typeof product.image ===  "string" &&
    product.image.trim()
  ) {
    return product.image.trim();
  }

  if (
    Array.isArray(product.images)
  ) {
    const image = product.images.find(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0
    );

    if (image) {
      return image.trim();
    }
  }

  if (
    Array.isArray(product.gallery)
  ) {
    const image = product.gallery.find(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0
    );

    if (image) {
      return image.trim();
    }
  }

  return "";
}

/* =========================================================
   GET ALL PRODUCT IMAGES
========================================================= */

function getProductImages(
  product: Product
): string[] {
  const result: string[] = [];

  if (
    typeof product.image === "string" &&
    product.image.trim()
  ) {
    result.push(product.image.trim());
  }

  if (Array.isArray(product.images)) {
    result.push(
      ...product.images.filter(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0
      )
    );
  }

  if (Array.isArray(product.gallery)) {
    result.push(
      ...product.gallery.filter(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0
      )
    );
  }

  return Array.from(
    new Set(result)
  );
}

/* =========================================================
   CATEGORY HELPERS
========================================================= */

function getCategoryName(
  category: Category
) {
  return (
    category.name?.trim() ||
    "Category"
  );
}

function getCategoryId(
  category: Category,
  index: number
) {
  return String(
    category.id ??
      category.slug ??
      `category-${index}`
  );
}

/* =========================================================
   NORMALIZE API PRODUCTS
========================================================= */

function normalizeProducts(
  data: unknown
): Product[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const root =
    data as Record<string, unknown>;

  const rawProducts =
    Array.isArray(root.products)
      ? root.products
      : [];

  return rawProducts
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(
          item &&
            typeof item === "object"
        )
    )
    .map((item, index) => {
      const id =
        item.id ??
        item.externalId ??
        item.product_id ??
        `product-${index}`;

      const name =
        item.name ??
        item.product_name ??
        item.title ??
        "Unnamed Product";

      const price =
        item.price ??
        item.product_price ??
        0;

      const mrp =
        item.mrp ??
        item.product_mrp ??
        price;

      const categoryName =
        item.categoryName ??
        item.category_name ??
        (
          item.category &&
          typeof item.category ===
            "object" &&
          "name" in item.category
            ? (
                item.category as {
                  name?: string;
                }
              ).name
            : "Uncategorized"
        );

      const categoryId =
        item.categoryId ??
        item.category_id ??
        null;

      const brandName =
        item.brandName ??
        item.brand_name ??
        "";

      const image =
        typeof item.image ===
          "string"
          ? item.image
          : null;

      const images =
        Array.isArray(item.images)
          ? item.images.filter(
              (image): image is string =>
                typeof image ===
                  "string" &&
                image.trim().length > 0
            )
          : [];

      const gallery =
        Array.isArray(item.gallery)
          ? item.gallery.filter(
              (image): image is string =>
                typeof image ===
                  "string" &&
                image.trim().length > 0
            )
          : [];

      return {
        id:
          id as
            | number
            | string,

        externalId:
          item.externalId as
            | number
            | string
            | undefined,

        sku:
          typeof item.sku ===
          "string"
            ? item.sku
            : undefined,

        name:
          String(name),

        slug:
          typeof item.slug ===
          "string"
            ? item.slug
            : undefined,

        description:
          typeof item.description ===
          "string"
            ? item.description
            : null,

        price:
          price as
            | number
            | string,

        salePrice:
          item.salePrice as
            | number
            | string
            | null
            | undefined,

        mrp:
          mrp as
            | number
            | string,

        stock:
          Number(item.stock ?? 0),

        qty:
          Number(item.qty ?? 0),

        status:
          typeof item.status ===
          "string"
            ? item.status
            : undefined,

        featured:
          Boolean(item.featured),

        categoryId:
          categoryId as
            | number
            | string
            | null,

        categoryName:
          String(
            categoryName ??
              "Uncategorized"
          ),

        brandName:
          String(
            brandName ?? ""
          ),

        image,

        images,

        gallery,

        externalData:
          item.externalData,
      };
    });
}

/* =========================================================
   NORMALIZE CATEGORIES
========================================================= */

function normalizeCategories(
  data: unknown
): Category[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const root =
    data as Record<string, unknown>;

  const rawCategories =
    Array.isArray(root.categories)
      ? root.categories
      : [];

  return rawCategories
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(
          item &&
            typeof item === "object"
        )
    )
    .map((item, index) => ({
      id:
        (item.id ??
          item.category_id ??
          `category-${index}`) as
          | number
          | string,

      name:
        String(
          item.name ??
            item.category_name ??
            item.categoryName ??
            item.title ??
            "Category"
        ),

      slug:
        typeof item.slug ===
        "string"
          ? item.slug
          : undefined,

      image:
        typeof item.image ===
        "string"
          ? item.image
          : null,
    }));
}

/* =========================================================
   HOME PAGE
========================================================= */

export default function HomePage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [currentBanner, setCurrentBanner] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [cartCount, setCartCount] =
    useState(0);

  /* =======================================================
     FETCH PRODUCTS + CATEGORIES
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/products",
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            `Products API failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        console.log(
          "HOME /api/products RESPONSE:",
          data
        );

        const fetchedProducts =
          normalizeProducts(data);

        const fetchedCategories =
          normalizeCategories(data);

        console.log(
          "HOME PRODUCTS COUNT:",
          fetchedProducts.length
        );

        console.log(
          "HOME CATEGORIES COUNT:",
          fetchedCategories.length
        );

        console.log(
          "HOME FIRST PRODUCT:",
          fetchedProducts[0]
        );

        console.log(
          "HOME FIRST PRODUCT IMAGE:",
          fetchedProducts[0]
            ? getProductImage(
                fetchedProducts[0]
              )
            : ""
        );

        if (!cancelled) {
          setProducts(
            fetchedProducts
          );

          setCategories(
            fetchedCategories
          );
        }
      } catch (error) {
        console.error(
          "HOME FETCH ERROR:",
          error
        );

        if (!cancelled) {
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     CART COUNT
  ======================================================= */

  useEffect(() => {
    function readCart() {
      try {
        const raw =
          localStorage.getItem(
            "cart"
          );

        if (!raw) {
          setCartCount(0);
          return;
        }

        const cart =
          JSON.parse(raw);

        if (Array.isArray(cart)) {
          setCartCount(
            cart.reduce(
              (
                total,
                item
              ) =>
                total +
                Number(
                  item?.quantity ??
                    1
                ),
              0
            )
          );
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    }

    readCart();

    window.addEventListener(
      "cart-updated",
      readCart
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        readCart
      );
    };
  }, []);

  /* =======================================================
     AUTO BANNER
  ======================================================= */

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCurrentBanner(
          (prev) =>
            (prev + 1) %
            banners.length
        );
      }, 4500);

    return () =>
      clearInterval(timer);
  }, []);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            ?.toLowerCase()
            .includes(query) ||
          product.brandName
            ?.toLowerCase()
            .includes(query) ||
          product.categoryName
            ?.toLowerCase()
            .includes(query)
      );
    }, [products, search]);

  /* =======================================================
     ADD TO CART
  ======================================================= */

  function addToCart(
    product: Product
  ) {
    try {
      const raw =
        localStorage.getItem(
          "cart"
        );

      const cart =
        raw
          ? JSON.parse(raw)
          : [];

      if (!Array.isArray(cart)) {
        return;
      }

      const existingIndex =
        cart.findIndex(
          (item: Product) =>
            String(
              item.id
            ) ===
            String(
              product.id
            )
        );

      if (
        existingIndex >= 0
      ) {
        cart[
          existingIndex
        ].quantity =
          Number(
            cart[
              existingIndex
            ].quantity ?? 1
          ) + 1;
      } else {
        cart.push({
          ...product,
          quantity: 1,
        });
      }

      localStorage.setItem(
        "cart",
        JSON.stringify(cart)
      );

      setCartCount(
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item?.quantity ??
                1
            ),
          0
        )
      );

      window.dispatchEvent(
        new Event(
          "cart-updated"
        )
      );
    } catch (error) {
      console.error(
        "CART ERROR:",
        error
      );
    }
  }

  const banner =
    banners[currentBanner];

  const visibleCategories =
    categories.length
      ? categories.slice(0, 8)
      : fallbackCategories;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#fffdf5] text-[#101828]">

      {/* =====================================================
          TOP TRUST BAR
      ===================================================== */}

      <div className="border-b border-yellow-300 bg-[#ffd928]">
        <div className="mx-auto max-w-[1500px] px-4 py-2">
          <div className="flex items-center justify-center gap-5 overflow-hidden whitespace-nowrap text-[12px] font-semibold text-[#123b25] md:gap-10">

            <span className="flex items-center gap-2">
              <ShieldCheck size={16} />
              100% Genuine Products
            </span>

            <span className="hidden md:block">
              |
            </span>

            <span className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Secure Payments
            </span>

            <span className="hidden md:block">
              |
            </span>

            <span className="flex items-center gap-2">
              <Truck size={16} />
              Fast & Reliable Delivery
            </span>

            <span className="hidden md:block">
              |
            </span>

            <span className="flex items-center gap-2">
              <RotateCcw size={16} />
              Easy Returns
            </span>

            <span className="hidden lg:flex items-center gap-2">
              <Headphones size={16} />
              24x7 Customer Support
            </span>

          </div>
        </div>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto max-w-[1500px] px-4">

          <div className="flex h-[78px] items-center gap-4">

            {/* LOGO */}

            <Link
              href="/"
              className="flex min-w-fit items-center gap-2"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c6b38] text-white shadow-sm">
                <Gift size={25} />
              </div>

              <div className="leading-none">
                <div className="text-[25px] font-black tracking-tight text-[#146b3a]">
                  budgetree
                </div>

                <div className="mt-1 text-[9px] font-bold tracking-[2px] text-gray-500">
                  PREMIUM STORE
                </div>
              </div>
            </Link>

            {/* LOCATION */}

            <button
              type="button"
              className="hidden h-12 min-w-[145px] items-center gap-2 rounded-xl border border-gray-200 px-4 text-left md:flex"
            >
              <MapPin
                size={21}
                className="text-[#0b7139]"
              />

              <div>
                <p className="text-[10px] text-gray-500">
                  Deliver to
                </p>

                <p className="text-sm font-bold">
                  New Delhi
                </p>
              </div>

              <ChevronRight
                size={17}
                className="ml-auto rotate-90 text-gray-500"
              />
            </button>

            {/* SEARCH */}

            <div className="relative flex-1">

              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search for products, brands & more..."
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-14 text-sm outline-none transition focus:border-[#168044] focus:bg-white"
              />

              <button
                type="button"
                className="absolute right-1 top-1 h-10 w-11 rounded-lg bg-[#116b39] text-white"
              >
                <Search
                  size={19}
                  className="mx-auto"
                />
              </button>

            </div>

            {/* WISHLIST */}

            <Link
              href="/wishlist"
              className="hidden items-center gap-2 px-2 text-center md:flex"
            >
              <Heart size={23} />

              <span className="text-[11px] font-semibold">
                Wishlist
              </span>
            </Link>

            {/* ACCOUNT */}

            <Link
              href="/account"
              className="hidden items-center gap-2 px-2 text-center md:flex"
            >
              <User size={23} />

              <span className="text-[11px] font-semibold">
                Account
              </span>
            </Link>

            {/* CART */}

            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-2"
            >
              <ShoppingCart size={26} />

              <span className="hidden text-[11px] font-semibold md:block">
                Cart
              </span>

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0c713a] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="md:hidden"
            >
              <Menu size={25} />
            </button>

          </div>

          {/* NAV */}

          <div className="hidden h-12 items-center justify-between border-t border-gray-100 md:flex">

            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-lg bg-[#116b39] px-5 py-2 text-sm font-bold text-white"
            >
              <Menu size={17} />
              All Categories
            </Link>

            <nav className="flex items-center gap-9 text-sm font-semibold">

              <Link href="/">
                Home
              </Link>

              <Link href="/shop">
                Shop
              </Link>

              <Link href="/shop">
                Collections
              </Link>

              <Link href="/track-order">
                Track Order
              </Link>

              <Link href="/corporate">
                Corporate Gifting
              </Link>

              <Link href="/contact">
                Contact Us
              </Link>

            </nav>

            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-lg bg-[#ffd526] px-5 py-2 text-sm font-bold text-[#123b25]"
            >
              <Gift size={17} />
              Deals of the Day
            </Link>

          </div>

        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-3 pt-4 md:px-5">

        <div className="relative h-[300px] overflow-hidden rounded-2xl bg-[#ffd928] shadow-lg md:h-[400px] lg:h-[440px]">

          <div className="absolute -right-20 -top-32 h-[400px] w-[400px] rounded-full bg-[#168044]/20" />

          <div className="absolute -bottom-40 left-[35%] h-[450px] w-[450px] rounded-full bg-white/15" />

          <div className="absolute inset-0 bg-gradient-to-r from-[#ffe45b] via-[#ffd928] to-[#ffcf18]" />

          <div className="relative z-10 flex h-full items-center px-7 md:px-14 lg:px-16">

            <div className="max-w-[580px]">

              <span className="inline-flex rounded-md bg-[#116b39] px-3 py-1.5 text-[10px] font-bold tracking-wider text-white md:text-xs">
                PREMIUM COLLECTION
              </span>

              <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight text-[#10251a] md:text-6xl lg:text-7xl">

                {banner.title}

                <br />

                <span className="text-[#08733c]">
                  {banner.highlight}
                </span>

              </h1>

              <p className="mt-4 max-w-[480px] text-sm font-medium leading-6 text-[#24362b] md:text-base">
                {banner.subtitle}
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-[#173b28]">

                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={17} />
                  Genuine
                </span>

                <span className="flex items-center gap-1.5">
                  <Truck size={17} />
                  Fast Delivery
                </span>

                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={17} />
                  Secure
                </span>

              </div>

              <Link
                href={banner.link}
                className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#116b39] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
              >
                {banner.button}
                <ArrowRight size={18} />
              </Link>

            </div>

            <div className="absolute right-7 top-8 hidden rounded-full bg-[#14763f] px-8 py-7 text-center text-white shadow-xl md:block">

              <p className="text-xs font-bold">
                {banner.offer}
              </p>

              <p className="text-4xl font-black">
                DEAL
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setCurrentBanner(
                (prev) =>
                  (prev - 1 + banners.length) %
                  banners.length
              )
            }
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 md:left-5"
          >
            <ChevronLeft size={21} />
          </button>

          <button
            type="button"
            onClick={() =>
              setCurrentBanner(
                (prev) =>
                  (prev + 1) %
                  banners.length
              )
            }
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 md:right-5"
          >
            <ChevronRight size={21} />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">

            {banners.map(
              (_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() =>
                    setCurrentBanner(
                      index
                    )
                  }
                  className={`h-2 rounded-full transition-all ${
                    index ===
                    currentBanner
                      ? "w-7 bg-[#116b39]"
                      : "w-2 bg-white"
                  }`}
                />
              )
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          BENEFITS
      ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-3 pt-5 md:px-5">

        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:grid-cols-4">

          <div className="flex items-center gap-3 border-b border-gray-100 p-4 md:border-b-0 md:border-r">
            <Truck className="text-[#08733c]" />

            <div>
              <p className="text-sm font-bold">
                Free Delivery
              </p>

              <p className="text-xs text-gray-500">
                On orders above ₹499
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-gray-100 p-4 md:border-b-0 md:border-r">
            <ShieldCheck className="text-[#08733c]" />

            <div>
              <p className="text-sm font-bold">
                Secure Payments
              </p>

              <p className="text-xs text-gray-500">
                100% safe & secure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 md:border-r">
            <ShieldCheck className="text-[#08733c]" />

            <div>
              <p className="text-sm font-bold">
                Genuine Products
              </p>

              <p className="text-xs text-gray-500">
                Trusted & verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4">
            <RotateCcw className="text-[#08733c]" />

            <div>
              <p className="text-sm font-bold">
                Easy Returns
              </p>

              <p className="text-xs text-gray-500">
                Hassle-free returns
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-3 pt-8 md:px-5">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="text-xl font-black md:text-2xl">
            Shop by Categories
          </h2>

          <Link
            href="/shop"
            className="flex items-center gap-1 text-sm font-bold text-[#08733c]"
          >
            View All
            <ArrowRight size={16} />
          </Link>

        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">

          {visibleCategories.map(
            (
              category,
              index
            ) => {

              const name =
                getCategoryName(
                  category
                );

              const categoryId =
                getCategoryId(
                  category,
                  index
                );

              return (
                <Link
                  href={`/shop?category=${encodeURIComponent(
                    category.slug ||
                      name
                  )}`}
                  key={categoryId}
                  className="group rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#168044] hover:shadow-md"
                >

                  <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#f1f8e8] text-[#08733c]">

                    {category.image ? (
                      <img
                        src={category.image}
                        alt={name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <span className="text-2xl">
                        🛍️
                      </span>
                    )}

                  </div>

                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-gray-800 transition group-hover:text-[#08733c]">
                    {name}
                  </p>

                </Link>
              );
            }
          )}

        </div>

      </section>

      {/* =====================================================
          FEATURED PRODUCTS
      ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-3 pt-9 md:px-5">

        <div className="mb-4 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-black md:text-2xl">
              Featured Products
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Handpicked products just for you
            </p>

          </div>

          <Link
            href="/shop"
            className="flex items-center gap-1 text-sm font-bold text-[#08733c]"
          >
            View All
            <ArrowRight size={16} />
          </Link>

        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-[340px] animate-pulse rounded-xl bg-gray-100"
                />
              )
            )}

          </div>
        ) : filteredProducts.length ===
          0 ? (

          <div className="rounded-xl bg-white p-10 text-center">

            <p className="font-semibold">
              No products found
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

            {filteredProducts
              .slice(0, 18)
              .map(
                (product) => {

                  const image =
                    getProductImage(
                      product
                    );

                  const price =
                    Number(
                      product.price ??
                        product.salePrice ??
                        0
                    );

                  const mrp =
                    Number(
                      product.mrp ??
                        price
                    );

                  const discount =
                    mrp > price &&
                    price > 0
                      ? Math.round(
                          ((mrp -
                            price) /
                            mrp) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={String(
                        product.id
                      )}
                      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >

                      {/* IMAGE */}

                      <Link
                        href={`/product/${product.id}`}
                        className="relative block"
                      >

                        {discount > 0 && (
                          <span className="absolute left-2 top-2 z-10 rounded-md bg-[#0c713a] px-2 py-1 text-[10px] font-bold text-white">
                            {discount}% OFF
                          </span>
                        )}

                        <div className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                          <Heart
                            size={16}
                            className="text-gray-600"
                          />
                        </div>

                        <div className="flex h-[210px] items-center justify-center overflow-hidden bg-white p-4">

                          {image ? (

                            <img
                              src={image}
                              alt={
                                product.name ||
                                "Product"
                              }
                              loading="lazy"
                              className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                              onError={(e) => {
                                console.error(
                                  "HOME IMAGE FAILED:",
                                  image
                                );

                                e.currentTarget.style.display =
                                  "none";

                                const parent =
                                  e.currentTarget.parentElement;

                                if (
                                  parent &&
                                  !parent.querySelector(
                                    "[data-image-fallback]"
                                  )
                                ) {
                                  const fallback =
                                    document.createElement(
                                      "div"
                                    );

                                  fallback.setAttribute(
                                    "data-image-fallback",
                                    "true"
                                  );

                                  fallback.className =
                                    "flex h-full w-full items-center justify-center bg-gray-50 text-gray-300";

                                  fallback.innerHTML =
                                    "🛍️";

                                  parent.appendChild(
                                    fallback
                                  );
                                }
                              }}
                            />

                          ) : (

                            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                              <Gift size={45} />
                            </div>

                          )}

                        </div>

                      </Link>

                      {/* DETAILS */}

                      <div className="p-3">

                        <p className="mb-1 line-clamp-1 text-[10px] font-bold uppercase text-[#08733c]">
                          {product.categoryName ||
                            "Premium Product"}
                        </p>

                        <Link
                          href={`/product/${product.id}`}
                        >
                          <h3 className="line-clamp-2 min-h-[38px] text-sm font-semibold leading-5 text-gray-800 hover:text-[#08733c]">
                            {product.name ||
                              "Product"}
                          </h3>
                        </Link>

                        {product.brandName && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-gray-500">
                            {product.brandName}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2">

                          <span className="text-lg font-black text-[#111827]">
                            {formatPrice(
                              price
                            )}
                          </span>

                          {mrp > price && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(
                                mrp
                              )}
                            </span>
                          )}

                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              addToCart(
                                product
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#ffd21f] py-2.5 text-xs font-black text-[#123b25] transition hover:bg-[#ffca00]"
                          >
                            <ShoppingCart
                              size={14}
                            />
                            Add to Cart
                          </button>

                          <Link
                            href={`/product/${product.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200"
                          >
                            <ArrowRight
                              size={16}
                            />
                          </Link>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

          </div>

        )}

      </section>

      {/* =====================================================
          YELLOW OFFER
      ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-3 pt-9 md:px-5">

        <div className="relative overflow-hidden rounded-2xl bg-[#ffd928] p-7 md:p-10">

          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#168044]/20" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-[#116b39]">
                Extra Savings
              </p>

              <h2 className="mt-1 text-3xl font-black md:text-4xl">
                Use Code: BUDGET10
              </h2>

              <p className="mt-2 text-sm font-medium">
                Get extra 10% OFF on selected prepaid orders
              </p>

            </div>

            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-lg bg-[#116b39] px-7 py-3 text-sm font-bold text-white shadow-md"
            >
              SHOP NOW
              <ArrowRight size={17} />
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          BEST SELLERS
      ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-3 pb-10 pt-9 md:px-5">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="text-xl font-black md:text-2xl">
            Best Sellers
          </h2>

          <Link
            href="/shop"
            className="flex items-center gap-1 text-sm font-bold text-[#08733c]"
          >
            View All
            <ArrowRight size={16} />
          </Link>

        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

          {products
            .slice(18, 24)
            .map(
              (product) => {

                const image =
                  getProductImage(
                    product
                  );

                const price =
                  Number(
                    product.price ??
                      0
                  );

                const mrp =
                  Number(
                    product.mrp ??
                      price
                  );

                return (
                  <Link
                    href={`/product/${product.id}`}
                    key={String(
                      product.id
                    )}
                    className="group rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >

                    <div className="flex h-[180px] items-center justify-center overflow-hidden">

                      {image ? (
                        <img
                          src={image}
                          alt={
                            product.name ||
                            "Product"
                          }
                          loading="lazy"
                          className="h-full w-full object-contain transition group-hover:scale-105"
                        />
                      ) : (
                        <Gift
                          size={45}
                          className="text-gray-300"
                        />
                      )}

                    </div>

                    <p className="mt-3 line-clamp-2 text-sm font-semibold">
                      {product.name ||
                        "Premium Product"}
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      <span className="font-black">
                        {formatPrice(
                          price
                        )}
                      </span>

                      {mrp > price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(
                            mrp
                          )}
                        </span>
                      )}

                    </div>

                    <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-orange-500">
                      <Star
                        size={13}
                        fill="currentColor"
                      />
                      4.5
                    </div>

                  </Link>
                );
              }
            )}

        </div>

      </section>

      {/* =====================================================
          TRUST STRIP
      ===================================================== */}

      <section className="border-t border-gray-100 bg-white">

        <div className="mx-auto grid max-w-[1500px] grid-cols-2 md:grid-cols-6">

          {[
            [
              "100% Genuine",
              ShieldCheck,
            ],
            [
              "4.6+ Star Rating",
              Star,
            ],
            [
              "Secure Payments",
              ShieldCheck,
            ],
            [
              "300+ Brands",
              Tag,
            ],
            [
              "7 Days Returns",
              RotateCcw,
            ],
            [
              "Pan India Delivery",
              Truck,
            ],
          ].map(
            ([text, Icon], index) => {

              const IconComponent =
                Icon as typeof ShieldCheck;

              return (
                <div
                  key={index}
                  className="flex items-center justify-center gap-2 border-b border-gray-100 p-5 text-center md:border-b-0 md:border-r last:border-r-0"
                >

                  <IconComponent
                    size={21}
                    className="text-[#08733c]"
                  />

                  <span className="text-xs font-bold text-gray-700">
                    {text as string}
                  </span>

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#0c3520] text-white">

        <div className="mx-auto max-w-[1500px] px-5 py-10">

          <div className="grid gap-8 md:grid-cols-4">

            <div>

              <div className="text-2xl font-black">
                budgetree
              </div>

              <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
                Premium products, gifting and lifestyle essentials delivered with trust.
              </p>

            </div>

            <div>

              <h3 className="font-bold">
                Quick Links
              </h3>

              <div className="mt-3 space-y-2 text-sm text-white/70">

                <Link
                  className="block hover:text-white"
                  href="/"
                >
                  Home
                </Link>

                <Link
                  className="block hover:text-white"
                  href="/shop"
                >
                  Shop
                </Link>

                <Link
                  className="block hover:text-white"
                  href="/track-order"
                >
                  Track Order
                </Link>

                <Link
                  className="block font-semibold text-[#ffd928] transition hover:text-white"
                  href="/admin"
                >
                  Admin Portal
                </Link>

              </div>

            </div>

            <div>

              <h3 className="font-bold">
                Customer Support
              </h3>

              <div className="mt-3 space-y-2 text-sm text-white/70">

                <p>
                  Contact Us
                </p>

                <p>
                  Returns & Refunds
                </p>

                <p>
                  Shipping Policy
                </p>

              </div>

            </div>

            <div>

              <h3 className="font-bold">
                Why Budgetree?
              </h3>

              <div className="mt-3 space-y-2 text-sm text-white/70">

                <p>
                  ✓ Genuine Products
                </p>

                <p>
                  ✓ Secure Payments
                </p>

                <p>
                  ✓ Fast Delivery
                </p>

                <p>
                  ✓ Easy Returns
                </p>

              </div>

            </div>

          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-white/50">
            © {new Date().getFullYear()} Budgetree Premium Store. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}