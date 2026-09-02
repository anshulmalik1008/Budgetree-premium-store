"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Package,
  Plus,
  Pencil,
  Search,
  Trash2,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

/* =========================================================
   ADMIN PRODUCT TYPE
   Supports both:
   1. Prisma/local products
   2. SiriPay products
========================================================= */

type AdminProduct = {
  id: string;
  localId?: number;

  name: string;
  slug: string;
  sku: string;

  price: number;
  mrp: number | null;
  salePrice: number | null;

  stock: number;

  status: string;
  featured: boolean;

  brand: string;

  category: string;
  subCategory: string;

  image: string | null;
  images: string[];

  source: "SIRIPAY" | "LOCAL";
};

/* =========================================================
   HELPERS
========================================================= */

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value: unknown, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim() || fallback;
}

function uniqueImages(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .map((value) => text(value))
        .filter(Boolean)
    )
  );
}

/* =========================================================
   IMAGE PARSER
========================================================= */

function getProductImages(product: any): string[] {
  const result: unknown[] = [];

  /*
   SiriPay:
   images.image1 ... images.image5
  */
  if (
    product?.images &&
    typeof product.images === "object" &&
    !Array.isArray(product.images)
  ) {
    for (let i = 1; i <= 5; i++) {
      result.push(product.images[`image${i}`]);
    }

    /*
     Also support generic image fields.
    */
    result.push(
      product.images.url,
      product.images.image,
      product.images.image_url,
      product.images.imageUrl
    );
  }

  /*
   Local Prisma:
   images: [{ url }]
  */
  if (Array.isArray(product?.images)) {
    for (const image of product.images) {
      if (typeof image === "string") {
        result.push(image);
      } else if (image && typeof image === "object") {
        result.push(
          image.url,
          image.image,
          image.image_url,
          image.imageUrl
        );
      }
    }
  }

  /*
   Direct image fields.
  */
  result.push(
    product?.image,
    product?.image_url,
    product?.imageUrl
  );

  /*
   Sometimes API returns gallery array.
  */
  if (Array.isArray(product?.gallery)) {
    result.push(...product.gallery);
  }

  return uniqueImages(result);
}

/* =========================================================
   NORMALIZE ONE PRODUCT
========================================================= */

function normalizeProduct(raw: any): AdminProduct | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  /*
   IMPORTANT:
   SiriPay products have product_id.
   Local Prisma products have id.
  */

  const isSiriPay =
    raw.product_id !== undefined ||
    raw.product_name !== undefined ||
    raw.sku_code !== undefined;

  const idValue = isSiriPay
    ? raw.product_id
    : raw.id;

  if (
    idValue === undefined ||
    idValue === null
  ) {
    return null;
  }

  const name = isSiriPay
    ? text(raw.product_name, "Unnamed Product")
    : text(raw.name, "Unnamed Product");

  const sku = isSiriPay
    ? text(raw.sku_code, `SKU-${raw.product_id}`)
    : text(raw.sku, `SKU-${raw.id}`);

  const images = getProductImages(raw);

  const price = isSiriPay
    ? toNumber(
        raw.product_price ??
        raw.sale_price ??
        raw.basic_price ??
        raw.product_mrp,
        0
      )
    : toNumber(
        raw.salePrice ??
        raw.price,
        0
      );

  const mrp = isSiriPay
    ? toNumber(
        raw.product_mrp ??
        raw.mrp ??
        raw.product_price,
        0
      )
    : raw.mrp !== undefined
      ? toNumber(raw.mrp, 0)
      : raw.salePrice !== null &&
          raw.salePrice !== undefined
        ? toNumber(raw.price, 0)
        : null;

  const category = isSiriPay
    ? text(
        raw.primary_category_name ??
        raw.category_name,
        "Uncategorized"
      )
    : text(
        raw.category?.name ??
        raw.categoryName,
        "Uncategorized"
      );

  const subCategory = isSiriPay
    ? text(
        raw.sub_category_name ??
        raw.subCategoryName,
        ""
      )
    : text(
        raw.subCategory?.name ??
        raw.sub_category_name ??
        raw.subCategoryName,
        ""
      );

  const brand = isSiriPay
    ? text(raw.brand_name, "")
    : text(
        raw.brand?.name ??
        raw.brandName,
        ""
      );

  const stock = isSiriPay
    ? Math.max(
        0,
        Math.floor(
          toNumber(raw.qty, 0)
        )
      )
    : Math.max(
        0,
        Math.floor(
          toNumber(raw.stock, 0)
        )
      );

  const status = text(
    raw.status,
    stock > 0 ? "ACTIVE" : "OUT_OF_STOCK"
  );

  return {
    id: String(idValue),
    localId:
      !isSiriPay && Number.isFinite(Number(raw.id))
        ? Number(raw.id)
        : undefined,

    name,
    slug: text(
      raw.slug,
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    ),
    sku,

    price,
    mrp: mrp && mrp > 0 ? mrp : null,

    salePrice: isSiriPay
      ? price
      : raw.salePrice !== null &&
          raw.salePrice !== undefined
        ? toNumber(raw.salePrice, 0)
        : null,

    stock,

    status,
    featured:
      raw.featured === true ||
      raw.todayDeal === 1 ||
      raw.discountDeal === 1,

    brand,

    category,
    subCategory,

    image: images[0] ?? null,
    images,

    source: isSiriPay
      ? "SIRIPAY"
      : "LOCAL",
  };
}

/* =========================================================
   EXTRACT PRODUCT ARRAY FROM API RESPONSE
========================================================= */

function extractProducts(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const possibleKeys = [
    "products",
    "data",
    "results",
    "items",
    "content",
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  /*
   Handle nested:
   { data: { products: [] } }
  */
  for (const value of Object.values(data)) {
    if (
      value &&
      typeof value === "object"
    ) {
      const found =
        extractProducts(value);

      if (found.length > 0) {
        return found;
      }
    }
  }

  return [];
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] =
    useState<AdminProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  async function loadProducts() {
    try {
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

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Failed to fetch products"
        );
      }

      const rawProducts =
        extractProducts(data);

      const normalized =
        rawProducts
          .map(normalizeProduct)
          .filter(
            (
              product
            ): product is AdminProduct =>
              Boolean(product)
          );

      /*
       * Remove duplicate products by ID.
       */
      const unique =
        Array.from(
          new Map(
            normalized.map(
              (product) => [
                `${product.source}-${product.id}`,
                product,
              ]
            )
          ).values()
        );

      setProducts(unique);

      console.log(
        "ADMIN PRODUCTS:",
        unique.length
      );

      console.log(
        "ADMIN FIRST PRODUCT:",
        unique[0]
      );
    } catch (err) {
      console.error(
        "ADMIN LOAD PRODUCTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  /* =======================================================
     REFRESH
  ======================================================= */

  function refreshProducts() {
    setRefreshing(true);
    loadProducts();
  }

  /* =======================================================
     DELETE

     SiriPay products are external catalogue items.
     Do NOT send SiriPay product_id to local DELETE API.
  ======================================================= */

  async function handleDelete(
    product: AdminProduct
  ) {
    if (
      product.source === "SIRIPAY"
    ) {
      setError(
        "SiriPay products are managed by the external catalogue and cannot be deleted from here."
      );
      return;
    }

    if (!product.localId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      setError("");

      const response =
        await fetch(
          `/api/products/${product.localId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Failed to delete product"
        );
      }

      setProducts(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== product.id
          )
      );

      router.refresh();
    } catch (err) {
      console.error(
        "DELETE PRODUCT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const query =
        search.toLowerCase().trim();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(query) ||
          product.sku
            .toLowerCase()
            .includes(query) ||
          product.brand
            .toLowerCase()
            .includes(query) ||
          product.category
            .toLowerCase()
            .includes(query) ||
          product.subCategory
            .toLowerCase()
            .includes(query)
      );
    }, [products, search]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const siripayCount =
    products.filter(
      (p) => p.source === "SIRIPAY"
    ).length;

  const localCount =
    products.filter(
      (p) => p.source === "LOCAL"
    ).length;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2
            size={25}
            className="animate-spin"
          />

          <span className="text-sm">
            Loading SiriPay products...
          </span>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* HEADER */}

      <header className="border-b border-black/10 bg-white">
        <div className="flex min-h-20 items-center justify-between gap-4 px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-xl font-semibold">
                Products
              </h1>

              <p className="text-xs text-gray-500">
                SiriPay catalogue & local products
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshProducts}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus size={17} />
              Add Product
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-[1600px] p-8">
        {/* TOP */}

        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              Catalogue
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              All Products
            </h2>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
                SiriPay: {siripayCount}
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
                Local: {localCount}
              </span>

              <span className="rounded-full bg-black px-3 py-1 font-medium text-white">
                Total: {products.length}
              </span>
            </div>
          </div>

          {/* SEARCH */}

          <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-black/10 bg-white px-4 md:w-[380px]">
            <Search
              size={18}
              className="text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, SKU, brand, category..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {products.length === 0 ? (
          <div className="flex min-h-[430px] flex-col items-center justify-center rounded-3xl border border-dashed border-black/15 bg-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white">
              <Package size={28} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              No products found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Check the SiriPay API connection and token.
            </p>

            <button
              type="button"
              onClick={refreshProducts}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-16 text-center">
            <Search
              size={30}
              className="mx-auto text-gray-400"
            />

            <h3 className="mt-4 text-lg font-semibold">
              No matching products
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try another search term.
            </p>
          </div>
        ) : (
          /* TABLE */

          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px]">
                <thead className="border-b border-black/10 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Product
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      SKU
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Brand
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Price
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Source
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => {
                      const isDeleting =
                        deletingId ===
                        product.id;

                      return (
                        <tr
                          key={`${product.source}-${product.id}`}
                          className="border-b border-black/5 last:border-0 hover:bg-gray-50/70"
                        >
                          {/* PRODUCT */}

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-contain bg-white"
                                    loading="lazy"
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Package
                                      size={22}
                                      className="text-gray-400"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="max-w-[330px]">
                                <p className="font-medium leading-5">
                                  {product.name}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                  {product.images.length} image
                                  {product.images.length !== 1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-5 text-sm text-gray-600">
                            {product.sku}
                          </td>

                          {/* BRAND */}

                          <td className="px-5 py-5 text-sm text-gray-600">
                            {product.brand || "—"}
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-5">
                            <div className="text-sm font-medium text-gray-700">
                              {product.category}
                            </div>

                            {product.subCategory && (
                              <div className="mt-1 text-xs text-gray-400">
                                {product.subCategory}
                              </div>
                            )}
                          </td>

                          {/* PRICE */}

                          <td className="px-5 py-5">
                            <div className="text-sm font-semibold">
                              ₹
                              {product.price.toLocaleString(
                                "en-IN"
                              )}
                            </div>

                            {product.mrp &&
                              product.mrp >
                                product.price && (
                                <div className="mt-1 text-xs text-gray-400 line-through">
                                  ₹
                                  {product.mrp.toLocaleString(
                                    "en-IN"
                                  )}
                                </div>
                              )}
                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-5 text-sm">
                            <span
                              className={
                                product.stock > 0
                                  ? "text-gray-700"
                                  : "text-red-500"
                              }
                            >
                              {product.stock}
                            </span>
                          </td>

                          {/* SOURCE */}

                          <td className="px-5 py-5">
                            {product.source ===
                            "SIRIPAY" ? (
                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                SiriPay
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                Local
                              </span>
                            )}
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-5">
                            <div className="flex justify-end gap-2">
                              {product.source ===
                                "LOCAL" &&
                                product.localId && (
                                  <>
                                    <Link
                                      href={`/admin/products/${product.localId}/edit`}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 transition hover:bg-black hover:text-white"
                                      title="Edit Product"
                                    >
                                      <Pencil
                                        size={15}
                                      />
                                    </Link>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(
                                          product
                                        )
                                      }
                                      disabled={
                                        isDeleting
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      title="Delete Product"
                                    >
                                      {isDeleting ? (
                                        <Loader2
                                          size={15}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Trash2
                                          size={15}
                                        />
                                      )}
                                    </button>
                                  </>
                                )}

                              {product.source ===
                                "SIRIPAY" && (
                                <span
                                  title="Managed by SiriPay"
                                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-green-200 px-3 text-xs font-medium text-green-700"
                                >
                                  <ExternalLink
                                    size={13}
                                  />
                                  API
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
