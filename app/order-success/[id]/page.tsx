import Link from "next/link";
import { CheckCircle2, ArrowRight, Package, ShoppingBag } from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderSuccess({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#fffaf5] text-[#222]">
      {/* HEADER */}

      <header className="border-b border-[#eadfd5] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            BPS
          </Link>

          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm text-[#555]"
          >
            <ShoppingBag size={17} />
            Continue Shopping
          </Link>
        </div>
      </header>

      {/* SUCCESS */}

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center px-5 py-16">
        <div className="w-full rounded-[32px] border border-[#eadfd5] bg-white p-8 text-center shadow-sm md:p-14">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e9f7ed]">
            <CheckCircle2
              size={42}
              strokeWidth={1.7}
              className="text-[#278a4b]"
            />
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-[#b47b45]">
            Order Confirmed
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Thank you for your order!
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#777]">
            Your order has been successfully placed. We&apos;ll keep you
            updated as your order moves through processing and delivery.
          </p>

          {/* ORDER NUMBER */}

          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-[#fff8f1] p-5">
            <div className="flex items-center justify-center gap-3">
              <Package size={20} className="text-[#b47b45]" />

              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#999]">
                  Order ID
                </p>

                <p className="mt-1 text-lg font-semibold">
                  #{id}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/account/orders"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#b47b45] px-7 text-sm font-medium text-white transition hover:bg-[#996438]"
            >
              View My Orders
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/track-order"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#dfd1c5] px-7 text-sm text-[#555] transition hover:bg-[#faf5f0]"
            >
              Track Order
            </Link>
          </div>

          <Link
            href="/"
            className="mt-7 inline-block text-xs text-[#999] underline underline-offset-4 hover:text-[#555]"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
