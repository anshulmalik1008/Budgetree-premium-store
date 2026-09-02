import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SiriPayProduct = {
  primary_category_id?: number | string | null;
  primary_category_name?: string | null;

  sub_category_id?: number | string | null;
  sub_category_name?: string | null;

  product_id?: number | string | null;

  sku_code?: string | null;

  brand_id?: number | string | null;
  brand_name?: string | null;

  images?: {
    image1?: string | null;
    image2?: string | null;
    image3?: string | null;
    image4?: string | null;
    image5?: string | null;
  };

  basic_price?: number | string | null;
  shipping_amount?: number | string | null;
  tax_amount?: number | string | null;
  tax_percentage?: number | string | null;

  product_price?: number | string | null;
  product_name?: string | null;

  short_description?: string | null;
  detail_description?: string | null;

  product_mrp?: number | string | null;
  transfer_price?: number | string | null;

  qty?: number | string | null;

  hsn_code?: string | null;
};

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const valueNumber = Number(value);

  return Number.isFinite(valueNumber)
    ? valueNumber
    : fallback;
}

function makeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getImages(
  product: SiriPayProduct
): string[] {
  const images = product.images;

  if (!images) {
    return [];
  }

  const values = [
    images.image1,
    images.image2,
    images.image3,
    images.image4,
    images.image5,
  ];

  return Array.from(
    new Set(
      values
        .map((value) => cleanText(value))
        .filter(
          (value) =>
            value.length > 0 &&
            /^https?:\/\//i.test(value)
        )
    )
  );
}

async function getCategory(
  name: string
) {
  const categoryName = cleanText(name);

  if (!categoryName) {
    return null;
  }

  const slug =
    makeSlug(categoryName) ||
    `category-${Date.now()}`;

  let category =
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
            slug,
          },
        ],
      },
    });

  if (category) {
    return category;
  }

  category =
    await prisma.category.create({
      data: {
        name: categoryName,
        slug,
        active: true,
      },
    });

  return category;
}

async function makeUniqueSlug(
  name: string,
  sku: string
) {
  const base =
    makeSlug(name) || "product";

  const skuPart =
    makeSlug(sku) || "item";

  const firstSlug =
    `${base}-${skuPart}`;

  const existing =
    await prisma.product.findUnique({
      where: {
        slug: firstSlug,
      },
      select: {
        id: true,
      },
    });

  if (!existing) {
    return firstSlug;
  }

  return `${firstSlug}-${Date.now()}`;
}

export async function POST(
  _request: NextRequest
) {
  try {
    /*
     * Existing /api/products route already
     * handles SiriPay pagination.
     *
     * We intentionally DO NOT change it.
     */

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const response = await fetch(
      `${appUrl}/api/products?page=1&size=100`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Products API failed with ${response.status}`
      );
    }

    const responseData =
      await response.json();

    const productsData =
      Array.isArray(responseData)
        ? responseData
        : Array.isArray(
              responseData?.products
            )
          ? responseData.products
          : Array.isArray(
                responseData?.data
              )
            ? responseData.data
            : [];

    const products =
      productsData as SiriPayProduct[];

    if (products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No SiriPay products found.",
        },
        { status: 404 }
      );
    }

    const result = {
      total: products.length,
      created: 0,
      updated: 0,
      failed: 0,
      images: 0,
      categoriesCreated: 0,
      errors: [] as {
        sku: string;
        message: string;
      }[],
    };

    const existingCategories =
      new Set(
        (
          await prisma.category.findMany({
            select: {
              id: true,
            },
          })
        ).map((category) => category.id)
      );

    for (const item of products) {
      try {
        const sku =
          cleanText(item.sku_code);

        const productName =
          cleanText(
            item.product_name
          );

        if (!sku) {
          throw new Error(
            "SKU missing"
          );
        }

        if (!productName) {
          throw new Error(
            "Product name missing"
          );
        }

        const externalId =
          item.product_id !== null &&
          item.product_id !== undefined
            ? String(item.product_id)
            : null;

        const price =
          numberValue(
            item.product_price,
            numberValue(
              item.basic_price,
              0
            )
          );

        const mrp =
          numberValue(
            item.product_mrp,
            price
          );

        const stock = Math.max(
          0,
          Math.floor(
            numberValue(
              item.qty,
              0
            )
          )
        );

        const images =
          getImages(item);

        /*
         * PRIMARY CATEGORY
         */
        const category =
          await getCategory(
            cleanText(
              item.primary_category_name
            )
          );

        if (
          category &&
          !existingCategories.has(
            category.id
          )
        ) {
          result.categoriesCreated++;

          existingCategories.add(
            category.id
          );
        }

        /*
         * Check existing product by SKU.
         */
        const existing =
          await prisma.product.findUnique({
            where: {
              sku,
            },
            select: {
              id: true,
            },
          });

        /*
         * =========================
         * UPDATE EXISTING PRODUCT
         * =========================
         */
        if (existing) {
          await prisma.$transaction(
            async (tx) => {
              await tx.product.update({
                where: {
                  id: existing.id,
                },

                data: {
                  name: productName,

                  description:
                    cleanText(
                      item.detail_description
                    ) ||
                    cleanText(
                      item.short_description
                    ) ||
                    null,

                  price,

                  mrp:
                    mrp > 0
                      ? mrp
                      : null,

                  /*
                   * SiriPay product_price
                   * is the actual selling price.
                   */
                  salePrice:
                    mrp > price &&
                    price > 0
                      ? price
                      : null,

                  stock,

                  status:
                    stock > 0
                      ? "ACTIVE"
                      : "OUT_OF_STOCK",

                  categoryId:
                    category?.id ??
                    null,

                  externalId,

                  externalSource:
                    "SIRIPAY",

                  brandName:
                    cleanText(
                      item.brand_name
                    ) || null,

                  subCategoryName:
                    cleanText(
                      item.sub_category_name
                    ) || null,

                  primaryCategoryId:
                    item.primary_category_id !==
                      null &&
                    item.primary_category_id !==
                      undefined
                      ? Number(
                          item.primary_category_id
                        )
                      : null,

                  subCategoryId:
                    item.sub_category_id !==
                      null &&
                    item.sub_category_id !==
                      undefined
                      ? Number(
                          item.sub_category_id
                        )
                      : null,

                  hsnCode:
                    cleanText(
                      item.hsn_code
                    ) || null,
                },
              });

              /*
               * Only replace images when
               * SiriPay actually supplied images.
               */
              if (images.length > 0) {
                await tx.productImage.deleteMany(
                  {
                    where: {
                      productId:
                        existing.id,
                    },
                  }
                );

                await tx.productImage.createMany(
                  {
                    data: images.map(
                      (
                        url,
                        index
                      ) => ({
                        productId:
                          existing.id,
                        url,
                        alt:
                          productName,
                        sortOrder:
                          index,
                      })
                    ),
                  }
                );

                result.images +=
                  images.length;
              }
            }
          );

          result.updated++;

          continue;
        }

        /*
         * =========================
         * CREATE NEW PRODUCT
         * =========================
         */

        const slug =
          await makeUniqueSlug(
            productName,
            sku
          );

        await prisma.product.create({
          data: {
            sku,

            name:
              productName,

            slug,

            description:
              cleanText(
                item.detail_description
              ) ||
              cleanText(
                item.short_description
              ) ||
              null,

            price,

            mrp:
              mrp > 0
                ? mrp
                : null,

            salePrice:
              mrp > price &&
              price > 0
                ? price
                : null,

            stock,

            status:
              stock > 0
                ? "ACTIVE"
                : "OUT_OF_STOCK",

            featured: false,

            categoryId:
              category?.id ??
              null,

            externalId,

            externalSource:
              "SIRIPAY",

            brandName:
              cleanText(
                item.brand_name
              ) || null,

            subCategoryName:
              cleanText(
                item.sub_category_name
              ) || null,

            primaryCategoryId:
              item.primary_category_id !==
                null &&
              item.primary_category_id !==
                undefined
                ? Number(
                    item.primary_category_id
                  )
                : null,

            subCategoryId:
              item.sub_category_id !==
                null &&
              item.sub_category_id !==
                undefined
                ? Number(
                    item.sub_category_id
                  )
                : null,

            hsnCode:
              cleanText(
                item.hsn_code
              ) || null,

            images: {
              create:
                images.map(
                  (
                    url,
                    index
                  ) => ({
                    url,
                    alt:
                      productName,
                    sortOrder:
                      index,
                  })
                ),
            },
          },
        });

        result.created++;

        result.images +=
          images.length;
      } catch (error) {
        result.failed++;

        result.errors.push({
          sku:
            cleanText(
              item.sku_code
            ),

          message:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,

      message:
        "SiriPay catalogue synced successfully.",

      result,
    });
  } catch (error) {
    console.error(
      "SIRIPAY SYNC ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "SiriPay sync failed.",
      },
      { status: 500 }
    );
  }
}