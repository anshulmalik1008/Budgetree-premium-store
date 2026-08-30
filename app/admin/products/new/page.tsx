"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  PackagePlus,
  Plus,
  Trash2,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
};

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    sku: "",
    name: "",
    slug: "",
    description: "",
    price: "",
    salePrice: "",
    stock: "0",
    categoryId: "",
    featured: false,
  });

  const [images, setImages] = useState<string[]>([""]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json();

        setCategories(data.categories ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: generateSlug(value),
    }));
  }

  function addImageField() {
    setImages((previous) => [...previous, ""]);
  }

  function removeImageField(index: number) {
    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  }

  function updateImage(index: number, value: string) {
    setImages((previous) =>
      previous.map((image, imageIndex) =>
        imageIndex === index ? value : image
      )
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const cleanImages = images
        .map((image) => image.trim())
        .filter(Boolean);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,

          price: Number(form.price),

          salePrice: form.salePrice
            ? Number(form.salePrice)
            : null,

          stock: Number(form.stock) || 0,

          categoryId: form.categoryId
            ? Number(form.categoryId)
            : null,

          featured: form.featured,

          images: cleanImages,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create product"
        );
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-white">
        <div className="flex min-h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-xl font-semibold">
                Add Product
              </h1>

              <p className="text-xs text-gray-500">
                Create a new store product
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <section className="mx-auto max-w-5xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <PackagePlus size={19} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Basic Information
                </h2>

                <p className="text-xs text-gray-500">
                  Product identity and description
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* SKU */}
              <Field label="SKU" required>
                <input
                  required
                  value={form.sku}
                  onChange={(event) =>
                    updateField("sku", event.target.value)
                  }
                  placeholder="BPS-GIFT-001"
                  className="input"
                />
              </Field>

              {/* Name */}
              <Field label="Product Name" required>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="Premium Corporate Gift Box"
                  className="input"
                />
              </Field>

              {/* Slug */}
              <Field label="Slug" required>
                <input
                  required
                  value={form.slug}
                  onChange={(event) =>
                    updateField(
                      "slug",
                      generateSlug(event.target.value)
                    )
                  }
                  placeholder="premium-corporate-gift-box"
                  className="input"
                />
              </Field>

              {/* Category */}
              <Field label="Category">
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    updateField(
                      "categoryId",
                      event.target.value
                    )
                  }
                  className="input"
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Description */}
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Write a premium product description..."
                    className="input resize-none"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
            <div className="mb-6">
              <h2 className="font-semibold">
                Pricing & Inventory
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Set product pricing and available stock
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Price" required>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  placeholder="1999"
                  className="input"
                />
              </Field>

              <Field label="Sale Price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(event) =>
                    updateField(
                      "salePrice",
                      event.target.value
                    )
                  }
                  placeholder="1799"
                  className="input"
                />
              </Field>

              <Field label="Stock">
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) =>
                    updateField("stock", event.target.value)
                  }
                  className="input"
                />
              </Field>
            </div>

            {/* Featured */}
            <label className="mt-6 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  updateField(
                    "featured",
                    event.target.checked
                  )
                }
                className="h-4 w-4"
              />

              <div>
                <p className="text-sm font-medium">
                  Featured Product
                </p>

                <p className="text-xs text-gray-500">
                  Show this product in featured sections.
                </p>
              </div>
            </label>
          </div>

          {/* Images */}
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <ImagePlus size={19} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Product Images
                  </h2>

                  <p className="text-xs text-gray-500">
                    Add image URLs for this product
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addImageField}
                className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
              >
                <Plus size={16} />
                Add Image
              </button>
            </div>

            <div className="space-y-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="flex gap-3"
                >
                  <input
                    type="url"
                    value={image}
                    onChange={(event) =>
                      updateImage(
                        index,
                        event.target.value
                      )
                    }
                    placeholder={`Image URL ${index + 1}`}
                    className="input"
                  />

                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeImageField(index)
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Example: https://example.com/product-image.jpg
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
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
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <PackagePlus size={17} />
                  Save Product
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Tailwind utility styles */}
      <style jsx global>{`
        .input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgb(0 0 0 / 0.1);
          background: white;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          transition: 150ms;
        }

        textarea.input {
          height: auto;
          padding-top: 12px;
          padding-bottom: 12px;
        }

        .input:focus {
          border-color: rgb(0 0 0 / 0.35);
          box-shadow: 0 0 0 3px rgb(0 0 0 / 0.04);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}
