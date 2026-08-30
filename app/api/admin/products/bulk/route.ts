import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type BulkProduct = {
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  price: number | string;
  salePrice?: number | string;
  stock?: number | string;
  category?: string;
  status?: "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED";
  featured?: boolean | string;
  image?: string;
  images?: string | string[];
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes"].includes(
      value.toLowerCase().trim()
    );
  }

  return false;
}

function getImages(product: BulkProduct) {
  const source = product.images ?? product.image;

  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source
      .map((url) => String(url).trim())
      .filter(Boolean);
  }

  return String(source)
    .split(/[|,;\n]+/)
    .map((url) => url.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const products = body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No products found to import.",
        },
        { status: 400 }
      );
    }

    if (products.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 500 products can be imported at once.",
        },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as {
        row: number;
        sku?: string;
        message: string;
      }[],
    };

    for (let index = 0; index < products.length; index++) {
      const product = products[index] as BulkProduct;
      const row = index + 2;

      try {
        const sku = String(product.sku ?? "").trim();
        const name = String(product.name ?? "").trim();

        if (!sku) {
          throw new Error("SKU is required.");
        }

        if (!name) {
          throw new Error("Product name is required.");
        }

        const price = toNumber(product.price, NaN);

        if (!Number.isFinite(price) || price < 0) {
          throw new Error("Valid price is required.");
        }

        const salePrice =
          product.salePrice === undefined ||
          product.salePrice === ""
            ? null
            : toNumber(product.salePrice, NaN);

        if (
          salePrice !== null &&
          (!Number.isFinite(salePrice) || salePrice < 0)
        ) {
          throw new Error("Invalid sale price.");
        }

        const stock = Math.max(
          0,
          Math.floor(toNumber(product.stock, 0))
        );

        const slug = makeSlug(
          String(product.slug ?? "").trim() ||
            name
        );

        if (!slug) {
          throw new Error("Could not generate product slug.");
        }

        const existingSku = await prisma.product.findUnique({
          where: {
            sku,
          },
          select: {
            id: true,
          },
        });

        if (existingSku) {
          throw new Error(
            `SKU "${sku}" already exists.`
          );
        }

        const existingSlug = await prisma.product.findUnique({
          where: {
            slug,
          },
          select: {
            id: true,
          },
        });

        if (existingSlug) {
          throw new Error(
            `Slug "${slug}" already exists.`
          );
        }

        let categoryId: number | null = null;

        if (product.category) {
          const categoryName = String(
            product.category
          ).trim();

          if (categoryName) {
            const category =
              await prisma.category.findFirst({
                where: {
                  OR: [
                    {
                      name: {
                        equals: categoryName,
                        mode: "insensitive",
                      },
                    },
                    {
                      slug: makeSlug(categoryName),
                    },
                  ],
                },
                select: {
                  id: true,
                },
              });

            if (!category) {
              throw new Error(
                `Category "${categoryName}" not found.`
              );
            }

            categoryId = category.id;
          }
        }

        const status =
          product.status &&
          [
            "ACTIVE",
            "DRAFT",
            "OUT_OF_STOCK",
            "ARCHIVED",
          ].includes(product.status)
            ? product.status
            : "ACTIVE";

        const images = getImages(product);

        await prisma.product.create({
          data: {
            sku,
            name,
            slug,
            description:
              String(product.description ?? "").trim() ||
              null,

            price,
            salePrice,

            stock,

            status,
            featured: toBoolean(product.featured),

            categoryId,

            images: {
              create: images.map((url, imageIndex) => ({
                url,
                alt: name,
                sortOrder: imageIndex,
              })),
            },
          },
        });

        results.created++;
      } catch (error) {
        results.failed++;

        results.errors.push({
          row,
          sku: String(product.sku ?? ""),
          message:
            error instanceof Error
              ? error.message
              : "Failed to import product.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. ${results.created} products created.`,
      results,
    });
  } catch (error) {
    console.error(
      "BULK PRODUCT IMPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Invalid import data.",
      },
      { status: 500 }
    );
  }
}
