import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   TYPES
========================================================= */

type AnyObject = Record<string, any>;

/* =========================================================
   GET SIRIPAY CATEGORIES
========================================================= */

export async function GET() {
  try {
    /* -------------------------------------------------------
       GET ACTIVE EXTERNAL API
    ------------------------------------------------------- */

    const api = await prisma.externalApi.findFirst({
      where: {
        active: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!api) {
      return NextResponse.json(
        {
          success: false,
          message: "No active external API configured.",
          categories: [],
          total: 0,
        },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       CATEGORY URL
       
       Products URL:
       /api/v1/merchandise/products

       Categories URL:
       /api/v1/merchandise/categories
    ------------------------------------------------------- */

    const categoriesUrl = api.productsUrl.replace(
      /\/products\/?$/i,
      "/categories"
    );

    /* -------------------------------------------------------
       HEADERS
    ------------------------------------------------------- */

    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    /* -------------------------------------------------------
       AUTH
    ------------------------------------------------------- */

    if (api.authType === "BEARER") {
      const token =
        api.jwtToken ||
        api.apiKey ||
        "";

      if (!token) {
        return NextResponse.json(
          {
            success: false,
            message: "Bearer/JWT token is missing.",
            categories: [],
            total: 0,
          },
          { status: 400 }
        );
      }

      headers.Authorization = `Bearer ${token}`;
    }

    /* -------------------------------------------------------
       BASIC AUTH
    ------------------------------------------------------- */

    if (api.authType === "BASIC") {
      if (!api.username || !api.password) {
        return NextResponse.json(
          {
            success: false,
            message: "Basic Auth username/password is missing.",
            categories: [],
            total: 0,
          },
          { status: 400 }
        );
      }

      const basicAuth = Buffer.from(
        `${api.username}:${api.password}`
      ).toString("base64");

      headers.Authorization = `Basic ${basicAuth}`;
    }

    /* -------------------------------------------------------
       API KEY
    ------------------------------------------------------- */

    if (api.authType === "API_KEY") {
      if (!api.apiKey) {
        return NextResponse.json(
          {
            success: false,
            message: "API key is missing.",
            categories: [],
            total: 0,
          },
          { status: 400 }
        );
      }

      headers.Authorization = `Bearer ${api.apiKey}`;
    }

    /* -------------------------------------------------------
       FETCH SIRIPAY
    ------------------------------------------------------- */

    console.log(
      "FETCHING SIRIPAY CATEGORIES:",
      categoriesUrl
    );

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await response.text();

    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error(
        "SIRIPAY CATEGORY INVALID JSON:",
        text
      );

      return NextResponse.json(
        {
          success: false,
          message: "SiriPay returned invalid JSON.",
          categories: [],
          total: 0,
        },
        { status: 502 }
      );
    }

    /* -------------------------------------------------------
       RESPONSE ERROR
    ------------------------------------------------------- */

    if (!response.ok) {
      console.error(
        "SIRIPAY CATEGORY ERROR:",
        response.status,
        data
      );

      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            `SiriPay Categories API returned ${response.status}`,
          categories: [],
          total: 0,
        },
        { status: response.status }
      );
    }

    /* =======================================================
       FIND CATEGORY ARRAY
    ======================================================= */

    function findCategoryArray(
      value: unknown
    ): AnyObject[] {
      if (Array.isArray(value)) {
        /*
         * A category normally contains one of these fields.
         */
        const looksLikeCategory = value.some(
          (item) => {
            if (
              !item ||
              typeof item !== "object"
            ) {
              return false;
            }

            const obj =
              item as AnyObject;

            return (
              obj.category_id !== undefined ||
              obj.categoryId !== undefined ||
              obj.id !== undefined ||
              obj.category_name !== undefined ||
              obj.categoryName !== undefined ||
              obj.name !== undefined
            );
          }
        );

        if (looksLikeCategory) {
          return value.filter(
            (item) =>
              item &&
              typeof item === "object"
          ) as AnyObject[];
        }

        /*
         * Search nested arrays.
         */
        for (const item of value) {
          const found =
            findCategoryArray(item);

          if (found.length > 0) {
            return found;
          }
        }

        return [];
      }

      if (
        value &&
        typeof value === "object"
      ) {
        const obj =
          value as AnyObject;

        /*
         * Search common response keys first.
         */
        const keys = [
          "categories",
          "data",
          "results",
          "items",
          "content",
        ];

        for (const key of keys) {
          if (obj[key] !== undefined) {
            const found =
              findCategoryArray(obj[key]);

            if (found.length > 0) {
              return found;
            }
          }
        }

        /*
         * Last fallback: search every property.
         */
        for (const child of Object.values(obj)) {
          const found =
            findCategoryArray(child);

          if (found.length > 0) {
            return found;
          }
        }
      }

      return [];
    }

    const rawCategories =
      findCategoryArray(data);

    /* =======================================================
       NORMALIZE CATEGORIES
    ======================================================= */

    const normalizedCategories =
      rawCategories
        .map(
          (
            item: AnyObject,
            index: number
          ) => {
            /*
             * ID
             */
            const id =
              item.category_id ??
              item.categoryId ??
              item.id ??
              item.primary_category_id ??
              `siripay-category-${index + 1}`;

            /*
             * NAME
             */
            const name =
              item.category_name ??
              item.categoryName ??
              item.name ??
              item.title ??
              item.primary_category_name ??
              `Category ${index + 1}`;

            /*
             * SUB CATEGORY
             */
            const subCategoryId =
              item.sub_category_id ??
              item.subCategoryId ??
              item.subcategory_id ??
              null;

            const subCategoryName =
              item.sub_category_name ??
              item.subCategoryName ??
              item.subcategory_name ??
              null;

            /*
             * IMAGE
             */
            const image =
              item.image ??
              item.image_url ??
              item.imageUrl ??
              item.category_image ??
              item.category_image_url ??
              item.icon ??
              null;

            /*
             * SLUG
             */
            const slug = String(name)
              .toLowerCase()
              .trim()
              .replace(
                /[^a-z0-9]+/g,
                "-"
              )
              .replace(
                /^-+|-+$/g,
                "");

            return {
              id: String(id),

              category_id:
                item.category_id ??
                item.categoryId ??
                item.id ??
                item.primary_category_id ??
                id,

              name: String(name),

              category_name:
                String(name),

              slug,

              image:
                typeof image === "string"
                  ? image
                  : null,

              image_url:
                typeof image === "string"
                  ? image
                  : null,

              sub_category_id:
                subCategoryId,

              sub_category_name:
                subCategoryName,

              parent_id:
                item.parent_id ??
                item.parentId ??
                item.parent_category_id ??
                null,

              source: "SIRIPAY",
            };
          }
        )
        /*
         * Remove invalid categories.
         */
        .filter(
          (category) =>
            category.name &&
            category.name !==
              "Category 0"
        );

    /* =======================================================
       REMOVE DUPLICATES
    ======================================================= */

    const uniqueCategories =
      Array.from(
        new Map(
          normalizedCategories.map(
            (category) => [
              `${category.id}-${category.name}`,
              category,
            ]
          )
        ).values()
      );

    /* =======================================================
       SORT
    ======================================================= */

    uniqueCategories.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          "en",
          {
            sensitivity: "base",
          }
        )
    );

    console.log(
      "SIRIPAY CATEGORIES:",
      uniqueCategories.length
    );

    console.log(
      "FIRST CATEGORY:",
      uniqueCategories[0]
    );

    /* =======================================================
       RESPONSE
    ======================================================= */

    return NextResponse.json(
      {
        success: true,

        source: "SIRIPAY",

        total:
          uniqueCategories.length,

        categories:
          uniqueCategories,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET SIRIPAY CATEGORIES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch SiriPay categories",
        categories: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — MANUAL CATEGORY
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const name = String(
      body.name ?? ""
    ).trim();

    const slug = String(
      body.slug ?? ""
    ).trim();

    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name and slug are required",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.category.findFirst({
        where: {
          OR: [
            { name },
            { slug },
          ],
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name or slug already exists",
        },
        { status: 409 }
      );
    }

    const category =
      await prisma.category.create({
        data: {
          name,
          slug,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Category created successfully",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE CATEGORY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create category",
      },
      { status: 500 }
    );
  }
}