"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Upload,
  XCircle,
} from "lucide-react";

type ProductRow = {
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  price: string | number;
  salePrice?: string | number;
  stock?: string | number;
  category?: string;
  status?: string;
  featured?: string | boolean;
  image?: string;
  images?: string;
};

type ImportResult = {
  created: number;
  failed: number;
  errors: {
    row: number;
    sku?: string;
    message: string;
  }[];
};

const CSV_HEADERS = [
  "sku",
  "name",
  "slug",
  "description",
  "price",
  "salePrice",
  "stock",
  "category",
  "status",
  "featured",
  "image",
  "images",
];

function downloadCatalogueTemplate() {
  const rows = [
    CSV_HEADERS,
    [
      "BPS-003",
      "Premium Dry Fruit Box",
      "premium-dry-fruit-box",
      "Premium corporate dry fruit box",
      "2499",
      "2199",
      "50",
      "Corporate Gifts",
      "ACTIVE",
      "true",
      "https://example.com/dryfruit.jpg",
      "https://example.com/1.jpg|https://example.com/2.jpg",
    ],
    [
      "BPS-004",
      "Luxury Gift Hamper",
      "luxury-gift-hamper",
      "Luxury corporate gift hamper",
      "3499",
      "2999",
      "25",
      "Corporate Gifts",
      "ACTIVE",
      "true",
      "https://example.com/hamper.jpg",
      "https://example.com/3.jpg|https://example.com/4.jpg",
    ],
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");

          if (
            text.includes(",") ||
            text.includes('"') ||
            text.includes("\n")
          ) {
            return `"${text.replace(/"/g, '""')}"`;
          }

          return text;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "budgetree-product-catalogue-template.csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function parseCSV(text: string): ProductRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      "CSV must contain headers and at least one product."
    );
  }

  const headers = parseCSVLine(lines[0]).map((header) =>
    header
      .trim()
      .replace(/^\uFEFF/, "")
      .toLowerCase()
  );

  const requiredHeaders = [
    "sku",
    "name",
    "price",
  ];

  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required columns: ${missingHeaders.join(", ")}`
    );
  }

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });

    return {
      sku: row.sku ?? "",
      name: row.name ?? "",
      slug: row.slug ?? "",
      description: row.description ?? "",
      price: row.price ?? "",
      salePrice:
        row.saleprice ??
        row["sale price"] ??
        "",
      stock: row.stock ?? "",
      category: row.category ?? "",
      status: row.status ?? "ACTIVE",
      featured: row.featured ?? "false",
      image: row.image ?? "",
      images: row.images ?? "",
    };
  });
}

function parseCSVLine(line: string) {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (
      char === "," &&
      !insideQuotes
    ) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);

  return result;
}

function validateRows(products: ProductRow[]) {
  const errors: string[] = [];
  const skuSet = new Set<string>();

  products.forEach((product, index) => {
    const row = index + 2;

    if (!product.sku.trim()) {
      errors.push(`Row ${row}: SKU is required.`);
    }

    if (!product.name.trim()) {
      errors.push(`Row ${row}: Product name is required.`);
    }

    if (
      product.price === "" ||
      Number.isNaN(Number(product.price))
    ) {
      errors.push(
        `Row ${row}: Valid price is required.`
      );
    }

    if (product.salePrice !== "") {
      if (
        product.salePrice !== undefined &&
        Number.isNaN(Number(product.salePrice))
      ) {
        errors.push(
          `Row ${row}: Sale price must be a number.`
        );
      }
    }

    if (
      product.stock !== "" &&
      product.stock !== undefined &&
      Number.isNaN(Number(product.stock))
    ) {
      errors.push(
        `Row ${row}: Stock must be a number.`
      );
    }

    const sku = product.sku.trim().toLowerCase();

    if (sku && skuSet.has(sku)) {
      errors.push(
        `Row ${row}: Duplicate SKU ${product.sku}.`
      );
    }

    if (sku) {
      skuSet.add(sku);
    }

    if (
      product.status &&
      ![
        "ACTIVE",
        "DRAFT",
        "OUT_OF_STOCK",
        "ARCHIVED",
      ].includes(
        product.status.toUpperCase()
      )
    ) {
      errors.push(
        `Row ${row}: Invalid status "${product.status}".`
      );
    }
  });

  return errors;
}

export default function BulkImportPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] =
    useState<string[]>([]);
  const [result, setResult] =
    useState<ImportResult | null>(null);

  function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");
    setResult(null);
    setValidationErrors([]);
    setProducts([]);
    setFileName(file.name);

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (extension !== "csv") {
      setError(
        "Abhi CSV import enabled hai. Excel file ko CSV format mein save karke upload karo."
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(
          reader.result ?? ""
        );

        const rows = parseCSV(text);

        if (!rows.length) {
          throw new Error(
            "No products found in CSV."
          );
        }

        const errors = validateRows(rows);

        setProducts(rows);
        setValidationErrors(errors);

        if (errors.length === 0) {
          setMessage(
            `${rows.length} products ready for import.`
          );
        } else {
          setError(
            `${errors.length} validation issue(s) found. Please fix the catalogue before importing.`
          );
        }
      } catch (err) {
        setProducts([]);

        setError(
          err instanceof Error
            ? err.message
            : "Could not read CSV file."
        );
      }
    };

    reader.onerror = () => {
      setError(
        "Could not read the selected file."
      );
    };

    reader.readAsText(file);
  }

  async function handleImport() {
    if (!products.length) {
      setError(
        "Pehle CSV file upload karo."
      );
      return;
    }

    const errors = validateRows(products);

    if (errors.length > 0) {
      setValidationErrors(errors);
      setError(
        "Catalogue mein validation errors hain. Pehle unhe fix karo."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setResult(null);

    try {
      const response = await fetch(
        "/api/admin/products/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            products,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Bulk import failed."
        );
      }

      setResult(data.results);
      setMessage(
        data.message ||
          "Products imported successfully."
      );

      if (
        data.results &&
        data.results.failed === 0
      ) {
        setProducts([]);
        setFileName("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Bulk import failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearImport() {
    setProducts([]);
    setFileName("");
    setMessage("");
    setError("");
    setValidationErrors([]);
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-[#f5f5f3] text-black">
      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-black hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Products
              </p>

              <h1 className="text-xl font-semibold tracking-tight">
                Bulk Import
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadCatalogueTemplate}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            <Download size={15} />
            <span className="hidden sm:inline">
              Download Template
            </span>
            <span className="sm:hidden">
              Template
            </span>
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1450px] p-5 md:p-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] bg-black p-7 text-white shadow-xl md:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
              <FileSpreadsheet size={22} />
            </div>

            <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-white/40">
              XL Product System
            </p>

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                  Import products in bulk
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                  Upload the official Budgetree catalogue
                  template, preview products and images,
                  validate everything and then import safely
                  into your database.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  downloadCatalogueTemplate
                }
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                <Download size={16} />
                Get Catalogue
              </button>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* LEFT */}
          <div className="rounded-[30px] border border-black/10 bg-white p-7 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
              Step 01
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Upload Catalogue
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Pehle template download karo, usme products
              bharo, phir CSV yahan upload karo.
            </p>

            <button
              type="button"
              onClick={
                downloadCatalogueTemplate
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-[#fafaf8] px-4 py-3 text-xs font-medium transition hover:bg-black hover:text-white"
            >
              <Download size={15} />
              Download Catalogue Template
            </button>

            <label className="mt-4 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#fafaf8] px-5 text-center transition hover:border-black/30 hover:bg-gray-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                <Upload size={21} />
              </div>

              <p className="mt-4 max-w-full truncate text-sm font-medium">
                {fileName ||
                  "Choose CSV file"}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                CSV only
              </p>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
            </label>

            {/* FORMAT */}
            <div className="mt-5 rounded-2xl bg-[#f6f6f4] p-4">
              <p className="text-xs font-medium">
                Catalogue format
              </p>

              <div className="mt-3 space-y-1.5 text-[10px] leading-5 text-gray-500">
                <p>
                  <b>Required:</b> sku, name, price
                </p>

                <p>
                  <b>Optional:</b> slug, description,
                  salePrice, stock
                </p>

                <p>
                  <b>Store:</b> category, status,
                  featured
                </p>

                <p>
                  <b>Images:</b> image, images
                </p>
              </div>
            </div>

            {/* STATUS */}
            {message && (
              <div className="mt-5 flex gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <XCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* VALIDATION */}
            {validationErrors.length > 0 && (
              <div className="mt-5 max-h-48 overflow-y-auto rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-800">
                  Validation Errors
                </p>

                <div className="mt-2 space-y-1">
                  {validationErrors.map(
                    (item, index) => (
                      <p
                        key={index}
                        className="text-[11px] leading-5 text-red-600"
                      >
                        {item}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            {/* IMPORT BUTTON */}
            {products.length > 0 && (
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={
                    loading ||
                    validationErrors.length > 0
                  }
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    "Importing..."
                  ) : (
                    <>
                      <Upload size={16} />
                      Import {products.length}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearImport}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 transition hover:bg-gray-100"
                  title="Clear"
                >
                  <XCircle size={17} />
                </button>
              </div>
            )}
          </div>

          {/* PREVIEW */}
          <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-sm">
            <div className="border-b border-black/10 p-7">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Step 02
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Product Preview
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {products.length
                      ? `${products.length} products loaded`
                      : "Upload a CSV to see products"}
                  </p>
                </div>

                {products.length > 0 && (
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-medium ${
                      validationErrors.length
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {validationErrors.length
                      ? "Needs Fix"
                      : "Ready"}
                  </span>
                )}
              </div>
            </div>

            {products.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <FileSpreadsheet
                  size={42}
                  className="text-gray-200"
                />

                <p className="mt-5 font-medium">
                  No catalogue uploaded
                </p>

                <p className="mt-1 max-w-sm text-sm leading-6 text-gray-400">
                  Download the official template,
                  fill your products and upload the CSV
                  here.
                </p>

                <button
                  type="button"
                  onClick={
                    downloadCatalogueTemplate
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-xs font-medium transition hover:bg-black hover:text-white"
                >
                  <Download size={15} />
                  Download Template
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="border-b border-black/5 bg-[#fafaf8]">
                    <tr>
                      <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-400">
                        Product
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-400">
                        SKU
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-400">
                        Price
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-400">
                        Sale
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-400">
                        Stock
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-400">
                        Category
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-400">
                        Image
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/5">
                    {products.map(
                      (product, index) => {
                        const image =
                          product.image ||
                          product.images
                            ?.split(/[|,;]/)[0]
                            ?.trim();

                        return (
                          <tr
                            key={`${product.sku}-${index}`}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-5 py-4">
                              <p className="max-w-[250px] truncate text-sm font-medium">
                                {product.name ||
                                  "Unnamed"}
                              </p>

                              <p className="mt-1 max-w-[250px] truncate text-[10px] text-gray-400">
                                {product.slug ||
                                  "slug will auto-generate"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-xs text-gray-500">
                              {product.sku ||
                                "—"}
                            </td>

                            <td className="px-5 py-4 text-sm font-medium">
                              ₹
                              {product.price ||
                                "0"}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-500">
                              {product.salePrice
                                ? `₹${product.salePrice}`
                                : "—"}
                            </td>

                            <td className="px-5 py-4 text-xs">
                              {product.stock ||
                                "0"}
                            </td>

                            <td className="px-5 py-4 text-xs text-gray-500">
                              {product.category ||
                                "—"}
                            </td>

                            <td className="px-5 py-4">
                              {image ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-gray-50">
                                    <img
                                      src={image}
                                      alt={
                                        product.name
                                      }
                                      className="h-full w-full object-cover"
                                      onError={(
                                        event
                                      ) => {
                                        event.currentTarget.style.display =
                                          "none";
                                      }}
                                    />
                                  </div>

                                  <ImageIcon
                                    size={14}
                                    className="text-gray-400"
                                  />
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300">
                                  No image
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RESULT */}
        {result && (
          <div className="mt-6 rounded-[30px] border border-black/10 bg-white p-7 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
              Step 03
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Import Result
            </h3>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle2 size={20} />

                  <span className="text-sm font-medium">
                    Created
                  </span>
                </div>

                <p className="mt-2 text-3xl font-semibold text-green-800">
                  {result.created}
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-3 text-red-700">
                  <XCircle size={20} />

                  <span className="text-sm font-medium">
                    Failed
                  </span>
                </div>

                <p className="mt-2 text-3xl font-semibold text-red-800">
                  {result.failed}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-red-100">
                <div className="border-b border-red-100 bg-red-50 px-5 py-4">
                  <p className="text-sm font-medium text-red-800">
                    Failed Rows
                  </p>
                </div>

                <div className="divide-y divide-red-100">
                  {result.errors.map(
                    (item, index) => (
                      <div
                        key={`${item.row}-${index}`}
                        className="px-5 py-4"
                      >
                        <p className="text-xs font-medium">
                          Row {item.row}
                          {item.sku
                            ? ` · ${item.sku}`
                            : ""}
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                          {item.message}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
