import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// ==========================================
// GET SINGLE CATEGORY
// ==========================================

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("GET CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch category",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// UPDATE CATEGORY
// ==========================================

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim();

    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and slug are required",
        },
        { status: 400 }
      );
    }

    const existingCategory =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    const duplicateSlug =
      await prisma.category.findFirst({
        where: {
          slug,
          NOT: {
            id: categoryId,
          },
        },
      });

    if (duplicateSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "This slug is already in use",
        },
        { status: 409 }
      );
    }

    const category = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        name,
        slug,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE CATEGORY
// ==========================================

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // Remove category from products first
    if (category._count.products > 0) {
      await prisma.product.updateMany({
        where: {
          categoryId,
        },
        data: {
          categoryId: null,
        },
      });
    }

    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category",
      },
      { status: 500 }
    );
  }
}
