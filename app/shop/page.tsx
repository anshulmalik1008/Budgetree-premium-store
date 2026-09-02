"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Zap,
  Check,
} from "lucide-react";

type ProductImageObject = {
  url?: string | null;
  alt?: string | null;
  sortOrder?: number;
};

type Product = {
  id: number | string;
  product_id?: number | string;
  externalId?: number | string;

  sku?: string;
  sku_code?: string;

  name?: string;
  product_name?: string;
  slug?: string;

  description?: string | null;
  shortDescription?: string | null;
  short_description?: string | null;

  price?: number | string | null;
  mrp?: number | string | null;
  salePrice?: number | string | null;

  product_price?: number | string | null;
  product_mrp?: number | string | null;
  basic_price?: number | string | null;

  stock?: number | string | null;
  qty?: number | string | null;

  categoryId?: number | string | null;
  categoryName?: string | null;

  category?: {
    id?: number | string | null;
    name?: string | null;
  };

  subCategoryId?: number | string | null;
  subCategoryName?: string | null;

  subCategory?: {
    id?: number | string | null;
    name?: string | null;
  };

  brandId?: number | string | null;
  brandName?: string | null;

  brand?: {
    id?: number | string | null;
    name?: string | null;
  };

  image?: string | null;
  image_url?: string | null;
  primary_image?: string | null;

  images?:
    | string[]
    | Record<string, unknown>
    | ProductImageObject[];

  gallery?: string[];
};

type Category = {
  id: number | string;
  name: string;
  slug?: string;
  image?: string | null;
};

type CartItem = {
  id?: string | number;
  productId?: string | number;
  quantity?: number;
  [key: string]: unknown;
};

const CART_KEY = "bps_cart";
const PRODUCTS_PER_PAGE = 24;

function getProductId(product: Product): string {
  return String(
    product.id ??
      product.product_id ??
      product.externalId ??
      ""
  );
}

function getProductName(product: Product): string {
  return (
    product.name ??
    product.product_name ??
    "Premium Product"
  );
}

function getProductSku(product: Product): string {
  return (
    product.sku ??
    product.sku_code ??
    "Product"
  );
}

function getProductPrice(product: Product): number {
  const value =
    product.salePrice ??
    product.product_price ??
    product.price ??
    product.basic_price ??
    0;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) &&
    numberValue >= 0
    ? numberValue
    : 0;
}

function getProductMrp(product: Product): number {
  const value =
    product.mrp ??
    product.product_mrp ??
    0;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) &&
    numberValue > 0
    ? numberValue
    : 0;
}

function getProductStock(product: Product): number {
  const value =
    product.stock ??
    product.qty ??
    999999;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 999999;
  }

  return numberValue;
}

function getProductImage(product: Product): string {
  const images = product.images;

  if (Array.isArray(images)) {
    for (const image of images) {
      if (
        typeof image === "string" &&
        image.trim()
      ) {
        return image;
      }

      if (
        image &&
        typeof image === "object" &&
        "url" in image
      ) {
        const url = (
          image as ProductImageObject
        ).url;

        if (
          typeof url === "string" &&
          url.trim()
        ) {
          return url;
        }
      }
    }
  }

  if (
    images &&
    !Array.isArray(images) &&
    typeof images === "object"
  ) {
    const objectImages =
      images as Record<string, unknown>;

    const possibleKeys = [
      "image1",
      "image2",
      "image3",
      "image4",
      "image5",
      "url",
      "image",
      "image_url",
    ];

    for (const key of possibleKeys) {
      const value =
        objectImages[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value;
      }
    }
  }

  if (
    Array.isArray(product.gallery) &&
    product.gallery.length > 0
  ) {
    const first =
      product.gallery.find(
        (item) =>
          typeof item === "string" &&
          item.trim()
      );

    if (first) {
      return first;
    }
  }

  return (
    product.image ??
    product.image_url ??
    product.primary_image ??
    "/placeholder-product.png"
  );
}

function getCategoryName(
  product: Product
): string {
  return (
    product.categoryName ??
    product.category?.name ??
    "Uncategorized"
  );
}

function getBrandName(
  product: Product
): string {
  return (
    product.brandName ??
    product.brand?.name ??
    ""
  );
}

function getSubCategoryName(
  product: Product
): string {
  return (
    product.subCategoryName ??
    product.subCategory?.name ??
    ""
  );
}

function getDiscount(
  product: Product
): number {
  const mrp =
    getProductMrp(product);

  const price =
    getProductPrice(product);

  if (
    mrp <= 0 ||
    price <= 0 ||
    mrp <= price
  ) {
    return 0;
  }

  return Math.round(
    ((mrp - price) / mrp) * 100
  );
}

function formatPrice(
  price: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(price);
}

function readCart(): CartItem[] {
  try {
    const raw =
      localStorage.getItem(
        CART_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveCart(
  cart: CartItem[]
): void {
  const value =
    JSON.stringify(cart);

  localStorage.setItem(
    CART_KEY,
    value
  );

  window.dispatchEvent(
    new Event("cart-updated")
  );

  window.dispatchEvent(
    new StorageEvent("storage", {
      key: CART_KEY,
      newValue: value,
    })
  );
}

export default function ShopPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState("default");

  const [page, setPage] =
    useState(1);

  const [cartCount, setCartCount] =
    useState(0);

  const [cartMessage, setCartMessage] =
    useState("");

  /*
   * ============================
   * CART COUNT
   * ============================
   */

  useEffect(() => {
    function updateCartCount() {
      const cart =
        readCart();

      const count =
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            Math.max(
              1,
              Number(
                item.quantity
              ) || 1
            ),
          0
        );

      setCartCount(count);
    }

    updateCartCount();

    window.addEventListener(
      "cart-updated",
      updateCartCount
    );

    window.addEventListener(
      "storage",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        updateCartCount
      );

      window.removeEventListener(
        "storage",
        updateCartCount
      );
    };
  }, []);

  /*
   * ============================
   * FETCH ALL PRODUCTS
   * ============================
   *
   * IMPORTANT:
   * API ko page=1&size=100 bhej rahe hain
   * taaki SiriPay ke 100 products ek
   * baar me frontend ko mil jayein.
   *
   * Frontend pagination 24/page karega.
   */

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/products?page=1&size=100",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ??
              "Failed to load products"
          );
        }

        if (
          !data ||
          data.success === false
        ) {
          throw new Error(
            data?.message ??
              "Failed to load products"
          );
        }

        if (cancelled) {
          return;
        }

        /*
         * Products
         */

        const apiProducts =
          Array.isArray(
            data.products
          )
            ? data.products
            : [];

        setProducts(
          apiProducts
        );

        /*
         * Categories
         *
         * API categories ko directly
         * store kar rahe hain.
         */

        const apiCategories =
          Array.isArray(
            data.categories
          )
            ? data.categories
            : [];

        setCategories(
          apiCategories
        );

        console.log(
          "SHOP PRODUCTS:",
          apiProducts.length
        );

        console.log(
          "SHOP CATEGORIES:",
          apiCategories.length
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "SHOP PRODUCTS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================
   * UNIQUE CATEGORIES
   * ============================
   */

  const uniqueCategories =
    useMemo<Category[]>(() => {
      const seen =
        new Set<string>();

      const result: Category[] =
        [];

      for (const category of categories) {
        const name =
          String(
            category?.name ??
              ""
          ).trim();

        if (!name) {
          continue;
        }

        const id =
          String(
            category?.id ??
              ""
          );

        const key =
          id || name;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);

        result.push({
          ...category,
          id:
            category.id ??
            name,
          name,
        });
      }

      return result;
    }, [categories]);

  /*
   * ============================
   * ADD TO CART
   * ============================
   */

  function addToCart(
    event: React.MouseEvent,
    product: Product
  ) {
    event.preventDefault();
    event.stopPropagation();

    const productId =
      getProductId(product);

    if (!productId) {
      setCartMessage(
        "Product ID missing."
      );
      return;
    }

    if (
      getProductStock(product) <=
      0
    ) {
      setCartMessage(
        "This product is out of stock."
      );
      return;
    }

    const existingCart =
      readCart();

    const existingIndex =
      existingCart.findIndex(
        (item) =>
          String(
            item.id ??
              item.productId ??
              ""
          ) === productId
      );

    const image =
      getProductImage(product);

    const price =
      getProductPrice(product);

    const mrp =
      getProductMrp(product);

    const cartProduct = {
      id: productId,

      productId,

      product_id:
        product.product_id ??
        productId,

      externalId:
        product.externalId,

      name:
        getProductName(product),

      product_name:
        getProductName(product),

      sku:
        getProductSku(product),

      sku_code:
        product.sku_code ??
        getProductSku(product),

      price,

      salePrice:
        product.salePrice ??
        price,

      product_price:
        product.product_price ??
        price,

      mrp,

      product_mrp:
        product.product_mrp ??
        mrp,

      basic_price:
        product.basic_price ??
        price,

      image,

      image_url: image,

      primary_image: image,

      images:
        product.images,

      gallery:
        product.gallery,

      description:
        product.description ??
        null,

      shortDescription:
        product.shortDescription ??
        product.short_description ??
        null,

      categoryId:
        product.categoryId ??
        null,

      categoryName:
        getCategoryName(product),

      subCategoryId:
        product.subCategoryId ??
        null,

      subCategoryName:
        getSubCategoryName(product),

      brandId:
        product.brandId ??
        null,

      brandName:
        getBrandName(product),

      stock:
        getProductStock(product),

      quantity: 1,
    };

    if (existingIndex >= 0) {
      const oldItem =
        existingCart[
          existingIndex
        ];

      existingCart[
        existingIndex
      ] = {
        ...oldItem,
        ...cartProduct,
        quantity:
          Math.max(
            1,
            Number(
              oldItem.quantity
            ) || 1
          ) + 1,
      };
    } else {
      existingCart.push(
        cartProduct
      );
    }

    saveCart(
      existingCart
    );

    setCartMessage(
      `${getProductName(
        product
      )} added to cart`
    );

    window.setTimeout(() => {
      setCartMessage("");
    }, 2200);
  }

  /*
   * ============================
   * BUY NOW
   * ============================
   */

  function buyNow(
    event: React.MouseEvent,
    product: Product
  ) {
    event.preventDefault();
    event.stopPropagation();

    const productId =
      getProductId(product);

    if (!productId) {
      setCartMessage(
        "Product ID missing."
      );
      return;
    }

    if (
      getProductStock(product) <=
      0
    ) {
      setCartMessage(
        "This product is out of stock."
      );
      return;
    }

    const image =
      getProductImage(product);

    const price =
      getProductPrice(product);

    const mrp =
      getProductMrp(product);

    const buyNowItem = {
      id: productId,

      productId,

      product_id:
        product.product_id ??
        productId,

      externalId:
        product.externalId,

      name:
        getProductName(product),

      product_name:
        getProductName(product),

      sku:
        getProductSku(product),

      sku_code:
        product.sku_code ??
        getProductSku(product),

      price,

      salePrice:
        product.salePrice ??
        price,

      product_price:
        product.product_price ??
        price,

      mrp,

      product_mrp:
        product.product_mrp ??
        mrp,

      basic_price:
        product.basic_price ??
        price,

      image,

      image_url: image,

      primary_image: image,

      images:
        product.images,

      gallery:
        product.gallery,

      description:
        product.description ??
        null,

      shortDescription:
        product.shortDescription ??
        product.short_description ??
        null,

      categoryId:
        product.categoryId ??
        null,

      categoryName:
        getCategoryName(product),

      subCategoryId:
        product.subCategoryId ??
        null,

      subCategoryName:
        getSubCategoryName(product),

      brandId:
        product.brandId ??
        null,

      brandName:
        getBrandName(product),

      stock:
        getProductStock(product),

      quantity: 1,
    };

    localStorage.setItem(
      CART_KEY,
      JSON.stringify([
        buyNowItem,
      ])
    );

    localStorage.setItem(
      "bps_buy_now",
      JSON.stringify(
        buyNowItem
      )
    );

    window.dispatchEvent(
      new Event("cart-updated")
    );

    window.location.href =
      "/checkout";
  }

  /*
   * ============================
   * FILTER + SEARCH + SORT
   * ============================
   */

  const filteredProducts =
    useMemo<Product[]>(() => {
      let result =
        [...products];

      /*
       * CATEGORY
       */

      if (
        selectedCategory !==
        "ALL"
      ) {
        const selected =
          selectedCategory
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (product) =>
              getCategoryName(
                product
              )
                .trim()
                .toLowerCase() ===
              selected
          );
      }

      /*
       * SEARCH
       */

      const query =
        search
          .trim()
          .toLowerCase();

      if (query) {
        result =
          result.filter(
            (product) => {
              const name =
                getProductName(
                  product
                ).toLowerCase();

              const brand =
                getBrandName(
                  product
                ).toLowerCase();

              const category =
                getCategoryName(
                  product
                ).toLowerCase();

              const subCategory =
                getSubCategoryName(
                  product
                ).toLowerCase();

              const sku =
                getProductSku(
                  product
                ).toLowerCase();

              const description =
                String(
                  product.description ??
                    ""
                ).toLowerCase();

              return (
                name.includes(
                  query
                ) ||
                brand.includes(
                  query
                ) ||
                category.includes(
                  query
                ) ||
                subCategory.includes(
                  query
                ) ||
                sku.includes(
                  query
                ) ||
                description.includes(
                  query
                )
              );
            }
          );
      }

      /*
       * SORT
       */

      if (sort === "low") {
        result.sort(
          (a, b) =>
            getProductPrice(
              a
            ) -
            getProductPrice(b)
        );
      }

      if (sort === "high") {
        result.sort(
          (a, b) =>
            getProductPrice(
              b
            ) -
            getProductPrice(a)
        );
      }

      if (sort === "name") {
        result.sort(
          (a, b) =>
            getProductName(
              a
            ).localeCompare(
              getProductName(
                b
              )
            )
        );
      }

      return result;
    }, [
      products,
      selectedCategory,
      search,
      sort,
    ]);

  /*
   * ============================
   * PAGINATION
   * ============================
   */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredProducts.length /
          PRODUCTS_PER_PAGE
      )
    );

  /*
   * Current page ko safe rakho.
   */

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
  ]);

  /*
   * Search/category/sort change
   * hone par first page.
   */

  useEffect(() => {
    setPage(1);
  }, [
    selectedCategory,
    search,
    sort,
  ]);

  const currentProducts =
    filteredProducts.slice(
      (page - 1) *
        PRODUCTS_PER_PAGE,
      page *
        PRODUCTS_PER_PAGE
    );

  /*
   * ============================
   * PAGE NUMBERS
   * ============================
   */

  const pageNumbers =
    useMemo<number[]>(() => {
      const numbers: number[] =
        [];

      const start =
        Math.max(
          1,
          page - 2
        );

      const end =
        Math.min(
          totalPages,
          page + 2
        );

      for (
        let number = start;
        number <= end;
        number++
      ) {
        numbers.push(number);
      }

      return numbers;
    }, [
      page,
      totalPages,
    ]);

  /*
   * ============================
   * LOADING
   * ============================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf4]">
        <div className="mx-auto max-w-[1400px] px-4 py-8">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({
              length: 10,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl bg-white"
                >
                  <div className="aspect-square animate-pulse bg-gray-200" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 animate-pulse rounded bg-gray-200" />

                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />

                    <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================
   * ERROR
   * ============================
   */

  if (error) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#fffdf4] px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
            !
          </div>

          <h2 className="text-xl font-black text-gray-900">
            Products unavailable
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-xl bg-[#0b6b3a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#095c31]"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /*
   * ============================
   * PAGE
   * ============================
   */

  return (
    <main className="min-h-screen bg-[#fffdf4] text-[#10251a]">
      {/* PROMO BAR */}

      <div className="bg-[#ffd928]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-5 px-4 py-2 text-[11px] font-black text-[#123b25] sm:gap-10">
          <span>
            ✦ Premium Products
          </span>

          <span className="hidden sm:block">
            ✦ Secure Checkout
          </span>

          <span className="hidden md:block">
            ✦ Fast Delivery
          </span>
        </div>
      </div>

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b6b3a] text-white shadow-sm">
              <span className="text-xl font-black">
                b
              </span>
            </div>

            <div>
              <div className="text-2xl font-black tracking-tight text-[#116b39]">
                budgetree
              </div>

              <div className="text-[8px] font-bold tracking-[2px] text-gray-400">
                PREMIUM STORE
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-black text-[#123b25] transition hover:border-[#0b6b3a] hover:bg-[#f1f8e8] sm:flex"
            >
              <ArrowLeft size={15} />
              Back to Home
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-xl bg-[#0b6b3a] px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-[#095c31] sm:px-4"
            >
              <ShoppingCart size={17} />

              <span className="hidden sm:block">
                Cart
              </span>

              {cartCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#ffd928] px-1 text-[10px] font-black text-[#123b25]">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-2 sm:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0b6b3a]"
          >
            <ArrowLeft size={13} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* CART MESSAGE */}

      {cartMessage && (
        <div className="fixed right-4 top-24 z-[100] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-[#0b6b3a]/20 bg-white px-5 py-3 text-sm font-bold text-[#0b6b3a] shadow-2xl">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf6df]">
            <Check size={15} />
          </div>

          {cartMessage}
        </div>
      )}

      {/* HERO */}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 text-sm font-bold text-[#0b7a3b]">
                Home / Shop
              </div>

              <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-5xl">
                Shop Premium
                Products
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Discover premium
                products, gifting
                essentials and
                everyday favourites.
              </p>
            </div>

            {/* SEARCH */}

            <div className="w-full lg:max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search products, brands..."
                  className="h-13 w-full rounded-2xl border border-gray-200 bg-[#fffdf4] pl-12 pr-4 text-sm outline-none transition focus:border-[#0b7a3b] focus:bg-white focus:ring-4 focus:ring-[#0b7a3b]/10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALL CATEGORIES */}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto py-4">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(
                  "ALL"
                );
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-black transition ${
                selectedCategory ===
                "ALL"
                  ? "bg-[#0b7a3b] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Products
            </button>

            {uniqueCategories.map(
              (category) => (
                <button
                  type="button"
                  key={`${String(
                    category.id
                  )}-${category.name}`}
                  onClick={() => {
                    setSelectedCategory(
                      category.name
                    );
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    selectedCategory ===
                    category.name
                      ? "bg-[#0b7a3b] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {
                    category.name
                  }
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}

      <section className="mx-auto max-w-[1400px] px-4 py-7 md:px-6">
        {/* TOOLBAR */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {filteredProducts.length >
            0 ? (
              <>
                Showing{" "}
                <span className="font-black text-gray-900">
                  {(page - 1) *
                    PRODUCTS_PER_PAGE +
                    1}
                  –
                  {Math.min(
                    page *
                      PRODUCTS_PER_PAGE,
                    filteredProducts.length
                  )}
                </span>{" "}
                products
              </>
            ) : (
              "No products"
            )}
          </div>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#0b7a3b]"
          >
            <option value="default">
              Sort: Recommended
            </option>

            <option value="low">
              Price: Low to High
            </option>

            <option value="high">
              Price: High to Low
            </option>

            <option value="name">
              Name: A-Z
            </option>
          </select>
        </div>

        {/* EMPTY */}

        {currentProducts.length ===
        0 ? (
          <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-sm">
            <div className="text-5xl">
              🔍
            </div>

            <h2 className="mt-4 text-xl font-black text-gray-900">
              No products found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try another search or
              category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory(
                  "ALL"
                );
                setPage(1);
              }}
              className="mt-5 rounded-xl bg-[#0b7a3b] px-5 py-3 text-sm font-bold text-white"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* GRID */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {currentProducts.map(
                (product) => {
                  const image =
                    getProductImage(
                      product
                    );

                  const category =
                    getCategoryName(
                      product
                    );

                  const brand =
                    getBrandName(
                      product
                    );

                  const price =
                    getProductPrice(
                      product
                    );

                  const mrp =
                    getProductMrp(
                      product
                    );

                  const discount =
                    getDiscount(
                      product
                    );

                  const stock =
                    getProductStock(
                      product
                    );

                  const outOfStock =
                    stock <= 0;

                  const productId =
                    getProductId(
                      product
                    );

                  const productSlug =
                    product.slug ||
                    productId;

                  return (
                    <article
                      key={
                        productId
                      }
                      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#0b7a3b]/20 hover:shadow-xl"
                    >
                      <Link
                        href={`/product/${productSlug}`}
                        className="block"
                      >
                        <div className="relative aspect-square overflow-hidden bg-white">
                          {discount >
                            0 && (
                            <div className="absolute left-3 top-3 z-10 rounded-lg bg-[#0b7a3b] px-2.5 py-1 text-[11px] font-black text-white">
                              {discount}%
                              OFF
                            </div>
                          )}

                          <Image
                            src={
                              image
                            }
                            alt={getProductName(
                              product
                            )}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-contain p-4 transition duration-500 group-hover:scale-105"
                            unoptimized
                          />

                          {outOfStock && (
                            <div className="absolute bottom-3 left-3 rounded-lg bg-gray-900/90 px-2.5 py-1 text-[10px] font-black text-white">
                              OUT OF
                              STOCK
                            </div>
                          )}

                          {Array.isArray(
                            product.images
                          ) &&
                            product
                              .images
                              .length >
                              1 && (
                              <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-600 shadow">
                                {
                                  product
                                    .images
                                    .length
                                }{" "}
                                photos
                              </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 p-3.5 md:p-4">
                          <div className="mb-1 truncate text-[10px] font-black uppercase tracking-wide text-[#0b7a3b]">
                            {
                              category
                            }
                          </div>

                          {brand && (
                            <div className="mb-1 text-xs font-bold text-gray-400">
                              {
                                brand
                              }
                            </div>
                          )}

                          <h2 className="line-clamp-2 min-h-[40px] text-sm font-black leading-5 text-gray-900 transition group-hover:text-[#0b7a3b] md:text-[15px]">
                            {getProductName(
                              product
                            )}
                          </h2>

                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-lg font-black text-gray-900">
                              {formatPrice(
                                price
                              )}
                            </span>

                            {mrp >
                              price && (
                              <span className="text-xs font-semibold text-gray-400 line-through">
                                {formatPrice(
                                  mrp
                                )}
                              </span>
                            )}
                          </div>

                          {getSubCategoryName(
                            product
                          ) && (
                            <div className="mt-2 truncate text-xs text-gray-400">
                              {getSubCategoryName(
                                product
                              )}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* ACTIONS */}

                      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-3">
                        <button
                          type="button"
                          disabled={
                            outOfStock
                          }
                          onClick={(
                            event
                          ) =>
                            addToCart(
                              event,
                              product
                            )
                          }
                          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-[#0b6b3a] bg-white px-2 text-[11px] font-black text-[#0b6b3a] transition hover:bg-[#eaf6df] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                        >
                          <ShoppingCart
                            size={
                              15
                            }
                          />

                          <span>
                            {outOfStock
                              ? "Sold Out"
                              : "Add to Cart"}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={
                            outOfStock
                          }
                          onClick={(
                            event
                          ) =>
                            buyNow(
                              event,
                              product
                            )
                          }
                          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#ffd928] px-2 text-[11px] font-black text-[#123b25] transition hover:bg-[#f5cc00] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          <Zap
                            size={
                              15
                            }
                            fill="currentColor"
                          />

                          <span>
                            Buy Now
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {/* PAGINATION */}

            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="text-xs font-bold text-gray-500">
                  Page{" "}
                  <span className="text-gray-900">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="text-gray-900">
                    {totalPages}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    disabled={
                      page === 1
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-[#0b7a3b] hover:text-[#0b7a3b] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft
                      size={15}
                    />

                    Previous
                  </button>

                  {/* PAGE NUMBERS */}

                  {pageNumbers.map(
                    (
                      pageNumber
                    ) => (
                      <button
                        type="button"
                        key={
                          pageNumber
                        }
                        onClick={() =>
                          setPage(
                            pageNumber
                          )
                        }
                        className={`h-10 w-10 rounded-xl text-sm font-black transition ${
                          page ===
                          pageNumber
                            ? "bg-[#0b7a3b] text-white shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {
                          pageNumber
                        }
                      </button>
                    )
                  )}

                  {/* NEXT */}

                  <button
                    type="button"
                    disabled={
                      page ===
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-[#0b7a3b] hover:text-[#0b7a3b] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next

                    <ArrowRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* FOOTER */}

      <footer className="mt-10 border-t border-[#0b6b3a]/20 bg-[#0c3520] text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <div className="text-xl font-black">
              budgetree
            </div>

            <p className="mt-1 text-xs text-white/50">
              Premium products &
              gifting essentials
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-[#ffd928] px-4 py-2.5 text-xs font-black text-[#123b25]"
            >
              <ArrowLeft
                size={14}
              />
              Home
            </Link>

            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold text-white"
            >
              <ShoppingCart
                size={14}
              />
              Cart
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
