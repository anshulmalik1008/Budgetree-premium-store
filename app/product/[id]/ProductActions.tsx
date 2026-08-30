"use client";

import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CART_KEY = "bps_cart";

type Product = {
  id: number;
  name: string;
  sku: string;
  price: string | number;
  salePrice?: string | number | null;
  stock: number;
  images?: {
    url: string;
    alt?: string | null;
  }[];
};

export default function ProductActions({
  product,
}: {
  product: Product;
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const price = Number(product.price);

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  const finalPrice =
    salePrice !== null && salePrice < price
      ? salePrice
      : price;

  const disabled = product.stock <= 0;

  function addToCart() {
    if (disabled) return;

    try {
      const saved = localStorage.getItem(CART_KEY);

      let cart: any[] = [];

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          cart = parsed;
        }
      }

      const existingIndex = cart.findIndex(
        (item) => Number(item.id) === Number(product.id)
      );

      if (existingIndex >= 0) {
        cart[existingIndex].quantity =
          Number(cart[existingIndex].quantity || 1) + 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price,
          salePrice,
          quantity: 1,
          image: product.images?.[0]?.url ?? null,
        });
      }

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
      );

      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: cart,
        })
      );

      setAdded(true);

      setTimeout(() => {
        setAdded(false);
      }, 1800);
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);
    }
  }

  function buyNow() {
    if (disabled) return;

    addToCart();

    setTimeout(() => {
      router.push("/checkout");
    }, 100);
  }

  return (
    <div className="mt-8">
      <div className="flex gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={addToCart}
          className="flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-[#d4b76b] text-xs font-semibold text-black transition hover:bg-[#e3ca83] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingBag size={17} />

          {added ? "Added to Cart ✓" : "Add to Cart"}
        </button>

        <button
          type="button"
          disabled={disabled}
          className="flex h-14 items-center justify-center rounded-2xl border border-white/10 px-5 text-white/60 transition hover:border-[#d4b76b]/30 hover:text-[#d4b76b] disabled:opacity-40"
        >
          <Heart size={18} />
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={buyNow}
        className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl border border-[#d4b76b]/25 bg-[#d4b76b]/[0.04] text-xs font-medium text-[#d4b76b] transition hover:bg-[#d4b76b]/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {disabled
          ? "Out of Stock"
          : `Buy Now · ${formatPrice(finalPrice)}`}
      </button>
    </div>
  );
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}
