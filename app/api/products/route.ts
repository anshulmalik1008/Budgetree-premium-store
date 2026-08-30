import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET ALL PRODUCTS
========================================================= */

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
        products: [],
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const sku = String(body.sku ?? "").trim();
    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim();
    const description =
      body.description !== null &&
      body.description !== undefined
        ? String(body.description).trim()
        : null;

    const price = Number(body.price);

    const salePrice =
      body.salePrice !== null &&
      body.salePrice !== undefined &&
      body.salePrice !== ""
        ? Number(body.salePrice)
        : null;

    const stock =
      body.stock !== undefined &&
      body.stock !== null
        ? Number(body.stock)
        : 0;

    const categoryId =
      body.categoryId !== null &&
      body.categoryId !== undefined &&
      body.categoryId !== ""
        ? Number(body.categoryId)
        : null;

    const featured = Boolean(body.featured);

    /* =========================
       VALIDATION
    ========================= */

    if (!sku || !name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SKU, name and slug are required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid product price is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      salePrice !== null &&
      (!Number.isFinite(salePrice) ||
        salePrice < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sale price",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid stock value",
        },
        {
          status: 400,
        }
      );
    }

    if (
      categoryId !== null &&
      (!Number.isInteger(categoryId) ||
        categoryId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       CHECK DUPLICATES
    ========================= */

    const existingSku =
      await prisma.product.findUnique({
        where: {
          sku,
        },
      });

    if (existingSku) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A product with this SKU already exists",
        },
        {
          status: 409,
        }
      );
    }

    const existingSlug =
      await prisma.product.findUnique({
        where: {
          slug,
        },
      });

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A product with this slug already exists",
        },
        {
          status: 409,
        }
      );
    }

    /* =========================
       CHECK CATEGORY
    ========================= */

    if (categoryId !== null) {
      const category =
        await prisma.category.findUnique({
          where: {
            id: categoryId,
          },
        });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected category not found",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =========================
       CLEAN IMAGES
    ========================= */

    const imageUrls: string[] =
      Array.isArray(body.images)
        ? body.images
            .map((image: unknown) =>
              typeof image === "string"
                ? image.trim()
                : ""
            )
            .filter(
              (image: string) =>
                image.length > 0
            )
        : [];

    /* =========================
       CREATE PRODUCT
    ========================= */

    const product =
      await prisma.product.create({
        data: {
          sku,
          name,
          slug,
          description:
            description || null,

          price,

          salePrice:
            salePrice !== null
              ? salePrice
              : null,

          stock: Math.floor(stock),

          categoryId,

          featured,

          status:
            stock > 0
              ? "ACTIVE"
              : "OUT_OF_STOCK",

          images:
            imageUrls.length > 0
              ? {
                  create: imageUrls.map(
                    (
                      url: string,
                      index: number
                    ) => ({
                      url,
                      sortOrder: index,
                      alt: name,
                    })
                  ),
                }
              : undefined,
        },

        include: {
          category: true,

          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Product created successfully",
        product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    /*
     * Prisma unique constraint
     */
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code ===
        "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SKU or slug already exists",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}
