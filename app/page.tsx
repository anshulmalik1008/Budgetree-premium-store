"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Gift,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  User,
  ShieldCheck,
} from "lucide-react";

type Product = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  salePrice?: string | number | null;
  stock: number;
  status: string;
  featured: boolean;

  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;

  images?: {
    id: number;
    url: string;
    alt?: string | null;
    sortOrder?: number;
  }[];
};

type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products", {
            cache: "no-store",
          }),
          fetch("/api/categories", {
            cache: "no-store",
          }),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products ?? []);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories ?? []);
        }
      } catch (error) {
        console.error("HOME DATA ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.status === "ACTIVE" &&
        product.stock > 0
    );
  }, [products]);

  const featuredProducts = useMemo(() => {
    const featured = activeProducts.filter(
      (product) => product.featured
    );

    return featured.length > 0
      ? featured
      : activeProducts;
  }, [activeProducts]);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;

    const timer = setInterval(() => {
      setHeroIndex((current) =>
        (current + 1) % featuredProducts.length
      );
    }, 4500);

    return () => clearInterval(timer);
  }, [featuredProducts]);

  const heroProduct =
    featuredProducts[heroIndex] ||
    featuredProducts[0];

  const bestSellers = activeProducts.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#252525]">

      {/* TOP BAR */}

      <div className="bg-[#f7eee4] px-4 py-2 text-center text-[10px] font-medium tracking-[0.12em] text-[#6c5543]">
        FREE SHIPPING ON ORDERS ABOVE ₹999
      </div>

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-[#eee5dc] bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-5 md:px-8">

          {/* LOGO */}

          <Link href="/" className="flex flex-col">
            <span className="text-[25px] font-semibold tracking-[-0.06em] text-[#252525]">
              BPS
            </span>

            <span className="text-[7px] uppercase tracking-[0.3em] text-[#a18b78]">
              Budgetree Premium Store
            </span>
          </Link>

          {/* NAV */}

          <nav className="hidden items-center gap-8 text-[12px] lg:flex">

            <Link
              href="/"
              className="font-medium text-[#8c5b3f]"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="text-[#555] transition hover:text-[#8c5b3f]"
            >
              Shop
            </Link>

            <Link
              href="/shop?sort=featured"
              className="text-[#555] transition hover:text-[#8c5b3f]"
            >
              Collections
            </Link>

            <Link
              href="/shop?category=corporate"
              className="text-[#555] transition hover:text-[#8c5b3f]"
            >
              Corporate
            </Link>

            <Link
              href="/track-order"
              className="text-[#555] transition hover:text-[#8c5b3f]"
            >
              Track Order
            </Link>

          </nav>

          {/* ACTIONS */}

          <div className="flex items-center gap-2">

            <Link
              href="/shop"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#eee5dc] text-[#555] transition hover:bg-[#f8f2ec] sm:flex"
            >
              <Search size={17} strokeWidth={1.7} />
            </Link>

            <Link
              href="/account"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eee5dc] text-[#555] transition hover:bg-[#f8f2ec]"
            >
              <User size={17} strokeWidth={1.7} />
            </Link>

            <Link
              href="/wishlist"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#eee5dc] text-[#555] transition hover:bg-[#f8f2ec] sm:flex"
            >
              <Heart size={17} strokeWidth={1.7} />
            </Link>

            <Link
              href="/cart"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8c5b3f] text-white transition hover:bg-[#71462f]"
            >
              <ShoppingBag
                size={17}
                strokeWidth={1.8}
              />
            </Link>

          </div>

        </div>
      </header>

      {/* HERO */}

      <section className="relative overflow-hidden bg-[#f8f1e9]">

        <div className="mx-auto grid min-h-[610px] max-w-[1400px] items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-2 lg:px-12">

          {/* HERO CONTENT */}

          <div className="order-2 lg:order-1">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dbc9b7] bg-white/60 px-4 py-2">

              <Sparkles
                size={13}
                className="text-[#9a684b]"
              />

              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#79563f]">
                The Art of Gifting
              </span>

            </div>

            <h1 className="max-w-[650px] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#27211d] md:text-7xl">

              Gifts that

              <br />

              <span className="text-[#9a684b]">
                feel personal.
              </span>

            </h1>

            <p className="mt-7 max-w-xl text-sm leading-7 text-[#766b63] md:text-base">
              Discover thoughtfully curated premium gifts
              for birthdays, anniversaries, celebrations,
              relationships and meaningful moments.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">

              <Link
                href="/shop"
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-[#8c5b3f] px-7 text-xs font-semibold text-white transition hover:bg-[#71462f]"
              >
                Explore Collection

                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/shop?category=corporate"
                className="inline-flex h-12 items-center gap-3 rounded-full border border-[#d6c5b5] bg-white px-7 text-xs font-medium text-[#604b3c] transition hover:bg-[#f4ebe2]"
              >
                Corporate Gifting
              </Link>

            </div>

            <div className="mt-12 grid max-w-lg grid-cols-3 border-t border-[#dfd3c8] pt-6">

              <HeroStat
                value={`${activeProducts.length}+`}
                label="Products"
              />

              <HeroStat
                value={`${categories.length}+`}
                label="Categories"
              />

              <HeroStat
                value="100%"
                label="Curated"
              />

            </div>

          </div>

          {/* HERO PRODUCT SLIDER */}

          <div className="order-1 lg:order-2">

            <div className="relative mx-auto max-w-[570px]">

              <div className="absolute -right-10 top-10 h-64 w-64 rounded-full bg-[#d9bda5]/30 blur-3xl" />

              <div className="relative overflow-hidden rounded-[34px] bg-white shadow-[0_25px_70px_rgba(90,60,40,0.12)]">

                <div className="relative flex aspect-[0.95] items-center justify-center overflow-hidden bg-[#fdfaf6]">

                  {heroProduct?.images?.[0]?.url ? (

                    <img
                      key={heroProduct.id}
                      src={heroProduct.images[0].url}
                      alt={heroProduct.name}
                      className="h-full w-full object-contain p-12 transition-all duration-700"
                    />

                  ) : (

                    <Gift
                      size={130}
                      strokeWidth={0.7}
                      className="text-[#d5c0ae]"
                    />

                  )}

                  {/* LABEL */}

                  <div className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#8c5b3f] shadow-sm">
                    Featured
                  </div>

                </div>

                {/* PRODUCT INFO */}

                <div className="border-t border-[#eee6df] p-6">

                  <p className="text-[9px] uppercase tracking-[0.18em] text-[#a48b76]">
                    {heroProduct?.category?.name ||
                      "Premium Collection"}
                  </p>

                  <h2 className="mt-2 text-lg font-medium text-[#29231f]">
                    {heroProduct?.name ||
                      "Premium Gift Collection"}
                  </h2>

                  {heroProduct && (
                    <div className="mt-3 flex items-center justify-between">

                      <div>
                        <span className="text-base font-semibold text-[#8c5b3f]">
                          {formatPrice(
                            Number(
                              heroProduct.salePrice ??
                                heroProduct.price
                            )
                          )}
                        </span>
                      </div>

                      <Link
                        href={`/product/${heroProduct.id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8c5b3f] text-white transition hover:bg-[#71462f]"
                      >
                        <ArrowRight size={15} />
                      </Link>

                    </div>
                  )}

                </div>

              </div>

              {/* SLIDER DOTS */}

              {featuredProducts.length > 1 && (

                <div className="mt-5 flex justify-center gap-2">

                  {featuredProducts
                    .slice(0, 6)
                    .map((product, index) => (

                      <button
                        key={product.id}
                        onClick={() =>
                          setHeroIndex(index)
                        }
                        className={`h-1.5 rounded-full transition-all ${
                          heroIndex === index
                            ? "w-7 bg-[#8c5b3f]"
                            : "w-1.5 bg-[#d7c8ba]"
                        }`}
                        aria-label={`Show ${product.name}`}
                      />

                    ))}

                </div>

              )}

            </div>

          </div>

        </div>
      </section>

      {/* CATEGORY */}

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 lg:px-12">

        <SectionHeading
          eyebrow="Explore"
          title="Shop by Category"
          description="Find thoughtful gifts for every occasion."
          link="/shop"
        />

        {loading ? (

          <LoadingGrid />

        ) : categories.length > 0 ? (

          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

            {categories.slice(0, 6).map(
              (category, index) => (

                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[#eee5dc] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >

                  <div className="relative aspect-[1/1.05] overflow-hidden bg-[#f8f3ed]">

                    {category.image ? (

                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center">
                        <Gift
                          size={46}
                          strokeWidth={1}
                          className="text-[#cdb8a5]"
                        />
                      </div>

                    )}

                  </div>

                  <div className="p-4">

                    <p className="text-[8px] text-[#b19b87]">
                      0{index + 1}
                    </p>

                    <h3 className="mt-1 truncate text-sm font-medium text-[#332b26]">
                      {category.name}
                    </h3>

                    <div className="mt-3 flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.16em] text-[#8c5b3f]">
                      Explore
                      <ArrowRight size={10} />
                    </div>

                  </div>

                </Link>

              )
            )}

          </div>

        ) : (

          <EmptyState text="Categories added from Admin will appear here." />

        )}

      </section>

      {/* FEATURED */}

      <section className="border-y border-[#eee5dc] bg-white">

        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 lg:px-12">

          <SectionHeading
            eyebrow="Curated For You"
            title="Featured Gifts"
            description="Beautiful gifts selected for your special moments."
            link="/shop"
          />

          {loading ? (

            <LoadingGrid />

          ) : activeProducts.length > 0 ? (

            <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">

              {activeProducts
                .slice(0, 8)
                .map((product) => (

                  <ProductCard
                    key={product.id}
                    product={product}
                  />

                ))}

            </div>

          ) : (

            <EmptyState text="Products added from Admin will appear here." />

          )}

        </div>

      </section>

      {/* PROMO BANNER */}

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 lg:px-12">

        <div className="relative overflow-hidden rounded-[30px] bg-[#eee1d4] px-7 py-12 md:px-12 lg:px-16">

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/40 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>

              <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#8c5b3f]">
                Premium Experiences
              </p>

              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#332923] md:text-5xl">

                Make every occasion

                <br />

                <span className="text-[#8c5b3f]">
                  unforgettable.
                </span>

              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#76675d]">
                From personal celebrations to corporate
                gifting, discover premium products selected
                to make your gesture truly special.
              </p>

            </div>

            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[#8c5b3f] px-7 text-xs font-semibold text-white transition hover:bg-[#71462f]"
            >
              Shop Now
              <ArrowRight size={15} />
            </Link>

          </div>

        </div>

      </section>

      {/* BEST SELLERS */}

      <section className="mx-auto max-w-[1400px] px-5 pb-16 md:px-8 lg:px-12">

        <SectionHeading
          eyebrow="Popular Picks"
          title="Best Sellers"
          description="Customer favourites worth gifting."
          link="/shop"
        />

        {bestSellers.length > 0 && (

          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-4">

            {bestSellers.map((product) => (

              <ProductCard
                key={`best-${product.id}`}
                product={product}
              />

            ))}

          </div>

        )}

      </section>

      {/* WHY BPS */}

      <section className="border-y border-[#eee5dc] bg-[#faf6f1]">

        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 lg:px-12">

          <div className="text-center">

            <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#8c5b3f]">
              The BPS Standard
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#332923]">
              Gifting, made special.
            </h2>

          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">

            <ServiceCard
              icon={<Gift size={19} />}
              title="Thoughtfully Curated"
              text="Every product is selected with quality and gifting in mind."
            />

            <ServiceCard
              icon={<Truck size={19} />}
              title="Reliable Delivery"
              text="Carefully packed products delivered safely to your doorstep."
            />

            <ServiceCard
              icon={<ShieldCheck size={19} />}
              title="Premium Quality"
              text="Products and presentation designed to make every gift memorable."
            />

          </div>

        </div>

      </section>

      {/* CORPORATE */}

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 lg:px-12">

        <div className="rounded-[28px] border border-[#e9ded4] bg-white p-8 shadow-sm md:p-12">

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>

              <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#8c5b3f]">
                Corporate Gifting
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#332923]">
                Gifts for teams,
                <br />
                clients & milestones.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#76675d]">
                Looking for bulk gifting solutions? Build
                memorable corporate experiences with premium
                curated gifts.
              </p>

            </div>

            <Link
              href="/shop?category=corporate"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[#cdb7a5] px-6 text-xs font-medium text-[#8c5b3f] transition hover:bg-[#f8f0e9]"
            >
              Explore Corporate
              <ArrowRight size={14} />
            </Link>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-[#eee5dc] bg-white">

        <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-8 lg:px-12">

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

            {/* BRAND */}

            <div className="lg:col-span-2">

              <div className="text-2xl font-semibold tracking-[-0.05em]">
                BPS
              </div>

              <p className="mt-1 text-[7px] uppercase tracking-[0.35em] text-[#ad9b8c]">
                Budgetree Premium Store
              </p>

              <p className="mt-5 max-w-md text-xs leading-6 text-[#81766e]">
                Premium gifts thoughtfully curated for
                celebrations, relationships and memorable
                moments.
              </p>

            </div>

            {/* EXPLORE */}

            <FooterColumn
              title="Explore"
              links={[
                ["Shop", "/shop"],
                [
                  "Collections",
                  "/shop?sort=featured",
                ],
                ["Wishlist", "/wishlist"],
                ["Track Order", "/track-order"],
              ]}
            />

            {/* ACCOUNT */}

            <FooterColumn
              title="Account"
              links={[
                ["My Account", "/account"],
                ["Cart", "/cart"],
                ["Orders", "/account/orders"],
                ["Contact", "/contact"],
              ]}
            />

            {/* ADMIN */}

            <div>

              <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#a18f80]">
                Business
              </p>

              <div className="mt-5">

                <Link
                  href="/admin"
                  className="group inline-flex items-center gap-2 text-xs text-[#81766e] transition hover:text-[#8c5b3f]"
                >

                  <ShieldCheck
                    size={14}
                    className="text-[#8c5b3f]"
                  />

                  Admin Portal

                  <ChevronRight
                    size={12}
                    className="transition group-hover:translate-x-1"
                  />

                </Link>

              </div>

            </div>

          </div>

          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[#eee5dc] pt-6 text-[9px] text-[#aa9d94] md:flex-row">

            <span>
              © {new Date().getFullYear()} Budgetree Premium Store. All rights reserved.
            </span>

            <span>
              Premium gifting made simple.
            </span>

          </div>

        </div>

      </footer>

    </main>
  );
}

/* PRODUCT CARD */

function ProductCard({
  product,
}: {
  product: Product;
}) {
  const price = Number(product.price);

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  const finalPrice =
    salePrice !== null &&
    salePrice < price
      ? salePrice
      : price;

  const image =
    product.images?.[0]?.url ?? null;

  const discount =
    salePrice !== null &&
    salePrice < price
      ? Math.round(
          ((price - salePrice) / price) * 100
        )
      : 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block"
    >

      <div className="relative overflow-hidden rounded-[20px] bg-[#f8f4ef]">

        <div className="relative aspect-[0.92]">

          {image ? (

            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-[1.04]"
            />

          ) : (

            <div className="flex h-full items-center justify-center">
              <Gift
                size={55}
                strokeWidth={0.8}
                className="text-[#cdb8a5]"
              />
            </div>

          )}

          {discount > 0 && (

            <span className="absolute left-3 top-3 rounded-full bg-[#8c5b3f] px-2.5 py-1 text-[7px] font-semibold text-white">
              -{discount}%
            </span>

          )}

          {product.featured && (

            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[7px] font-medium uppercase tracking-[0.1em] text-[#8c5b3f]">
              Featured
            </span>

          )}

        </div>

      </div>

      <div className="px-1 pt-4">

        <p className="truncate text-[8px] uppercase tracking-[0.16em] text-[#a48d79]">
          {product.category?.name ||
            "Premium Collection"}
        </p>

        <h3 className="mt-1.5 truncate text-sm font-medium text-[#302822]">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">

          <span className="text-sm font-semibold text-[#8c5b3f]">
            {formatPrice(finalPrice)}
          </span>

          {salePrice !== null &&
            salePrice < price && (

              <span className="text-[11px] text-[#aaa09a] line-through">
                {formatPrice(price)}
              </span>

            )}

        </div>

      </div>

    </Link>
  );
}

/* SECTION HEADING */

function SectionHeading({
  eyebrow,
  title,
  description,
  link,
}: {
  eyebrow: string;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

      <div>

        <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#8c5b3f]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#302822] md:text-4xl">
          {title}
        </h2>

        <p className="mt-2 max-w-xl text-sm text-[#81766e]">
          {description}
        </p>

      </div>

      <Link
        href={link}
        className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-[#8c5b3f] transition hover:text-[#60402d]"
      >
        View All
        <ChevronRight size={13} />
      </Link>

    </div>
  );
}

/* SERVICE */

function ServiceCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#e9ded4] bg-white p-7">

      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4e9df] text-[#8c5b3f]">
        {icon}
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#342b25]">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-6 text-[#81766e]">
        {text}
      </p>

    </div>
  );
}

/* HERO STAT */

function HeroStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>

      <p className="text-lg font-semibold text-[#8c5b3f]">
        {value}
      </p>

      <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-[#a18f80]">
        {label}
      </p>

    </div>
  );
}

/* FOOTER COLUMN */

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>

      <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#a18f80]">
        {title}
      </p>

      <div className="mt-5 space-y-3">

        {links.map(([label, href]) => (

          <Link
            key={label}
            href={href}
            className="block text-xs text-[#81766e] transition hover:text-[#8c5b3f]"
          >
            {label}
          </Link>

        ))}

      </div>

    </div>
  );
}

/* EMPTY */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-9 rounded-2xl border border-dashed border-[#ddd0c4] bg-[#faf7f3] px-6 py-14 text-center">

      <Gift
        size={38}
        strokeWidth={1}
        className="mx-auto text-[#cbb6a3]"
      />

      <p className="mt-4 text-xs text-[#8c8077]">
        {text}
      </p>

    </div>
  );
}

/* LOADING */

function LoadingGrid() {
  return (
    <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-4">

      {[1, 2, 3, 4].map((item) => (

        <div
          key={item}
          className="animate-pulse overflow-hidden rounded-2xl bg-[#f4eee8]"
        >
          <div className="aspect-square" />
          <div className="p-4">
            <div className="h-3 w-20 rounded bg-[#e6dcd2]" />
            <div className="mt-3 h-4 w-32 rounded bg-[#e6dcd2]" />
          </div>
        </div>

      ))}

    </div>
  );
}

/* PRICE */

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}
