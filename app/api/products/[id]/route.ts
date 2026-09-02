import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getProductId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function cleanString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getNumber(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getNullableNumber(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return [
      "true",
      "1",
      "yes",
      "on",
    ].includes(value.toLowerCase().trim());
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

function getImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

// ======================================================
// GET PRODUCT
// ======================================================

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId = getProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
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

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "GET PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// UPDATE PRODUCT
// ======================================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId = getProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        include: {
          images: true,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    const name = cleanString(body.name);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is required",
        },
        { status: 400 }
      );
    }

    const slug =
      cleanString(body.slug) ||
      existingProduct.slug;

    const price = getNumber(
      body.price,
      Number(existingProduct.price)
    );

    if (price < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Price cannot be negative",
        },
        { status: 400 }
      );
    }

    const salePrice =
      body.salePrice !== undefined
        ? getNullableNumber(body.salePrice)
        : existingProduct.salePrice !== null
          ? Number(existingProduct.salePrice)
          : null;

    if (
      salePrice !== null &&
      salePrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sale price cannot be negative",
        },
        { status: 400 }
      );
    }

    const stock =
      body.stock !== undefined
        ? Math.max(
            0,
            Math.floor(
              getNumber(body.stock, 0)
            )
          )
        : existingProduct.stock;

    let categoryId =
      existingProduct.categoryId;

    if (
      body.categoryId !== undefined
    ) {
      if (
        body.categoryId === null ||
        body.categoryId === ""
      ) {
        categoryId = null;
      } else {
        const parsedCategoryId =
          Number(body.categoryId);

        if (
          !Number.isInteger(
            parsedCategoryId
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid category ID",
            },
            { status: 400 }
          );
        }

        const category =
          await prisma.category.findUnique({
            where: {
              id: parsedCategoryId,
            },
          });

        if (!category) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Selected category not found",
            },
            { status: 400 }
          );
        }

        categoryId =
          parsedCategoryId;
      }
    }

    const featured =
      body.featured !== undefined
        ? getBoolean(body.featured)
        : existingProduct.featured;

    const description =
      body.description !== undefined
        ? cleanString(body.description) ||
          null
        : existingProduct.description;

    const imagesWereSent =
      body.images !== undefined;

    const images = imagesWereSent
      ? getImages(body.images)
      : [];

    const updatedProduct =
      await prisma.$transaction(
        async (tx) => {
          const product =
            await tx.product.update({
              where: {
                id: productId,
              },

              data: {
                name,
                slug,
                description,

                price,

                salePrice,

                stock,

                categoryId,

                featured,
              },
            });

          if (imagesWereSent) {
            await tx.productImage.deleteMany({
              where: {
                productId,
              },
            });

            if (images.length > 0) {
              await tx.productImage.createMany(
                {
                  data: images.map(
                    (url, index) => ({
                      productId,
                      url,
                      alt: name,
                      sortOrder: index,
                    })
                  ),
                }
              );
            }
          }

          return tx.product.findUnique({
            where: {
              id: productId,
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
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE PRODUCT
// ======================================================

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId = getProductId(id);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}
