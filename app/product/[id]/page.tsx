import ProductActions from "./ProductActions";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Check,
  ChevronRight,
  Heart,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
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

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const price = Number(product.price);

  const salePrice =
    product.salePrice !== null
      ? Number(product.salePrice)
      : null;

  const hasSale =
    salePrice !== null && salePrice < price;

  const finalPrice = hasSale
    ? salePrice
    : price;

  const discount = hasSale
    ? Math.round(
        ((price - salePrice) / price) * 100
      )
    : 0;

  const images = product.images ?? [];

  const mainImage =
    images.length > 0
      ? images[0].url
      : null;

  /*
   * ProductActions ko plain serializable object
   * pass kar rahe hain.
   */
  const productForActions = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    salePrice:
      product.salePrice !== null
        ? product.salePrice.toString()
        : null,
    stock: product.stock,
    status: product.status,
    featured: product.featured,

    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,

    images: images.map((image) => ({
      id: image.id,
      productId: image.productId,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080808]/90 backdrop-blur-2xl">

        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 md:px-8 lg:px-12">

          <Link
            href="/"
            className="group"
          >
            <div className="text-xl font-semibold tracking-[-0.04em]">
              BPS
            </div>

            <div className="mt-0.5 text-[7px] uppercase tracking-[0.3em] text-white/30">
              Budgetree Premium Store
            </div>
          </Link>

          <nav className="hidden items-center gap-9 text-xs md:flex">

            <Link
              href="/"
              className="text-white/40 transition hover:text-white"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="font-medium text-[#d5b96e]"
            >
              Shop
            </Link>

            <Link
              href="/wishlist"
              className="text-white/40 transition hover:text-white"
            >
              Wishlist
            </Link>

            <Link
              href="/track-order"
              className="text-white/40 transition hover:text-white"
            >
              Track Order
            </Link>

            <Link
              href="/account"
              className="text-white/40 transition hover:text-white"
            >
              Account
            </Link>

          </nav>

          <div className="flex items-center gap-2">

            <Link
              href="/wishlist"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Heart size={16} />
            </Link>

            <Link
              href="/cart"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4b76b] text-black transition hover:scale-105"
            >
              <ShoppingBag size={16} />
            </Link>

          </div>

        </div>

      </header>

      {/* ================= BREADCRUMB ================= */}

      <div className="mx-auto max-w-[1500px] px-5 pt-8 md:px-8 lg:px-12">

        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-white/25">

          <Link
            href="/"
            className="transition hover:text-white/60"
          >
            Home
          </Link>

          <ChevronRight size={11} />

          <Link
            href="/shop"
            className="transition hover:text-white/60"
          >
            Shop
          </Link>

          <ChevronRight size={11} />

          <span className="max-w-[180px] truncate text-white/50">
            {product.name}
          </span>

        </div>

      </div>

      {/* ================= PRODUCT ================= */}

      <section className="mx-auto max-w-[1500px] px-5 py-10 md:px-8 lg:px-12 lg:py-16">

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">

          {/* ================= IMAGE ================= */}

          <div>

            <div className="relative aspect-square overflow-hidden rounded-[32px] border border-white/[0.07] bg-gradient-to-br from-[#181818] to-[#0d0d0d]">

              {mainImage ? (

                <Image
                  src={mainImage}
                  alt={
                    images[0]?.alt ||
                    product.name
                  }
                  fill
                  priority
                  className="object-contain p-8 md:p-14"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />

              ) : (

                <div className="flex h-full items-center justify-center">

                  <ShoppingBag
                    size={80}
                    strokeWidth={1}
                    className="text-[#c8a65a]/20"
                  />

                </div>

              )}

              {/* FEATURED */}

              {product.featured && (

                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-[#d4b76b]/20 bg-black/50 px-4 py-2 text-[8px] uppercase tracking-[0.2em] text-[#d4b76b] backdrop-blur-xl">

                  <Sparkles size={11} />

                  Featured

                </div>

              )}

              {/* DISCOUNT */}

              {hasSale && (

                <div className="absolute right-5 top-5 rounded-full bg-[#d4b76b] px-4 py-2 text-[9px] font-bold text-black">

                  {discount}% OFF

                </div>

              )}

            </div>

            {/* GALLERY */}

            {images.length > 1 && (

              <div className="mt-4 grid grid-cols-5 gap-3">

                {images.map((image) => (

                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
                  >

                    <Image
                      src={image.url}
                      alt={
                        image.alt ||
                        product.name
                      }
                      fill
                      className="object-contain p-2"
                      sizes="120px"
                    />

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* ================= INFO ================= */}

          <div className="flex flex-col justify-center">

            {/* CATEGORY */}

            <div className="mb-5 flex items-center gap-3">

              <span className="text-[9px] uppercase tracking-[0.25em] text-[#c8a65a]">

                {product.category?.name ||
                  "Premium Collection"}

              </span>

              <span className="h-1 w-1 rounded-full bg-white/20" />

              <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">

                {product.sku}

              </span>

            </div>

            {/* TITLE */}

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] md:text-5xl lg:text-6xl">

              {product.name}

            </h1>

            {/* PRICE */}

            <div className="mt-7 flex flex-wrap items-end gap-4">

              <span className="text-3xl font-semibold tracking-tight">

                {formatPrice(finalPrice)}

              </span>

              {hasSale && (

                <>

                  <span className="pb-1 text-sm text-white/25 line-through">

                    {formatPrice(price)}

                  </span>

                  <span className="pb-1 text-xs font-medium text-emerald-400/80">

                    Save {discount}%

                  </span>

                </>

              )}

            </div>

            <div className="my-8 h-px bg-white/[0.07]" />

            {/* DESCRIPTION */}

            <p className="max-w-xl text-sm leading-7 text-white/40">

              {product.description ||
                "A thoughtfully curated premium product designed to make every occasion memorable."}

            </p>

            {/* STOCK */}

            <div className="mt-7 flex items-center gap-2">

              <span
                className={`h-2 w-2 rounded-full ${
                  product.stock > 0
                    ? "bg-emerald-400"
                    : "bg-red-400"
                }`}
              />

              <span
                className={`text-xs ${
                  product.stock > 0
                    ? "text-emerald-400/80"
                    : "text-red-400/80"
                }`}
              >

                {product.stock > 0
                  ? `${product.stock} available`
                  : "Currently unavailable"}

              </span>

            </div>

            {/* CART / BUY NOW */}

            <ProductActions
              product={productForActions}
            />

            {/* FEATURES */}

            <div className="mt-9 grid gap-3 border-t border-white/[0.07] pt-7 sm:grid-cols-2">

              <Feature
                icon={<Truck size={16} />}
                title="Premium Delivery"
                text="Carefully packed & delivered"
              />

              <Feature
                icon={<Check size={16} />}
                title="Quality Assured"
                text="Premium curated products"
              />

            </div>

            {/* BULK */}

            <div className="mt-8 rounded-2xl border border-[#c8a65a]/10 bg-[#c8a65a]/[0.025] p-5">

              <p className="text-[9px] uppercase tracking-[0.2em] text-[#c8a65a]/70">

                Need it in bulk?

              </p>

              <p className="mt-2 text-xs leading-5 text-white/35">

                For corporate gifting and bulk
                requirements, contact our team
                for customised orders.

              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

/* ================= FEATURE ================= */

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (

    <div className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4b76b]/10 text-[#d4b76b]">

        {icon}

      </div>

      <div>

        <p className="text-xs font-medium text-white/70">
          {title}
        </p>

        <p className="mt-1 text-[9px] text-white/25">
          {text}
        </p>

      </div>

    </div>

  );
}

/* ================= PRICE ================= */

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}