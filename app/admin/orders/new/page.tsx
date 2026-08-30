"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  Trash2,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";

type Product = {
  id: number;
  sku: string;
  name: string;
  price: string | number;
  salePrice: string | number | null;
  stock: number;
  images?: {
    id: number;
    url: string;
  }[];
};

type OrderLine = {
  productId: number;
  quantity: number;
};

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function NewAdminOrderPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [shippingAddress, setShippingAddress] =
    useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("COD");

  const [shippingFee, setShippingFee] =
    useState("0");

  const [discount, setDiscount] = useState("0");

  const [items, setItems] = useState<OrderLine[]>([
    {
      productId: 0,
      quantity: 1,
    },
  ]);

  async function loadProducts() {
    try {
      setLoadingProducts(true);

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load products"
        );
      }

      setProducts(data.products ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load products"
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function addItem() {
    setItems((previous) => [
      ...previous,
      {
        productId: 0,
        quantity: 1,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((previous) =>
      previous.length === 1
        ? previous
        : previous.filter(
            (_, itemIndex) => itemIndex !== index
          )
    );
  }

  function updateItem(
    index: number,
    field: keyof OrderLine,
    value: number
  ) {
    setItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      if (!product) return sum;

      const price = Number(
        product.salePrice ?? product.price
      );

      const quantity = Math.max(
        1,
        Number(item.quantity) || 1
      );

      return sum + price * quantity;
    }, 0);
  }, [items, products]);

  const finalShipping = Number(shippingFee) || 0;
  const finalDiscount = Number(discount) || 0;

  const total =
    subtotal +
    finalShipping -
    finalDiscount;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!customerEmail.trim()) {
      setError("Customer email is required.");
      return;
    }

    const validItems = items.filter(
      (item) =>
        Number.isInteger(item.productId) &&
        item.productId > 0
    );

    if (validItems.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName:
              customerName.trim(),

            customerEmail:
              customerEmail.trim(),

            customerPhone:
              customerPhone.trim() || null,

            shippingAddress:
              shippingAddress.trim() || null,

            city: city.trim() || null,

            state: state.trim() || null,

            pincode:
              pincode.trim() || null,

            paymentMethod,

            shippingFee:
              finalShipping,

            discount:
              finalDiscount,

            items: validItems.map((item) => ({
              productId: item.productId,
              quantity: Math.max(
                1,
                Number(item.quantity) || 1
              ),
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create order"
        );
      }

      setSuccess(
        `Order ${data.order.orderNumber} created successfully.`
      );

      setTimeout(() => {
        router.push(
          `/admin/orders/${data.order.id}`
        );
      }, 700);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create order"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-xl font-semibold">
                Create Order
              </h1>

              <p className="mt-1 text-xs text-gray-500">
                Create a new order from admin
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-6 lg:p-8">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          {/* LEFT */}
          <div className="space-y-6">
            {/* CUSTOMER */}
            <section className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <User size={18} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Customer Information
                  </h2>

                  <p className="text-xs text-gray-400">
                    Enter customer details
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Customer Name">
                  <input
                    required
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                    placeholder="Rahul Sharma"
                    className="input"
                  />
                </Field>

                <Field label="Email">
                  <input
                    required
                    type="email"
                    value={customerEmail}
                    onChange={(e) =>
                      setCustomerEmail(
                        e.target.value
                      )
                    }
                    placeholder="rahul@example.com"
                    className="input"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(
                        e.target.value
                      )
                    }
                    placeholder="+91 9876543210"
                    className="input"
                  />
                </Field>
              </div>
            </section>

            {/* SHIPPING */}
            <section className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <MapPin size={18} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Shipping Address
                  </h2>

                  <p className="text-xs text-gray-400">
                    Delivery address
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <Field label="Address">
                  <textarea
                    rows={4}
                    value={shippingAddress}
                    onChange={(e) =>
                      setShippingAddress(
                        e.target.value
                      )
                    }
                    placeholder="House no, street, area..."
                    className="input resize-none py-3"
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-3">
                  <Field label="City">
                    <input
                      value={city}
                      onChange={(e) =>
                        setCity(e.target.value)
                      }
                      placeholder="Ghaziabad"
                      className="input"
                    />
                  </Field>

                  <Field label="State">
                    <input
                      value={state}
                      onChange={(e) =>
                        setState(e.target.value)
                      }
                      placeholder="Uttar Pradesh"
                      className="input"
                    />
                  </Field>

                  <Field label="Pincode">
                    <input
                      value={pincode}
                      onChange={(e) =>
                        setPincode(
                          e.target.value
                        )
                      }
                      placeholder="201002"
                      className="input"
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* PRODUCTS */}
            <section className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-black/10 p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                    <Package size={18} />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Order Items
                    </h2>

                    <p className="text-xs text-gray-400">
                      Select products and quantity
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              {loadingProducts ? (
                <div className="flex min-h-40 items-center justify-center">
                  <Loader2
                    size={25}
                    className="animate-spin text-gray-400"
                  />
                </div>
              ) : products.length === 0 ? (
                <div className="p-8 text-center">
                  <Package
                    size={35}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 font-medium">
                    No products found
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Create a product first.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {items.map(
                    (item, index) => {
                      const selectedProduct =
                        products.find(
                          (product) =>
                            product.id ===
                            item.productId
                        );

                      const itemPrice =
                        selectedProduct
                          ? Number(
                              selectedProduct.salePrice ??
                                selectedProduct.price
                            )
                          : 0;

                      const itemTotal =
                        itemPrice *
                        Math.max(
                          1,
                          Number(
                            item.quantity
                          ) || 1
                        );

                      return (
                        <div
                          key={index}
                          className="p-6"
                        >
                          <div className="grid gap-4 md:grid-cols-[1fr_130px_130px_45px] md:items-end">
                            <Field label="Product">
                              <select
                                value={
                                  item.productId ||
                                  ""
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "productId",
                                    Number(
                                      e.target
                                        .value
                                    )
                                  )
                                }
                                className="input bg-white"
                              >
                                <option value="">
                                  Select product
                                </option>

                                {products.map(
                                  (
                                    product
                                  ) => (
                                    <option
                                      key={
                                        product.id
                                      }
                                      value={
                                        product.id
                                      }
                                    >
                                      {
                                        product.name
                                      }{" "}
                                      —{" "}
                                      {money(
                                        Number(
                                          product.salePrice ??
                                            product.price
                                        )
                                      )}
                                    </option>
                                  )
                                )}
                              </select>
                            </Field>

                            <Field label="Quantity">
                              <input
                                type="number"
                                min="1"
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    Math.max(
                                      1,
                                      Number(
                                        e.target
                                          .value
                                      ) || 1
                                    )
                                  )
                                }
                                className="input"
                              />
                            </Field>

                            <div>
                              <p className="mb-2 text-sm font-medium">
                                Total
                              </p>

                              <div className="flex h-11 items-center rounded-xl bg-[#f6f6f4] px-4 text-sm font-semibold">
                                {money(
                                  itemTotal
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                              disabled={
                                items.length ===
                                1
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          </div>

                          {selectedProduct && (
                            <p className="mt-3 text-xs text-gray-400">
                              SKU:{" "}
                              {
                                selectedProduct.sku
                              }{" "}
                              · Stock:{" "}
                              {
                                selectedProduct.stock
                              }
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
            {/* PAYMENT */}
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CreditCard
                  size={19}
                  className="text-gray-500"
                />

                <h2 className="font-semibold">
                  Payment
                </h2>
              </div>

              <div className="mt-5">
                <Field label="Payment Method">
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                    className="input bg-white"
                  >
                    <option value="COD">
                      Cash on Delivery
                    </option>

                    <option value="ONLINE">
                      Online Payment
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="CARD">
                      Card
                    </option>

                    <option value="BANK_TRANSFER">
                      Bank Transfer
                    </option>
                  </select>
                </Field>
              </div>
            </section>

            {/* SUMMARY */}
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-semibold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                <SummaryRow
                  label="Subtotal"
                  value={money(subtotal)}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Shipping Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingFee}
                    onChange={(e) =>
                      setShippingFee(
                        e.target.value
                      )
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        e.target.value
                      )
                    }
                    className="input"
                  />
                </div>

                <div className="border-t border-black/10 pt-5">
                  <div className="flex items-end justify-between">
                    <span className="font-semibold">
                      Grand Total
                    </span>

                    <span className="text-2xl font-semibold">
                      {money(total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* MESSAGES */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={
                saving ||
                loadingProducts ||
                products.length === 0
              }
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Creating Order...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Order
                </>
              )}
            </button>

            <Link
              href="/admin/orders"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-medium transition hover:bg-gray-100"
            >
              Cancel
            </Link>
          </aside>
        </form>
      </section>

      <style jsx global>{`
        .input {
          width: 100%;
          min-height: 44px;
          border-radius: 12px;
          border: 1px solid rgb(0 0 0 / 0.1);
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          background: white;
        }

        .input:focus {
          border-color: rgb(0 0 0 / 0.35);
        }

        textarea.input {
          min-height: auto;
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

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}