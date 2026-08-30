"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type ProductImage = {
  id?: number;
  url: string;
  sortOrder?: number;
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState<Category[]>(
    []
  );

  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    salePrice: "",
    stock: "",
    categoryId: "",
    featured: false,
  });

  // ================================
  // LOAD PRODUCT + CATEGORIES
  // ================================
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [productResponse, categoriesResponse] =
          await Promise.all([
            fetch(`/api/products/${id}`, {
              cache: "no-store",
            }),

            fetch("/api/categories", {
              cache: "no-store",
            }),
          ]);

        const productData =
          await productResponse.json();

        const categoriesData =
          await categoriesResponse.json();

        if (
          !productResponse.ok ||
          !productData.product
        ) {
          throw new Error(
            productData.message ||
              "Product not found"
          );
        }

        if (
          !categoriesResponse.ok ||
          !categoriesData.success
        ) {
          throw new Error(
            categoriesData.message ||
              "Failed to load categories"
          );
        }

        const product = productData.product;

        setCategories(
          categoriesData.categories ?? []
        );

        setForm({
          name: product.name ?? "",

          slug: product.slug ?? "",

          description:
            product.description ?? "",

          price:
            product.price !== null &&
            product.price !== undefined
              ? String(product.price)
              : "",

          salePrice:
            product.salePrice !== null &&
            product.salePrice !== undefined
              ? String(product.salePrice)
              : "",

          stock:
            product.stock !== null &&
            product.stock !== undefined
              ? String(product.stock)
              : "0",

          categoryId:
            product.categoryId !== null &&
            product.categoryId !== undefined
              ? String(product.categoryId)
              : "",

          featured: Boolean(product.featured),
        });

        setImages(
          (product.images ?? []).map(
            (image: ProductImage) => ({
              id: image.id,
              url: image.url,
              sortOrder: image.sortOrder,
            })
          )
        );
      } catch (error) {
        console.error(
          "LOAD EDIT PRODUCT ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load product"
        );
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    }

    loadData();
  }, [id]);

  // ================================
  // UPDATE FORM
  // ================================
  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ================================
  // ADD IMAGE
  // ================================
  function addImage() {
    const url = newImageUrl.trim();

    if (!url) {
      return;
    }

    setImages((previous) => [
      ...previous,
      {
        url,
        sortOrder: previous.length,
      },
    ]);

    setNewImageUrl("");
  }

  // ================================
  // REMOVE IMAGE
  // ================================
  function removeImage(index: number) {
    setImages((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  // ================================
  // MOVE IMAGE UP
  // ================================
  function moveImageUp(index: number) {
    if (index === 0) return;

    setImages((previous) => {
      const updated = [...previous];

      [updated[index - 1], updated[index]] = [
        updated[index],
        updated[index - 1],
      ];

      return updated;
    });
  }

  // ================================
  // MOVE IMAGE DOWN
  // ================================
  function moveImageDown(index: number) {
    if (index === images.length - 1) return;

    setImages((previous) => {
      const updated = [...previous];

      [updated[index], updated[index + 1]] = [
        updated[index + 1],
        updated[index],
      ];

      return updated;
    });
  }

  // ================================
  // SUBMIT
  // ================================
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/products/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: form.name.trim(),

            slug: form.slug.trim(),

            description:
              form.description.trim() || null,

            price: Number(form.price),

            salePrice: form.salePrice
              ? Number(form.salePrice)
              : null,

            stock: Number(form.stock) || 0,

            categoryId: form.categoryId
              ? Number(form.categoryId)
              : null,

            featured: form.featured,

            // IMAGES
            images: images.map(
              (image) => image.url
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update product"
        );
      }

      setSuccess(
        "Product updated successfully."
      );

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  }

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2
            size={26}
            className="animate-spin"
          />

          <span className="text-sm">
            Loading product...
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
        <div className="flex min-h-20 items-center gap-4 px-8">
          <Link
            href="/admin/products"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-xl font-semibold">
              Edit Product
            </h1>

            <p className="text-xs text-gray-500">
              Product ID: {id}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* PRODUCT INFORMATION */}
          <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
            <div className="mb-7">
              <h2 className="text-xl font-semibold">
                Product Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update your product details.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* NAME */}
              <Field label="Product Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value
                    )
                  }
                  className="input"
                  placeholder="Premium Gift Box"
                />
              </Field>

              {/* SLUG */}
              <Field label="Slug">
                <input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    updateField(
                      "slug",
                      e.target.value
                    )
                  }
                  className="input"
                  placeholder="premium-gift-box"
                />
              </Field>

              {/* CATEGORY */}
              <Field label="Category">
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    updateField(
                      "categoryId",
                      e.target.value
                    )
                  }
                  className="input"
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading..."
                      : "Select category"}
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </Field>

              {/* PRICE */}
              <Field label="Price">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    updateField(
                      "price",
                      e.target.value
                    )
                  }
                  className="input"
                />
              </Field>

              {/* SALE PRICE */}
              <Field label="Sale Price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) =>
                    updateField(
                      "salePrice",
                      e.target.value
                    )
                  }
                  className="input"
                />
              </Field>

              {/* STOCK */}
              <Field label="Stock">
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    updateField(
                      "stock",
                      e.target.value
                    )
                  }
                  className="input"
                />
              </Field>

              {/* FEATURED */}
              <div className="flex items-center pt-7">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      updateField(
                        "featured",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Featured Product
                    </p>

                    <p className="text-xs text-gray-500">
                      Show this product as featured.
                    </p>
                  </div>
                </label>
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={7}
                    value={form.description}
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }
                    className="input resize-none py-3"
                    placeholder="Product description..."
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* ================================
              PRODUCT IMAGES
          ================================= */}
          <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
            <div className="mb-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <ImageIcon size={19} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Product Images
                  </h2>

                  <p className="text-sm text-gray-500">
                    First image will be the main product image.
                  </p>
                </div>
              </div>
            </div>

            {/* ADD IMAGE */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) =>
                  setNewImageUrl(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
                placeholder="https://example.com/product-image.jpg"
                className="input flex-1"
              />

              <button
                type="button"
                onClick={addImage}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                <Plus size={17} />
                Add Image
              </button>
            </div>

            {/* IMAGE LIST */}
            {images.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-gray-50 p-10 text-center">
                <ImageIcon
                  size={30}
                  className="mx-auto text-gray-400"
                />

                <p className="mt-3 text-sm font-medium">
                  No product images
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Add an image URL above.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {images.map(
                  (image, index) => (
                    <div
                      key={`${image.id ?? "new"}-${index}`}
                      className="overflow-hidden rounded-2xl border border-black/10 bg-white"
                    >
                      {/* IMAGE */}
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={image.url}
                          alt={`${form.name} image ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                        {/* MAIN BADGE */}
                        {index === 0 && (
                          <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white">
                            Main Image
                          </div>
                        )}

                        {/* NUMBER */}
                        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-xs font-semibold shadow">
                          {index + 1}
                        </div>
                      </div>

                      {/* CONTROLS */}
                      <div className="p-3">
                        <p
                          className="mb-3 truncate text-xs text-gray-500"
                          title={image.url}
                        >
                          {image.url}
                        </p>

                        <div className="flex items-center gap-2">
                          {/* UP */}
                          <button
                            type="button"
                            onClick={() =>
                              moveImageUp(index)
                            }
                            disabled={index === 0}
                            className="flex h-9 flex-1 items-center justify-center rounded-lg border border-black/10 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp size={15} />
                          </button>

                          {/* DOWN */}
                          <button
                            type="button"
                            onClick={() =>
                              moveImageDown(index)
                            }
                            disabled={
                              index ===
                              images.length - 1
                            }
                            className="flex h-9 flex-1 items-center justify-center rounded-lg border border-black/10 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown size={15} />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() =>
                              removeImage(index)
                            }
                            className="flex h-9 flex-1 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                            title="Remove image"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* SUCCESS */}
          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/products"
              className="rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-medium transition hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-black px-7 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Updating..."
                : "Update Product"}
            </button>
          </div>
        </form>
      </section>

      <style jsx global>{`
        .input {
          width: 100%;
          min-height: 44px;
          border-radius: 12px;
          border: 1px solid rgb(0 0 0 / 0.1);
          background: white;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          transition: 150ms;
        }

        .input:focus {
          border-color: rgb(0 0 0 / 0.35);
          box-shadow: 0 0 0 3px rgb(0 0 0 / 0.04);
        }

        select.input {
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      {children}
    </label>
  );
}
