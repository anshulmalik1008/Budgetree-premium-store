"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
import {
  ArrowLeft,
  Package,
  Plus,
  Pencil,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number | string;
  salePrice: number | string | null;
  stock: number;
  status: string;
  category: {
    id: number;
    name: string;
  } | null;
  images: {
    id: number;
    url: string;
    sortOrder: number;
  }[];
};

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // ================================
  // LOAD PRODUCTS
  // ================================
  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch products"
        );
      }

      setProducts(data.products ?? []);
    } catch (error) {
      console.error("LOAD PRODUCTS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  // Load on first render
     useEffect(() => {
  loadProducts();
}, []);

  // ================================
  // DELETE PRODUCT
  // ================================
  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      setError("");

      const response = await fetch(
        `/api/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete product"
        );
      }

      // Remove from current list immediately
      setProducts((previous) =>
        previous.filter(
          (item) => item.id !== product.id
        )
      );

      router.refresh();
    } catch (error) {
      console.error("DELETE PRODUCT ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ================================
  // SEARCH
  // ================================
  const filteredProducts = products.filter(
    (product) => {
      const query = search.toLowerCase().trim();

      if (!query) return true;

      return (
        product.name
          .toLowerCase()
          .includes(query) ||
        product.sku
          .toLowerCase()
          .includes(query) ||
        product.slug
          .toLowerCase()
          .includes(query) ||
        product.category?.name
          .toLowerCase()
          .includes(query)
      );
    }
  );

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2
            size={25}
            className="animate-spin"
          />

          <span className="text-sm">
            Loading products...
          </span>
        </div>
      </main>
    );
  }

  // ================================
  // PAGE
  // ================================
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">
        <div className="flex min-h-20 items-center justify-between px-8">
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
                Manage your store catalogue
              </p>
            </div>
          </div>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={17} />
            Add Product
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1500px] p-8">
        {/* TOP */}
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              Catalogue
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              All Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {products.length} product
              {products.length !== 1 ? "s" : ""} in
              database
            </p>
          </div>

          {/* SEARCH */}
          <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-black/10 bg-white px-4 md:w-80">
            <Search
              size={18}
              className="text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search products"
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
              No products yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Add your first product to the catalogue.
            </p>

            <Link
              href="/admin/products/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus size={17} />
              Add Product
            </Link>
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
              <table className="w-full min-w-[1050px]">
                <thead className="border-b border-black/10 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Product
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      SKU
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Category
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Price
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Stock
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => {
                      const image =
                        product.images[0]?.url;

                      const isDeleting =
                        deletingId === product.id;

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-black/5 last:border-0"
                        >
                          {/* PRODUCT */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Package
                                      size={20}
                                      className="text-gray-400"
                                    />
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="font-medium">
                                  {product.name}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                  /{product.slug}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="px-6 py-5 text-sm text-gray-600">
                            {product.sku}
                          </td>

                          {/* CATEGORY */}
                          <td className="px-6 py-5 text-sm text-gray-600">
                            {product.category?.name ||
                              "Uncategorized"}
                          </td>

                          {/* PRICE */}
                          <td className="px-6 py-5">
                            <div className="text-sm font-medium">
                              ₹
                              {Number(
                                product.price
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </div>

                            {product.salePrice !==
                              null && (
                              <div className="mt-1 text-xs text-gray-400 line-through">
                                ₹
                                {Number(
                                  product.salePrice
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </div>
                            )}
                          </td>

                          {/* STOCK */}
                          <td className="px-6 py-5 text-sm">
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

                          {/* STATUS */}
                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                product.status ===
                                "ACTIVE"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>

                          {/* ACTION */}
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              {/* EDIT */}
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 transition hover:bg-black hover:text-white"
                                title="Edit Product"
                              >
                                <Pencil size={15} />
                              </Link>

                              {/* DELETE */}
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
