import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export const dynamic = "force-dynamic";
export const revalidate = 0;



type AnyObject = Record<string, any>;


async function fetchJSON(
  url: string,
  headers: HeadersInit,
  timeout = 15000
): Promise<any> {
  console.log("SIRIPAY FETCH:", url);

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();

    let data: any = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid JSON response from external API (${response.status})`
        );
      }
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `External API returned ${response.status}`;

      const error: any = new Error(message);

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}


function getArray(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  const possible = [
    data?.products,
    data?.items,
    data?.results,
    data?.content,

    data?.data,

    data?.data?.products,
    data?.data?.items,
    data?.data?.results,
    data?.data?.content,

    data?.records,
    data?.data?.records,
  ];

  for (const value of possible) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}



function makeImageUrl(
  value: any,
  productsUrl: string
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const image = value.trim();

  if (!image) {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("//")
  ) {
    return image.startsWith("//")
      ? `https:${image}`
      : image;
  }

  let base = productsUrl;

  try {
    const url = new URL(productsUrl);

    base = `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    // keep original
  }

  base = base
    .replace(/\/products\/?$/i, "")
    .replace(/\/+$/, "");

  return `${base}/images/${encodeURIComponent(image)}`;
}


function normalizeExternalProduct(
  item: AnyObject,
  index: number,
  productsUrl: string
) {
  const id =
    item.product_id ??
    item.productId ??
    item.id ??
    item.sku ??
    item.sku_code ??
    `external-${index}`;

  const name =
    item.product_name ??
    item.productName ??
    item.name ??
    item.title ??
    "Unnamed Product";

  const price = Number(
    item.product_price ??
      item.productPrice ??
      item.price ??
      item.selling_price ??
      item.sellingPrice ??
      item.transfer_price ??
      item.transferPrice ??
      0
  );

  const mrp = Number(
    item.product_mrp ??
      item.productMrp ??
      item.mrp ??
      item.original_price ??
      item.originalPrice ??
      price
  );

  const stock = Number(
    item.qty ??
      item.quantity ??
      item.stock ??
      item.available_quantity ??
      item.availableQuantity ??
      0
  );

  
  const rawImages: any[] = [];

  const singleImageFields = [
    "image",
    "image_url",
    "imageUrl",
    "thumbnail",
    "thumbnail_url",
    "thumbnailUrl",
    "photo",
    "photo_url",
    "photoUrl",
    "product_image",
    "productImage",
    "product_image_url",
    "productImageUrl",
    "main_image",
    "mainImage",
  ];

  for (const field of singleImageFields) {
    if (item[field]) {
      rawImages.push(item[field]);
    }
  }

  const multipleImageFields = [
    "images",
    "image_urls",
    "imageUrls",
    "gallery",
    "photos",
    "product_images",
    "productImages",
  ];

  for (const field of multipleImageFields) {
    const value = item[field];

    if (Array.isArray(value)) {
      rawImages.push(...value);
    } else if (
      value &&
      typeof value === "object"
    ) {
      rawImages.push(
        ...Object.values(value)
      );
    } else if (typeof value === "string") {
      rawImages.push(value);
    }
  }

  const images = Array.from(
    new Set(
      rawImages
        .map((value) =>
          makeImageUrl(
            typeof value === "object"
              ? value?.url ??
                value?.image ??
                value?.src
              : value,
            productsUrl
          )
        )
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  );

  

  const categoryId =
    item.category_id ??
    item.categoryId ??
    item.primary_category_id ??
    item.primaryCategoryId ??
    item.category?.id ??
    null;

  const categoryName =
    item.category_name ??
    item.categoryName ??
    item.primary_category_name ??
    item.primaryCategoryName ??
    item.category?.name ??
    "Uncategorized";

  /* =======================================================
     BRAND
  ======================================================= */

  const brandId =
    item.brand_id ??
    item.brandId ??
    item.brand?.id ??
    null;

  const brandName =
    item.brand_name ??
    item.brandName ??
    item.brand?.name ??
    "";

  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    id: String(id),

    externalId: String(id),

    sku:
      item.sku_code ??
      item.sku ??
      `EXT-${id}`,

    name,

    slug,

    description:
      item.description ??
      item.detail_description ??
      item.detailDescription ??
      null,

    price,

    salePrice:
      mrp > price
        ? price
        : null,

    mrp,

    stock,

    qty: stock,

    status:
      stock > 0
        ? "ACTIVE"
        : "OUT_OF_STOCK",

    featured:
      Boolean(item.todayDeal) ||
      Boolean(item.discountDeal) ||
      Boolean(item.featured),

    category: {
      id: categoryId,
      name: categoryName,
    },

    categoryId,

    categoryName,

    brand: {
      id: brandId,
      name: brandName,
    },

    brandName,

    image:
      images[0] ?? null,

    images,

    gallery: images,

    externalData: item,
  };
}


async function fetchSiriPayProducts(
  api: AnyObject
): Promise<any[]> {
  if (!api.productsUrl) {
    throw new Error(
      "SiriPay products URL missing"
    );
  }

  

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const authType = String(
    api.authType ?? "NONE"
  ).toUpperCase();

  console.log(
    "AUTH TYPE:",
    authType
  );

  

  if (authType === "BEARER") {
    const token = String(
      api.jwtToken ?? ""
    ).trim();

    console.log(
      "HAS JWT:",
      Boolean(token)
    );

    if (!token) {
      throw new Error(
        "JWT token missing"
      );
    }

    headers.Authorization =
      `Bearer ${token}`;
  }

  

  if (authType === "BASIC") {
    const username = String(
      api.username ?? ""
    );

    const password = String(
      api.password ?? ""
    );

    if (!username || !password) {
      throw new Error(
        "Basic authentication username/password missing"
      );
    }

    const encoded = Buffer.from(
      `${username}:${password}`
    ).toString("base64");

    headers.Authorization =
      `Basic ${encoded}`;
  }

  

  if (authType === "API_KEY") {
    const key = String(
      api.apiKey ?? ""
    ).trim();

    if (!key) {
      throw new Error(
        "API key missing"
      );
    }

    headers.Authorization =
      `Bearer ${key}`;
  }

  

  const url =
    new URL(api.productsUrl);

  url.searchParams.set(
    "page",
    "1"
  );

  url.searchParams.set(
    "size",
    "100"
  );

  url.searchParams.set(
    "limit",
    "100"
  );

  const data =
    await fetchJSON(
      url.toString(),
      headers
    );

  const rawProducts =
    getArray(data);

  console.log(
    "SIRIPAY FIRST PAGE:",
    rawProducts.length
  );

  

  const meta =
    data?.pagination ??
    data?.meta ??
    data?.data?.pagination ??
    data?.data?.meta ??
    {};

  console.log(
    "SIRIPAY META:",
    JSON.stringify(meta)
  );

  

  let allProducts =
    [...rawProducts];

  let externalTotalPages = Number(
    meta.totalPages ??
      meta.total_pages ??
      meta.lastPage ??
      meta.last_page ??
      data?.totalPages ??
      data?.total_pages ??
      1
  );

  const externalTotal = Number(
    meta.total ??
      meta.totalItems ??
      meta.total_items ??
      data?.total ??
      data?.totalItems ??
      allProducts.length
  );

  const externalPerPage = Number(
    meta.perPage ??
      meta.per_page ??
      meta.pageSize ??
      meta.page_size ??
      100
  );

  if (
    externalTotalPages <= 1 &&
    externalTotal > externalPerPage
  ) {
    externalTotalPages =
      Math.ceil(
        externalTotal /
          externalPerPage
      );
  }

  externalTotalPages =
    Math.max(
      1,
      Math.min(
        externalTotalPages,
        500
      )
    );

  console.log(
    "SIRIPAY TOTAL:",
    externalTotal
  );

  console.log(
    "SIRIPAY PER PAGE:",
    externalPerPage
  );

  console.log(
    "SIRIPAY TOTAL PAGES:",
    externalTotalPages
  );

  
  for (
    let page = 2;
    page <= externalTotalPages;
    page++
  ) {
    try {
      const pageUrl =
        new URL(
          api.productsUrl
        );

      pageUrl.searchParams.set(
        "page",
        String(page)
      );

      pageUrl.searchParams.set(
        "size",
        "100"
      );

      pageUrl.searchParams.set(
        "limit",
        "100"
      );

      const pageData =
        await fetchJSON(
          pageUrl.toString(),
          headers
        );

      const pageProducts =
        getArray(pageData);

      console.log(
        `SIRIPAY PAGE ${page}:`,
        pageProducts.length
      );

      if (
        pageProducts.length === 0
      ) {
        break;
      }

      allProducts.push(
        ...pageProducts
      );
    } catch (error) {
      console.error(
        `SIRIPAY PAGE ${page} ERROR:`,
        error
      );

      break;
    }
  }

  
  const unique =
    new Map<string, any>();

  allProducts.forEach(
    (product, index) => {
      const id =
        product?.product_id ??
        product?.productId ??
        product?.id ??
        product?.sku ??
        product?.sku_code ??
        `product-${index}`;

      unique.set(
        String(id),
        product
      );
    }
  );

  allProducts =
    Array.from(
      unique.values()
    );

  console.log(
    "SIRIPAY ALL PRODUCTS:",
    allProducts.length
  );

  return allProducts.map(
    (item, index) =>
      normalizeExternalProduct(
        item,
        index,
        api.productsUrl
      )
  );
}



async function fetchSiriPayCategories(
  api: AnyObject
): Promise<any[]> {
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const authType = String(
    api.authType ?? "NONE"
  ).toUpperCase();

  // =========================
  // AUTH
  // =========================

  if (authType === "BEARER") {
    const token = String(
      api.jwtToken ?? ""
    ).trim();

    if (!token) {
      console.error("CATEGORY API: JWT missing");
      return [];
    }

    headers.Authorization = `Bearer ${token}`;
  }

  if (
    authType === "BASIC" &&
    api.username &&
    api.password
  ) {
    const encoded = Buffer.from(
      `${api.username}:${api.password}`
    ).toString("base64");

    headers.Authorization = `Basic ${encoded}`;
  }

  if (authType === "API_KEY" && api.apiKey) {
    headers.Authorization =
      `Bearer ${String(api.apiKey).trim()}`;
  }

  // =========================
  // SIRIPAY CATEGORY URL
  // =========================

  let categoryUrl =
    "https://api.dealer.siripay.co/api/v1/merchandise/categories";

  // Agar productsUrl kisi aur domain par ho,
  // usi domain se automatically category URL banayega.
  try {
    const productUrl = new URL(
      String(api.productsUrl)
    );

    const pathname = productUrl.pathname;

    const merchandiseIndex =
      pathname.indexOf("/merchandise/");

    if (merchandiseIndex !== -1) {
      const basePath = pathname.substring(
        0,
        merchandiseIndex + "/merchandise".length
      );

      categoryUrl =
        `${productUrl.protocol}//${productUrl.host}${basePath}/categories`;
    }
  } catch {
    // Default SiriPay URL use hoga
  }

  console.log(
    "SIRIPAY CATEGORY URL:",
    categoryUrl
  );

  try {
    const data = await fetchJSON(
      categoryUrl,
      headers
    );

    const categories = getArray(data);

    console.log(
      "SIRIPAY CATEGORIES:",
      categories.length
    );

    if (categories.length > 0) {
      return categories;
    }

    // Kuch APIs response ko data.categories ke andar
    // return karti hain.
    const nestedCategories =
      data?.categories ??
      data?.data?.categories ??
      data?.data?.items ??
      data?.items ??
      [];

    if (Array.isArray(nestedCategories)) {
      console.log(
        "SIRIPAY NESTED CATEGORIES:",
        nestedCategories.length
      );

      return nestedCategories;
    }

    console.log(
      "SIRIPAY CATEGORY RESPONSE HAS NO ARRAY"
    );

    return [];
  } catch (error: any) {
    console.error(
      "SIRIPAY CATEGORY API ERROR:",
      error?.message ?? error
    );

    return [];
  }
}


function normalizeCategories(
  categories: any[],
  products: any[]
) {
  const result =
    categories.length > 0
      ? categories
      : products
          .filter(
            (product) =>
              product.categoryName &&
              product.categoryName !==
                "Uncategorized"
          )
          .map((product) => ({
            id:
              product.categoryId ??
              product.categoryName,
            name:
              product.categoryName,
          }));

  const unique =
    new Map<string, any>();

  result.forEach(
    (category, index) => {
      const name =
        category?.name ??
        category?.category_name ??
        category?.categoryName ??
        category?.title ??
        "Category";

      const id =
        category?.id ??
        category?.category_id ??
        category?.categoryId ??
        index + 1;

      unique.set(
        String(id),
        {
          id,
          name,
          slug: String(name)
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /^-+|-+$/g,
              ""
            ),
          image:
            category?.image ??
            category?.image_url ??
            category?.imageUrl ??
            category?.photo ??
            null,
        }
      );
    }
  );

  return Array.from(
    unique.values()
  );
}



async function getLocalProducts() {
  try {
    const local =
      await prisma.product.findMany({
        orderBy: {
          id: "desc",
        },
      });

    console.log(
      "LOCAL PRODUCTS:",
      local.length
    );

    return local.map(
      (product: any) => ({
        id: String(
          product.id
        ),

        externalId:
          product.externalId
            ? String(
                product.externalId
              )
            : null,

        sku:
          product.sku ??
          `LOCAL-${product.id}`,

        name:
          product.name ??
          "Unnamed Product",

        slug:
          product.slug ??
          String(
            product.name ??
              "product"
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            ),

        description:
          product.description ??
          null,

        price: Number(
          product.price ?? 0
        ),

        salePrice:
          product.salePrice != null
            ? Number(
                product.salePrice
              )
            : null,

        mrp:
          product.mrp != null
            ? Number(
                product.mrp
              )
            : Number(
                product.price ?? 0
              ),

        stock: Number(
          product.stock ??
            product.qty ??
            0
        ),

        qty: Number(
          product.qty ??
            product.stock ??
            0
        ),

        status:
          product.status ??
          "ACTIVE",

        featured:
          Boolean(
            product.featured
          ),

        category: {
          id:
            product.categoryId ??
            null,

          name:
            product.categoryName ??
            "Uncategorized",
        },

        categoryId:
          product.categoryId ??
          null,

        categoryName:
          product.categoryName ??
          "Uncategorized",

        brand: {
          id:
            product.brandId ??
            null,

          name:
            product.brandName ??
            "",
        },

        brandName:
          product.brandName ??
          "",

        image:
          product.image ??
          null,

        images:
          Array.isArray(
            product.images
          )
            ? product.images
            : product.image
              ? [product.image]
              : [],

        gallery:
          Array.isArray(
            product.gallery
          )
            ? product.gallery
            : product.image
              ? [product.image]
              : [],

        externalData:
          null,
      })
    );
  } catch (error) {
    console.error(
      "LOCAL PRODUCTS ERROR:",
      error
    );

    return [];
  }
}



export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(
        request.url
      );

    

    const requestedPage =
      Number(
        searchParams.get(
          "page"
        ) ?? "1"
      );

    const requestedSize =
      Number(
        searchParams.get(
          "size"
        ) ?? "24"
      );

    const page =
      Number.isFinite(
        requestedPage
      ) &&
      requestedPage > 0
        ? Math.floor(
            requestedPage
          )
        : 1;

    const size =
      Number.isFinite(
        requestedSize
      ) &&
      requestedSize > 0
        ? Math.min(
            Math.floor(
              requestedSize
            ),
            100
          )
        : 24;

    console.log(
      "REQUEST PAGE:",
      page,
      "LIMIT:",
      size
    );

    

    const localProducts =
      await getLocalProducts();

    

    const api =
      await prisma.externalApi.findFirst(
        {
          orderBy: {
            id: "desc",
          },
        }
      );

    let products: any[] = [];
    let categories: any[] = [];
    let source = "LOCAL";

    
    if (api?.productsUrl) {
      try {
        products =
          await fetchSiriPayProducts(
            api
          );

        if (
          products.length > 0
        ) {
          source =
            "SIRIPAY";

          categories =
            await fetchSiriPayCategories(
              api
            );
        }
      } catch (error: any) {
        console.error(
          "SIRIPAY ERROR:",
          error?.message ??
            error
        );

        if (
          error?.status === 401
        ) {
          console.error(
            "SIRIPAY AUTH FAILED: Check Bearer JWT."
          );
        }
      }
    }

    

    if (
      products.length === 0
    ) {
      products =
        localProducts;

      source =
        "LOCAL";

      console.log(
        "USING LOCAL PRODUCTS"
      );
    }

    categories =
      normalizeCategories(
        categories,
        products
      );

    
    const total =
      products.length;

   

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / size
        )
      );


    const safePage =
      Math.min(
        Math.max(
          page,
          1
        ),
        totalPages
      );

    /* =====================================================
       SLICE PRODUCTS
    ===================================================== */

    const start =
      (safePage - 1) *
      size;

    const end =
      start + size;

    const pageProducts =
      products.slice(
        start,
        end
      );

    console.log(
      "FINAL PRODUCTS:",
      products.length
    );

    console.log(
      "FINAL CATEGORIES:",
      categories.length
    );

    console.log(
      "SOURCE:",
      source
    );

    console.log(
      `PAGE: ${safePage} / ${totalPages}`
    );

    console.log(
      "PAGE PRODUCTS:",
      pageProducts.length
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        source,

        count:
          pageProducts.length,

        total,

        products:
          pageProducts,

        categories,

        pagination: {
          page: safePage,

          size,

          total,

          totalPages,

          hasNextPage:
            safePage <
            totalPages,

          hasPreviousPage:
            safePage > 1,

          start:
            total === 0
              ? 0
              : start + 1,

          end: Math.min(
            end,
            total
          ),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    /*
     * IMPORTANT:
     * Always return JSON.
     *
     * Isse frontend par:
     *
     * Unexpected end of JSON input
     *
     * nahi aayega.
     */

    return NextResponse.json(
      {
        success: false,

        source: "ERROR",

        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch products",

        total: 0,

        products: [],

        categories: [],

        pagination: {
          page: 1,
          size: 24,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          start: 0,
          end: 0,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  }
}
