"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Loader2,
} from "lucide-react";

type Customer = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Agar kisi protected page se login par aaye hain
   * to login ke baad wahi page open hoga.
   *
   * Example:
   * /auth/login?redirect=/checkout
   */
  const redirectTo = searchParams.get("redirect") || "/";

  /*
   * Check whether customer is already logged in.
   *
   * Agar already logged in hai aur login page khol diya,
   * to direct home par bhej denge.
   */
  useEffect(() => {
    let mounted = true;

    async function checkCustomer() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (
          mounted &&
          response.ok &&
          data.success === true &&
          data.authenticated === true &&
          data.user &&
          data.user.role === "CUSTOMER"
        ) {
          window.location.replace("/");
          return;
        }
      } catch (error) {
        console.error("AUTH CHECK ERROR:", error);
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkCustomer();

    return () => {
      mounted = false;
    };
  }, []);

  function switchMode(newMode: "login" | "register") {
    setMode(newMode);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register" && !cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/customer/login"
          : "/api/auth/customer/register";

      const body =
        mode === "login"
          ? {
              email: cleanEmail,
              password,
            }
          : {
              name: cleanName,
              email: cleanEmail,
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(
          data?.message ||
            (mode === "login"
              ? "Invalid email or password."
              : "Unable to create account.")
        );
        return;
      }

      /*
       * REGISTER
       *
       * Registration complete hone ke baad login tab par
       * switch karenge.
       */
      if (mode === "register") {
        setSuccess(
          "Account created successfully. Please login to continue."
        );

        setMode("login");
        setPassword("");

        return;
      }

      /*
       * LOGIN SUCCESS
       *
       * API ne bps_customer_token cookie set kar di hai.
       *
       * window.location.replace() use kar rahe hain instead
       * of router.push() so complete browser navigation happens
       * and fresh server request cookie ke saath hoti hai.
       */
      const customer: Customer | undefined = data.user;

      setSuccess(
        customer?.name
          ? `Welcome back, ${customer.name}!`
          : "Login successful!"
      );

      window.location.replace(redirectTo);
    } catch (error) {
      console.error("CUSTOMER LOGIN ERROR:", error);

      setError(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <div className="flex items-center gap-3 text-sm text-[#555]">
          <Loader2 className="animate-spin" size={18} />
          Checking account...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#202020]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}
        <div className="hidden bg-[#f0ede7] lg:flex">
          <div className="flex w-full flex-col justify-between p-12 xl:p-20">

            <Link href="/" className="inline-block">
              <div className="text-4xl font-semibold tracking-[-0.06em]">
                BPS
              </div>

              <div className="mt-1 text-[8px] uppercase tracking-[0.35em] text-[#8a806f]">
                Budgetree Premium Store
              </div>
            </Link>

            <div className="max-w-lg">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#b48a3a]">
                Premium Gifting
              </p>

              <h1 className="mt-5 text-6xl font-semibold leading-[0.95] tracking-[-0.055em] xl:text-7xl">
                Gifts that
                <br />
                <span className="text-[#b48a3a]">
                  feel personal.
                </span>
              </h1>

              <p className="mt-7 max-w-md text-sm leading-7 text-[#777]">
                Sign in to manage your orders, wishlist,
                profile and your complete gifting journey.
              </p>
            </div>

            <p className="text-[9px] uppercase tracking-[0.2em] text-[#999]">
              © {new Date().getFullYear()} Budgetree Premium Store
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[440px]">

            {/* MOBILE LOGO */}
            <Link
              href="/"
              className="mb-12 block text-center lg:hidden"
            >
              <div className="text-4xl font-semibold tracking-[-0.06em]">
                BPS
              </div>

              <div className="mt-1 text-[8px] uppercase tracking-[0.35em] text-[#999]">
                Budgetree Premium Store
              </div>
            </Link>

            {/* HEADING */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#b48a3a]">
                My Account
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
                {mode === "login"
                  ? "Welcome back."
                  : "Create your account."}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#888]">
                {mode === "login"
                  ? "Access your account and continue your gifting journey."
                  : "Create your customer account to start shopping."}
              </p>
            </div>

            {/* TABS */}
            <div className="mt-8 flex rounded-full bg-[#ebe8e2] p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 rounded-full px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  mode === "login"
                    ? "bg-[#1d1d1d] text-white shadow"
                    : "text-[#777]"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`flex-1 rounded-full px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  mode === "register"
                    ? "bg-[#1d1d1d] text-white shadow"
                    : "text-[#777]"
                }`}
              >
                Register
              </button>
            </div>

            {/* MESSAGE */}
            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
                {success}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* NAME */}
              {mode === "register" && (
                <div>
                  <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#777]">
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]"
                    />

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className="h-14 w-full rounded-2xl border border-[#ddd9d2] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-[#bbb] focus:border-[#b48a3a]"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#777]">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-14 w-full rounded-2xl border border-[#ddd9d2] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-[#bbb] focus:border-[#b48a3a]"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#777]">
                    Password
                  </label>

                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-[9px] font-medium text-[#b48a3a]"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    className="h-14 w-full rounded-2xl border border-[#ddd9d2] bg-white pl-12 pr-12 text-sm outline-none transition placeholder:text-[#bbb] focus:border-[#b48a3a]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#333]"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#1d1d1d] text-sm font-semibold text-white transition hover:bg-[#b48a3a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    {mode === "login"
                      ? "Signing In..."
                      : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Sign In"
                      : "Create Account"}

                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* BOTTOM */}
            <div className="mt-8 text-center">
              <p className="text-xs text-[#999]">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    mode === "login"
                      ? "register"
                      : "login"
                  )
                }
                className="mt-2 text-sm font-semibold text-[#b48a3a] hover:underline"
              >
                {mode === "login"
                  ? "Create one"
                  : "Login here"}
              </button>
            </div>

            {/* HOME */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] hover:text-[#333]"
              >
                ← Back to Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
