"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ShieldCheck,
  Truck,
  MapPin,
  PackageCheck,
  Search,
  User,
  Phone,
  Mail,
  Home,
  CreditCard,
  AlertCircle,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type ProductImage = {
  id?: number;
  url?: string | null;
  alt?: string | null;
  sortOrder?: number;
};

type Product = {
  id?: number | string;
  productId?: number | string;
  product_id?: number | string;

  name?: string;
  product_name?: string;

  sku?: string;
  sku_code?: string;

  price?: number | string | null;
  salePrice?: number | string | null;
  product_price?: number | string | null;
  product_mrp?: number | string | null;
  basic_price?: number | string | null;

  stock?: number;
  quantity?: number;

  images?: ProductImage[] | Record<string, unknown>;

  image?: string | null;
  image_url?: string | null;
  primary_image?: string | null;
};

type CartItem = Product & {
  quantity: number;
};

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: string;
};

/* =========================================================
   CART KEYS
========================================================= */

const CART_KEYS = ["bps_cart", "cart"];

/* =========================================================
   HELPERS
========================================================= */

function normalizeCartItem(item: unknown): CartItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const raw = item as Record<string, unknown>;

  const id =
    raw.id ??
    raw.productId ??
    raw.product_id;

  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {
    return null;
  }

  const quantity = Number(raw.quantity ?? 1);

  return {
    ...(raw as Product),
    id: id as string | number,
    productId: id as string | number,
    quantity:
      Number.isFinite(quantity) && quantity > 0
        ? Math.floor(quantity)
        : 1,
  };
}

function getStoredCart(): CartItem[] {
  try {
    for (const key of CART_KEYS) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) continue;

      const normalized = parsed
        .map(normalizeCartItem)
        .filter(Boolean) as CartItem[];

      if (normalized.length) {
        return normalized;
      }
    }
  } catch (error) {
    console.error("CART READ ERROR:", error);
  }

  return [];
}

function getProductId(product: Product): string {
  return String(
    product.id ??
      product.productId ??
      product.product_id ??
      ""
  );
}

function getProductName(product: Product): string {
  return (
    product.name ??
    product.product_name ??
    "Premium Product"
  );
}

function getProductSku(product: Product): string {
  return (
    product.sku ??
    product.sku_code ??
    "Product"
  );
}

function getProductPrice(product: Product): number {
  const value =
    product.salePrice ??
    product.product_price ??
    product.basic_price ??
    product.price ??
    0;

  const price = Number(value);

  return Number.isFinite(price) && price >= 0
    ? price
    : 0;
}

function getProductImage(product: Product): string {
  const images = product.images;

  if (Array.isArray(images)) {
    const sorted = [...images].sort(
      (a, b) =>
        Number(a.sortOrder ?? 0) -
        Number(b.sortOrder ?? 0)
    );

    const first = sorted.find(
      (image) =>
        typeof image?.url === "string" &&
        image.url.trim()
    );

    if (first?.url) {
      return first.url;
    }
  }

  if (
    images &&
    !Array.isArray(images) &&
    typeof images === "object"
  ) {
    const objectImages =
      images as Record<string, unknown>;

    for (const key of [
      "image1",
      "image2",
      "image3",
      "image4",
      "image5",
      "url",
    ]) {
      const value = objectImages[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value;
      }
    }
  }

  return (
    product.image ??
    product.image_url ??
    product.primary_image ??
    ""
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* =========================================================
   PINCODE API TYPES
========================================================= */

type PincodePostOffice = {
  Name?: string;
  District?: string;
  State?: string;
  Division?: string;
  Region?: string;
  Block?: string;
};

type PincodeResponse = {
  Status?: string;
  Message?: string;
  PostOffice?: PincodePostOffice[] | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [pincodeLoading, setPincodeLoading] =
    useState(false);
  const [pincodeMessage, setPincodeMessage] =
    useState("");
  const [pincodeError, setPincodeError] =
    useState("");

  const [lastFetchedPincode, setLastFetchedPincode] =
    useState("");

  const [form, setForm] = useState<FormState>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
  });

  /* =======================================================
     LOAD CART
  ======================================================= */

  useEffect(() => {
    const cart = getStoredCart();

    if (!cart.length) {
      router.replace("/cart");
      return;
    }

    setItems(cart);
    setLoading(false);
  }, [router]);

  /* =======================================================
     LOAD PINCODE
  ======================================================= */

  useEffect(() => {
    const pincode = form.pincode.trim();

    if (!/^\d{6}$/.test(pincode)) {
      setPincodeMessage("");
      setPincodeError("");
      setLastFetchedPincode("");
      return;
    }

    if (pincode === lastFetchedPincode) {
      return;
    }

    let cancelled = false;

    async function fetchPincode() {
      try {
        setPincodeLoading(true);
        setPincodeError("");
        setPincodeMessage("");

        const response = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to fetch pincode details."
          );
        }

        const data: PincodeResponse[] =
          await response.json();

        if (cancelled) return;

        const result = data?.[0];

        if (
          !result ||
          result.Status !== "Success" ||
          !result.PostOffice?.length
        ) {
          setPincodeError(
            "Invalid pincode or pincode details not found."
          );
          setPincodeMessage("");
          return;
        }

        const office = result.PostOffice[0];

        const city =
          office.District ||
          office.Division ||
          office.Block ||
          "";

        const state = office.State || "";

        setForm((previous) => ({
          ...previous,
          city,
          state,
        }));

        setLastFetchedPincode(pincode);

        setPincodeMessage(
          office.Name
            ? `Delivery available • ${office.Name}`
            : "Pincode verified successfully."
        );
      } catch (error) {
        if (cancelled) return;

        console.error(
          "PINCODE FETCH ERROR:",
          error
        );

        setPincodeError(
          "Could not fetch pincode details. Please enter City and State manually."
        );
      } finally {
        if (!cancelled) {
          setPincodeLoading(false);
        }
      }
    }

    fetchPincode();

    return () => {
      cancelled = true;
    };
  }, [form.pincode, lastFetchedPincode]);

  /* =======================================================
     UPDATE FORM
  ======================================================= */

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =======================================================
     TOTALS
  ======================================================= */

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return (
        total +
        getProductPrice(item) *
          item.quantity
      );
    }, 0);
  }, [items]);

  const shipping = subtotal >= 999 ? 0 : 99;

  const discount = 0;

  const total =
    subtotal +
    shipping -
    discount;

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const name = form.customerName.trim();
    const email = form.customerEmail
      .trim()
      .toLowerCase();
    const phone = form.customerPhone.trim();
    const address = form.shippingAddress.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const pincode = form.pincode.trim();

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Please enter a valid 10 digit mobile number."
      );
      return;
    }

    if (!address) {
      setError(
        "Please enter your complete delivery address."
      );
      return;
    }

    if (!city) {
      setError("Please enter your city.");
      return;
    }

    if (!state) {
      setError("Please enter your state.");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError(
        "Please enter a valid 6 digit pincode."
      );
      return;
    }

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    setSaving(true);

    try {
      /* -----------------------------------------------------
         PREPARE ORDER ITEMS
      ----------------------------------------------------- */

      const orderItems = items
        .map((item) => {
          const rawId = getProductId(item);
          const productId = Number(rawId);

          const quantity = Math.max(
            1,
            Math.floor(
              Number(item.quantity) || 1
            )
          );

          if (
            !Number.isInteger(productId) ||
            productId <= 0
          ) {
            console.error(
              "INVALID CART PRODUCT:",
              item
            );

            return null;
          }

          return {
            productId,
            quantity,
          };
        })
        .filter(
          (
            item
          ): item is {
            productId: number;
            quantity: number;
          } => item !== null
        );

      if (!orderItems.length) {
        throw new Error(
          "No valid products found in cart."
        );
      }

      /* -----------------------------------------------------
         ORDER PAYLOAD
      ----------------------------------------------------- */

      const payload = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,

        shippingAddress: address,
        city,
        state,
        pincode,

        paymentMethod:
          form.paymentMethod || "COD",

        shippingFee: shipping,
        discount,

        items: orderItems,
      };

      console.log(
        "ORDER PAYLOAD:",
        payload
      );

      /* -----------------------------------------------------
         CREATE ORDER
      ----------------------------------------------------- */

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log(
        "ORDER RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Order failed (${response.status})`
        );
      }

      if (data?.success === false) {
        throw new Error(
          data?.message ||
            "Failed to place order."
        );
      }

      /* -----------------------------------------------------
         CLEAR CART
      ----------------------------------------------------- */

      localStorage.removeItem(
        "bps_cart"
      );

      localStorage.removeItem(
        "cart"
      );

      window.dispatchEvent(
        new Event("cart-updated")
      );

      /* -----------------------------------------------------
         GET ORDER ID
      ----------------------------------------------------- */

      const orderId =
        data?.order?.id ??
        data?.orderId ??
        data?.id;

      const orderNumber =
        data?.order?.orderNumber ??
        data?.orderNumber;

      /* -----------------------------------------------------
         SUCCESS REDIRECT
      ----------------------------------------------------- */

      if (orderId) {
        router.push(
          `/order-success/${orderId}`
        );
        return;
      }

      if (orderNumber) {
        router.push(
          `/order-success/${orderNumber}`
        );
        return;
      }

      router.push("/shop");
    } catch (error) {
      console.error(
        "CHECKOUT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdf4]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0b6b3a] text-white shadow-lg">
            <Loader2
              size={25}
              className="animate-spin"
            />
          </div>

          <p className="text-sm font-semibold text-[#0b6b3a]">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#fffdf4] text-[#10251a]">

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div className="bg-[#ffd928]">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-5 py-2 text-[11px] font-bold text-[#123b25] sm:gap-10">

          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} />
            Secure Checkout
          </span>

          <span className="hidden items-center gap-1.5 sm:flex">
            <Truck size={15} />
            Fast Delivery
          </span>

          <span className="hidden items-center gap-1.5 md:flex">
            <PackageCheck size={15} />
            Genuine Products
          </span>

        </div>
      </div>

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">

          <Link
            href="/shop"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b6b3a] text-white shadow-sm">
              <PackageCheck size={23} />
            </div>

            <div>
              <div className="text-2xl font-black tracking-tight text-[#116b39]">
                budgetree
              </div>

              <div className="text-[8px] font-bold tracking-[2px] text-gray-400">
                PREMIUM STORE
              </div>
            </div>
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-[#123b25] transition hover:border-[#0b6b3a] hover:bg-[#f1f8e8]"
          >
            <ArrowLeft size={15} />
            Back to Cart
          </Link>

        </div>
      </header>

      {/* ===================================================
          TITLE
      =================================================== */}

      <section className="mx-auto max-w-7xl px-5 pb-8 pt-10 lg:px-8 lg:pt-14">

        <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf6df] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#0b6b3a]">
          <ShieldCheck size={14} />
          Secure Checkout
        </div>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-[#10251a] sm:text-5xl">
          Complete your order.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
          Enter your delivery details and choose
          your preferred payment method.
        </p>

      </section>

      {/* ===================================================
          MAIN
      =================================================== */}

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">

        <form
          onSubmit={handleSubmit}
          className="grid gap-7 lg:grid-cols-[1fr_390px]"
        >

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-6">

            {/* CONTACT */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeader
                number="01"
                icon={<User size={18} />}
                title="Contact Details"
                description="Where should we contact you?"
              />

              <div className="grid gap-5 sm:grid-cols-2">

                <Field label="Full Name *">
                  <div className="relative">
                    <User
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      required
                      value={
                        form.customerName
                      }
                      onChange={(e) =>
                        updateField(
                          "customerName",
                          e.target.value
                        )
                      }
                      placeholder="Your full name"
                      className="checkout-input pl-11"
                      autoComplete="name"
                    />
                  </div>
                </Field>

                <Field label="Phone Number *">
                  <div className="relative">
                    <Phone
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={
                        form.customerPhone
                      }
                      onChange={(e) =>
                        updateField(
                          "customerPhone",
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(0, 10)
                        )
                      }
                      placeholder="10 digit mobile number"
                      className="checkout-input pl-11"
                      autoComplete="tel"
                    />
                  </div>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Email Address *">
                    <div className="relative">
                      <Mail
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        required
                        type="email"
                        value={
                          form.customerEmail
                        }
                        onChange={(e) =>
                          updateField(
                            "customerEmail",
                            e.target.value
                          )
                        }
                        placeholder="you@example.com"
                        className="checkout-input pl-11"
                        autoComplete="email"
                      />
                    </div>
                  </Field>
                </div>

              </div>
            </div>

            {/* ADDRESS */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeader
                number="02"
                icon={<Home size={18} />}
                title="Delivery Address"
                description="Enter your address and pincode"
              />

              <div className="space-y-5">

                <Field label="Address *">
                  <div className="relative">
                    <textarea
                      required
                      rows={4}
                      value={
                        form.shippingAddress
                      }
                      onChange={(e) =>
                        updateField(
                          "shippingAddress",
                          e.target.value
                        )
                      }
                      placeholder="House no., street, area, landmark"
                      className="checkout-input resize-none py-3"
                      autoComplete="street-address"
                    />
                  </div>
                </Field>

                {/* PINCODE FIRST */}

                <div className="rounded-2xl border border-[#ffd928]/70 bg-[#fffbea] p-4">

                  <Field label="Pincode *">

                    <div className="relative">

                      <Search
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        required
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={
                          form.pincode
                        }
                        onChange={(e) => {
                          const value =
                            e.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                6
                              );

                          updateField(
                            "pincode",
                            value
                          );

                          if (
                            value.length !==
                            6
                          ) {
                            setPincodeMessage(
                              ""
                            );
                            setPincodeError(
                              ""
                            );
                            setLastFetchedPincode(
                              ""
                            );
                          }
                        }}
                        placeholder="Enter 6 digit pincode"
                        className="checkout-input pl-11 pr-12"
                        autoComplete="postal-code"
                      />

                      {pincodeLoading && (
                        <Loader2
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#0b6b3a]"
                        />
                      )}

                      {!pincodeLoading &&
                        form.pincode.length ===
                          6 &&
                        !pincodeError &&
                        lastFetchedPincode ===
                          form.pincode && (
                          <Check
                            size={19}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0b6b3a]"
                          />
                        )}
                    </div>

                  </Field>

                  {pincodeLoading && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#0b6b3a]">
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />
                      Fetching city and state...
                    </div>
                  )}

                  {pincodeMessage &&
                    !pincodeLoading && (
                      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#0b6b3a]">
                        <Check size={14} />
                        {pincodeMessage}
                      </div>
                    )}

                  {pincodeError && (
                    <div className="mt-2 flex items-start gap-2 text-xs font-semibold text-red-600">
                      <AlertCircle
                        size={14}
                        className="mt-0.5 shrink-0"
                      />
                      {pincodeError}
                    </div>
                  )}

                </div>

                {/* CITY STATE */}

                <div className="grid gap-5 sm:grid-cols-2">

                  <Field label="City *">
                    <div className="relative">

                      <MapPin
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        required
                        value={form.city}
                        onChange={(e) =>
                          updateField(
                            "city",
                            e.target.value
                          )
                        }
                        placeholder="City"
                        className="checkout-input pl-11"
                        autoComplete="address-level2"
                      />

                    </div>
                  </Field>

                  <Field label="State *">
                    <input
                      required
                      value={form.state}
                      onChange={(e) =>
                        updateField(
                          "state",
                          e.target.value
                        )
                      }
                      placeholder="State"
                      className="checkout-input"
                      autoComplete="address-level1"
                    />
                  </Field>

                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[#eaf6df] p-4 text-xs text-[#315d43]">
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-[#0b6b3a]"
                  />

                  <p>
                    Enter your 6 digit pincode and
                    we'll automatically find your
                    city and state.
                  </p>
                </div>

              </div>
            </div>

            {/* PAYMENT */}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeader
                number="03"
                icon={<CreditCard size={18} />}
                title="Payment Method"
                description="Select how you want to pay."
              />

              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 transition ${
                  form.paymentMethod ===
                  "COD"
                    ? "border-[#0b6b3a] bg-[#f1f8e8]"
                    : "border-gray-200 bg-white"
                }`}
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0b6b3a] text-white">
                    <Truck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#123b25]">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Pay when your order arrives
                    </p>
                  </div>

                </div>

                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={
                    form.paymentMethod ===
                    "COD"
                  }
                  onChange={(e) =>
                    updateField(
                      "paymentMethod",
                      e.target.value
                    )
                  }
                  className="h-5 w-5 accent-[#0b6b3a]"
                />

              </label>

              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fff9d9] p-4 text-xs text-[#6d5600]">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <p>
                  Your order is securely processed.
                  Currently Cash on Delivery is
                  available.
                </p>
              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

          </div>

          {/* =================================================
              RIGHT — ORDER SUMMARY
          ================================================= */}

          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0b6b3a]">
                  Order Summary
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Your Order
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffd928] text-[#123b25]">
                <PackageCheck size={20} />
              </div>

            </div>

            {/* PRODUCTS */}

            <div className="mt-7 space-y-4">

              {items.map(
                (item, index) => {
                  const name =
                    getProductName(item);

                  const image =
                    getProductImage(item);

                  const price =
                    getProductPrice(item);

                  return (
                    <div
                      key={`${getProductId(
                        item
                      )}-${index}`}
                      className="flex gap-3 rounded-2xl bg-[#fffdf4] p-3"
                    >

                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white">

                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-contain p-2"
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-300">
                            NO IMAGE
                          </div>
                        )}

                        <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b6b3a] px-1 text-[9px] font-black text-white">
                          {item.quantity}
                        </span>

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="line-clamp-2 text-sm font-bold text-[#10251a]">
                          {name}
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-gray-400">
                          {getProductSku(item)}
                        </p>

                        <p className="mt-2 text-sm font-black text-[#0b6b3a]">
                          {formatPrice(
                            price *
                              item.quantity
                          )}
                        </p>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

            {/* TOTALS */}

            <div className="mt-6 space-y-4 border-y border-gray-100 py-6 text-sm">

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-semibold">
                  {formatPrice(
                    subtotal
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Shipping
                </span>

                <span className="font-semibold text-[#0b6b3a]">
                  {shipping === 0
                    ? "FREE"
                    : formatPrice(
                        shipping
                      )}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Discount
                  </span>

                  <span className="font-semibold text-[#0b6b3a]">
                    -
                    {formatPrice(
                      discount
                    )}
                  </span>
                </div>
              )}

            </div>

            {/* FREE SHIPPING MESSAGE */}

            {shipping > 0 && (
              <div className="rounded-2xl bg-[#fff9d9] p-3 text-center text-[11px] font-bold text-[#7a6200]">
                Add{" "}
                {formatPrice(
                  999 - subtotal
                )}{" "}
                more for FREE shipping
              </div>
            )}

            {shipping === 0 && (
              <div className="rounded-2xl bg-[#eaf6df] p-3 text-center text-[11px] font-bold text-[#0b6b3a]">
                🎉 You unlocked FREE shipping
              </div>
            )}

            {/* TOTAL */}

            <div className="flex items-end justify-between py-6">

              <div>
                <p className="text-xs text-gray-400">
                  Total Amount
                </p>

                <p className="mt-1 text-3xl font-black text-[#10251a]">
                  {formatPrice(total)}
                </p>
              </div>

            </div>

            {/* PLACE ORDER */}

            <button
              type="submit"
              disabled={saving}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#0b6b3a] text-sm font-black text-white shadow-lg shadow-green-900/10 transition hover:bg-[#095c31] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Placing Order...
                </>
              ) : (
                <>
                  Place Order
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>

            {/* FEATURES */}

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">

              <MiniFeature
                icon={
                  <ShieldCheck size={16} />
                }
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

              <MiniFeature
                icon={
                  <MapPin size={16} />
                }
                title="Pan India delivery"
              />

              <MiniFeature
                icon={<Check size={16} />}
                title="Premium packaging"
              />

            </div>

          </aside>

        </form>
      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="border-t border-[#0b6b3a]/20 bg-[#0c3520] text-white">

        <div className="mx-auto max-w-7xl px-5 py-8 text-center">

          <div className="text-xl font-black">
            budgetree
          </div>

          <p className="mt-2 text-xs text-white/60">
            Premium products & gifting essentials
          </p>

          <div className="mt-5 text-[10px] text-white/40">
            © {new Date().getFullYear()}{" "}
            Budgetree Premium Store. All
            rights reserved.
          </div>

        </div>

      </footer>

      {/* ===================================================
          GLOBAL CSS
      =================================================== */}

      <style jsx global>{`
        .checkout-input {
          width: 100%;
          min-height: 50px;
          border-radius: 14px;
          border: 1px solid rgb(0 0 0 / 0.10);
          background: #ffffff;
          padding: 0 15px;
          font-size: 14px;
          color: #10251a;
          outline: none;
          transition:
            border-color 0.2s,
            box-shadow 0.2s,
            background 0.2s;
        }

        .checkout-input::placeholder {
          color: rgb(0 0 0 / 0.35);
        }

        .checkout-input:focus {
          border-color: #0b6b3a;
          background: #ffffff;
          box-shadow:
            0 0 0 3px rgb(11 107 58 / 0.08);
        }

        .checkout-input:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        textarea.checkout-input {
          padding-top: 13px;
          padding-bottom: 13px;
        }

        input[type="radio"] {
          accent-color: #0b6b3a;
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7 flex items-center gap-4">

      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf6df] font-black text-[#0b6b3a]">
        {icon}

        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffd928] text-[8px] font-black text-[#123b25]">
          {number}
        </span>
      </div>

      <div>
        <p className="text-xl font-black">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {description}
        </p>
      </div>

    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#10251a]">
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   MINI FEATURE
========================================================= */

function MiniFeature({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf6df] text-[#0b6b3a]">
        {icon}
      </div>

      <span>{title}</span>

    </div>
  );
}
