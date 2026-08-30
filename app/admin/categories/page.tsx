"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderTree,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(
    null
  );

  const [editingId, setEditingId] = useState<number | null>(
    null
  );

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD CATEGORIES
  // ==========================================

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load categories"
        );
      }

      setCategories(data.categories ?? []);
    } catch (error) {
      console.error("LOAD CATEGORIES ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // ==========================================
  // AUTO SLUG
  // ==========================================

  function handleNameChange(value: string) {
    setName(value);

    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlug(generatedSlug);
  }

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (editingId
              ? "Failed to update category"
              : "Failed to create category")
        );
      }

      setSuccess(
        editingId
          ? "Category updated successfully."
          : "Category created successfully."
      );

      setName("");
      setSlug("");
      setEditingId(null);

      await loadCategories();
    } catch (error) {
      console.error("SAVE CATEGORY ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // START EDIT
  // ==========================================

  function handleEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setSlug("");
    setError("");
    setSuccess("");
  }

  // ==========================================
  // DELETE
  // ==========================================

  async function handleDelete(category: Category) {
    const productCount =
      category._count?.products ?? 0;

    if (productCount > 0) {
      const confirmed = window.confirm(
        `"${category.name}" has ${productCount} product${
          productCount !== 1 ? "s" : ""
        }.\n\nDeleting this category may remove the category association from those products.\n\nDo you want to continue?`
      );

      if (!confirmed) {
        return;
      }
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${category.name}"?`
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setDeletingId(category.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/categories/${category.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete category"
        );
      }

      setSuccess("Category deleted successfully.");

      setCategories((previous) =>
        previous.filter(
          (item) => item.id !== category.id
        )
      );

      if (editingId === category.id) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("DELETE CATEGORY ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete category"
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredCategories = categories.filter(
    (category) => {
      const query = search.toLowerCase().trim();

      if (!query) {
        return true;
      }

      return (
        category.name
          .toLowerCase()
          .includes(query) ||
        category.slug
          .toLowerCase()
          .includes(query)
      );
    }
  );

  // ==========================================
  // PAGE
  // ==========================================

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
                Categories
              </h1>

              <p className="text-xs text-gray-500">
                Manage product categories
              </p>
            </div>
          </div>

          <div className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white">
            {categories.length} Categories
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-7xl p-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* LEFT FORM */}

          <div className="h-fit rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
              {editingId ? (
                <Pencil size={20} />
              ) : (
                <FolderTree size={21} />
              )}
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              {editingId
                ? "Edit Category"
                : "Add Category"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {editingId
                ? "Update your category details."
                : "Create a category for your products."}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category Name
                </label>

                <input
                  required
                  value={name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  placeholder="Corporate Gifts"
                  className="h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none transition focus:border-black/30"
                />
              </div>

              {/* SLUG */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Slug
                </label>

                <input
                  required
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  placeholder="corporate-gifts"
                  className="h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none transition focus:border-black/30"
                />

                <p className="mt-2 text-xs text-gray-400">
                  URL: /category/{slug || "..."}
                </p>
              </div>

              {/* MESSAGES */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-medium transition hover:bg-gray-100"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      {editingId
                        ? "Updating..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>
                      {editingId ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={17} />
                      )}

                      {editingId
                        ? "Update Category"
                        : "Create Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT SIDE */}

          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            {/* TOP */}

            <div className="flex flex-col gap-5 border-b border-black/10 p-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                  Catalogue
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  All Categories
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {categories.length} categor
                  {categories.length === 1
                    ? "y"
                    : "ies"}
                </p>
              </div>

              {/* SEARCH */}

              <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-black/10 bg-gray-50 px-4 md:w-72">
                <Search
                  size={17}
                  className="text-gray-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search categories"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* LOADING */}

            {loading ? (
              <div className="flex min-h-72 items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2
                    size={24}
                    className="animate-spin"
                  />

                  <span className="text-sm">
                    Loading categories...
                  </span>
                </div>
              </div>
            ) : categories.length === 0 ? (
              /* EMPTY */

              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <FolderTree
                    size={30}
                    className="text-gray-400"
                  />
                </div>

                <p className="mt-5 font-medium">
                  No categories yet
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Create your first category.
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              /* NO SEARCH RESULTS */

              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <Search
                  size={30}
                  className="text-gray-300"
                />

                <p className="mt-4 font-medium">
                  No matching categories
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Try another search term.
                </p>
              </div>
            ) : (
              /* LIST */

              <div className="divide-y divide-black/5">
                {filteredCategories.map(
                  (category) => {
                    const productCount =
                      category._count?.products ??
                      0;

                    const isDeleting =
                      deletingId === category.id;

                    return (
                      <div
                        key={category.id}
                        className="flex flex-col gap-5 px-7 py-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* INFO */}

                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                            <FolderTree
                              size={19}
                            />
                          </div>

                          <div>
                            <p className="font-medium">
                              {category.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              /{category.slug}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {productCount} product
                              {productCount !== 1
                                ? "s"
                                : ""}
                            </p>
                          </div>
                        </div>

                        {/* ACTIONS */}

                        <div className="flex items-center gap-2">
                          <span className="mr-2 hidden rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 md:block">
                            ID #{category.id}
                          </span>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(category)
                            }
                            disabled={isDeleting}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 transition hover:bg-black hover:text-white disabled:opacity-50"
                            title="Edit Category"
                          >
                            <Pencil size={15} />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(category)
                            }
                            disabled={isDeleting}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete Category"
                          >
                            {isDeleting ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
