import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET PRODUCT
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
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
    console.error("GET PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

// UPDATE PRODUCT
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      slug,
      description,
      price,
      salePrice,
      stock,
      categoryId,
      featured,
      images,
    } = body;

    if (!name || !slug || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug and price are required",
        },
        { status: 400 }
      );
    }

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
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

    const product = await prisma.$transaction(
      async (tx) => {
        // Update product
        await tx.product.update({
          where: {
            id: productId,
          },

          data: {
            name: name.trim(),
            slug: slug.trim(),
            description:
              description?.trim() || null,

            price: Number(price),

            salePrice:
              salePrice !== null &&
              salePrice !== undefined &&
              salePrice !== ""
                ? Number(salePrice)
                : null,

            stock: Number(stock) || 0,

            categoryId:
              categoryId !== null &&
              categoryId !== undefined &&
              categoryId !== ""
                ? Number(categoryId)
                : null,

            featured: Boolean(featured),
          },
        });

        // Update images only when images are sent
        if (Array.isArray(images)) {
          await tx.productImage.deleteMany({
            where: {
              productId,
            },
          });

          if (images.length > 0) {
            await tx.productImage.createMany({
              data: images
                .filter(
                  (image: unknown) =>
                    typeof image === "string" &&
                    image.trim().length > 0
                )
                .map(
                  (
                    image: string,
                    index: number
                  ) => ({
                    productId,
                    url: image.trim(),
                    sortOrder: index,
                  })
                ),
            });
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
      message: "Product updated successfully",
      product,
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

// DELETE PRODUCT
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
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
      message: "Product deleted successfully",
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
