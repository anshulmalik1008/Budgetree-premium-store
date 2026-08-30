"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

type CartItem = {
  productId: number;
  quantity: number;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number | string;
  salePrice?: number | string | null;
  stock: number;
  images?: {
    id: number;
    url: string;
    alt?: string | null;
  }[];
};

type CheckoutItem = CartItem & {
  product: Product;
};

const CART_KEY = "bps_cart";

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
  });

  useEffect(() => {
    loadCheckout();
  }, []);

  async function loadCheckout() {
    try {
      setLoading(true);

      const saved = JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      ) as CartItem[];

      if (!saved.length) {
        router.replace("/cart");
        return;
      }

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load products"
        );
      }

      const allProducts: Product[] = data.products ?? [];

      const matched = saved
        .map((item) => {
          const product = allProducts.find(
            (p) => p.id === Number(item.productId)
          );

          if (!product) return null;

          return {
            ...item,
            product,
          };
        })
        .filter(Boolean) as CheckoutItem[];

      if (!matched.length) {
        router.replace("/cart");
        return;
      }

      setItems(matched);
    } catch (error) {
      console.error("CHECKOUT LOAD ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load checkout"
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(
        item.product.salePrice ?? item.product.price
      );

      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          shippingAddress: form.shippingAddress,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          paymentMethod: form.paymentMethod,
          shippingFee: shipping,
          discount: 0,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to place order"
        );
      }

      localStorage.removeItem(CART_KEY);

      const orderId = data.order?.id;

      if (orderId) {
        router.push(`/order-success/${orderId}`);
      } else {
        router.push("/shop");
      }
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to place order"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2]">
        <Loader2
          size={30}
          className="animate-spin text-black/40"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#111]">
      {/* NAVBAR */}

      <header className="border-b border-black/10 bg-[#f7f6f2]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/shop">
            <div className="text-2xl font-semibold tracking-[-0.05em]">
              BPS
            </div>

            <div className="text-[9px] uppercase tracking-[0.35em] text-black/40">
              Budgetree Premium Store
            </div>
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-xs font-medium transition hover:bg-black hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Cart
          </Link>
        </div>
      </header>

      {/* HEADER */}

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 lg:px-8 lg:pt-20">
        <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">
          Secure Checkout
        </p>

        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
          Complete your order.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
          Enter your delivery details and choose your
          preferred payment method.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_390px]"
        >
          {/* LEFT */}

          <div className="space-y-6">
            {/* CONTACT */}

            <div className="rounded-[2rem] border border-black/10 bg-white p-7 sm:p-9">
              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.25em] text-black/35">
                  01
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Contact Details
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full Name">
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) =>
                      updateField(
                        "customerName",
                        e.target.value
                      )
                    }
                    placeholder="Your full name"
                    className="checkout-input"
                  />
                </Field>

                <Field label="Phone Number">
                  <input
                    required
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) =>
                      updateField(
                        "customerPhone",
                        e.target.value
                      )
                    }
                    placeholder="10 digit mobile number"
                    className="checkout-input"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Email Address">
                    <input
                      required
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) =>
                        updateField(
                          "customerEmail",
                          e.target.value
                        )
                      }
                      placeholder="you@example.com"
                      className="checkout-input"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* ADDRESS */}

            <div className="rounded-[2rem] border border-black/10 bg-white p-7 sm:p-9">
              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.25em] text-black/35">
                  02
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Delivery Address
                </h2>
              </div>

              <div className="space-y-5">
                <Field label="Address">
                  <textarea
                    required
                    rows={4}
                    value={form.shippingAddress}
                    onChange={(e) =>
                      updateField(
                        "shippingAddress",
                        e.target.value
                      )
                    }
                    placeholder="House no., street, area"
                    className="checkout-input resize-none py-3"
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="City">
                    <input
                      required
                      value={form.city}
                      onChange={(e) =>
                        updateField(
                          "city",
                          e.target.value
                        )
                      }
                      placeholder="Ghaziabad"
                      className="checkout-input"
                    />
                  </Field>

                  <Field label="State">
                    <input
                      required
                      value={form.state}
                      onChange={(e) =>
                        updateField(
                          "state",
                          e.target.value
                        )
                      }
                      placeholder="Uttar Pradesh"
                      className="checkout-input"
                    />
                  </Field>

                  <Field label="Pincode">
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) =>
                        updateField(
                          "pincode",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      placeholder="201001"
                      className="checkout-input"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* PAYMENT */}

            <div className="rounded-[2rem] border border-black/10 bg-white p-7 sm:p-9">
              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.25em] text-black/35">
                  03
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Payment Method
                </h2>
              </div>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-5 transition ${
                  form.paymentMethod === "COD"
                    ? "border-black bg-black text-white"
                    : "border-black/10 hover:border-black/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      form.paymentMethod === "COD"
                        ? "bg-white text-black"
                        : "bg-black text-white"
                    }`}
                  >
                    <Truck size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Cash on Delivery
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        form.paymentMethod === "COD"
                          ? "text-white/55"
                          : "text-black/40"
                      }`}
                    >
                      Pay when your order arrives
                    </p>
                  </div>
                </div>

                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={
                    form.paymentMethod === "COD"
                  }
                  onChange={(e) =>
                    updateField(
                      "paymentMethod",
                      e.target.value
                    )
                  }
                  className="h-4 w-4"
                />
              </label>

              <div className="mt-4 rounded-2xl border border-dashed border-black/10 p-5">
                <p className="text-xs text-black/45">
                  Online payment integration will be added
                  next. For now, orders are placed using
                  Cash on Delivery.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT */}

          <aside className="h-fit rounded-[2rem] border border-black/10 bg-white p-7 lg:sticky lg:top-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/35">
              Order Summary
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Your Order
            </h2>

            <div className="mt-7 space-y-5">
              {items.map((item) => {
                const product = item.product;

                const price = Number(
                  product.salePrice ?? product.price
                );

                const image =
                  product.images?.[0]?.url ||
                  "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=500&q=85";

                return (
                  <div
                    key={product.id}
                    className="flex gap-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eee]">
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />

                      <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        {product.sku}
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        ₹
                        {(
                          price * item.quantity
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 space-y-4 border-y border-black/10 py-6 text-sm">
              <div className="flex justify-between">
                <span className="text-black/45">
                  Subtotal
                </span>

                <span>
                  ₹
                  {subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-black/45">
                  Shipping
                </span>

                <span>
                  {shipping === 0
                    ? "Free"
                    : `₹${shipping}`}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between py-6">
              <span className="text-sm text-black/45">
                Total
              </span>

              <span className="text-2xl font-semibold">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-black text-sm font-medium text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Placing Order...
                </>
              ) : (
                <>
                  Place Order
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>

            <div className="mt-6 space-y-4 border-t border-black/10 pt-6">
              <MiniFeature
                icon={<ShieldCheck size={16} />}
                title="Secure checkout"
              />

              <MiniFeature
                icon={<Truck size={16} />}
                title={
                  shipping === 0
                    ? "Free shipping unlocked"
                    : "Free shipping over ₹999"
                }
              />

              <div className="flex items-center gap-3 text-xs text-black/45">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                  <Check size={15} />
                </div>

                Premium packaging & delivery
              </div>
            </div>
          </aside>
        </form>
      </section>

      <footer className="border-t border-black/10">
        <div className="mx-auto max-w-7xl px-5 py-8 text-xs text-black/40 lg:px-8">
          © {new Date().getFullYear()} Budgetree Premium
          Store
        </div>
      </footer>

      <style jsx global>{`
        .checkout-input {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid rgb(0 0 0 / 0.1);
          background: white;
          padding: 0 15px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .checkout-input:focus {
          border-color: rgb(0 0 0 / 0.4);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      {children}
    </label>
  );
}

function MiniFeature({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-black/50">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
        {icon}
      </div>

      {title}
    </div>
  );
}
