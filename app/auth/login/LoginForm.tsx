"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Loader2,
  Gift,
  ArrowLeft,
} from "lucide-react";

type Mode = "login" | "register";

type Customer = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function LoginForm() {
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirect") || "/shop";

  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /*
   * Already logged-in customer:
   * don't show login form again.
   */
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (
          active &&
          response.ok &&
          data?.success === true &&
          data?.authenticated === true &&
          data?.user?.role === "CUSTOMER"
        ) {
          window.location.replace("/");
          return;
        }
      } catch (err) {
        console.error(
          "AUTH CHECK ERROR:",
          err
        );
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, []);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email
      .trim()
      .toLowerCase();

    const cleanName = name.trim();

    if (mode === "register" && !cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

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

      const data = await response
        .json()
        .catch(() => null);

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
       */
      if (mode === "register") {
        setMessage(
          "Account created successfully. Please login to continue."
        );

        setMode("login");
        setPassword("");
        return;
      }

      /*
       * LOGIN
       */
      const customer: Customer | undefined =
        data.user;

      setMessage(
        customer?.name
          ? `Welcome back, ${customer.name}!`
          : "Login successful!"
      );

      /*
       * Login API must already have set:
       * bps_customer_token
       *
       * Full browser navigation ensures the next
       * request sees the cookie.
       */
      window.location.replace(redirectTo);
    } catch (err) {
      console.error(
        "CUSTOMER AUTH ERROR:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <div className="flex items-center gap-3 text-sm text-black/50">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Checking account...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#202020]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}

        <section className="relative hidden overflow-hidden bg-[#1b1b1b] lg:flex">
          <div className="absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full bg-[#d8b978]/10 blur-[100px]" />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-20">

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d8b978] text-black">
                <Gift size={18} />
              </div>

              <div>
                <p className="text-lg font-semibold text-white">
                  BPS
                </p>

                <p className="text-[7px] uppercase tracking-[0.28em] text-white/35">
                  Budgetree Premium Store
                </p>
              </div>
            </Link>

            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-[#d8b978]">
                Premium Gifting
              </p>

              <h1 className="mt-5 text-6xl font-semibold leading-[0.95] tracking-[-0.06em] text-white xl:text-7xl">
                Gifts that
                <br />
                <span className="text-[#d8b978]">
                  feel personal.
                </span>
              </h1>

              <p className="mt-7 max-w-md text-sm leading-7 text-white/35">
                Sign in to manage your orders,
                wishlist and your personal gifting
                experience.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniFeature
                title="Orders"
                text="Track every purchase"
              />

              <MiniFeature
                title="Wishlist"
                text="Save your favourites"
              />

              <MiniFeature
                title="Account"
                text="Manage your details"
              />
            </div>
          </div>
        </section>

        {/* RIGHT */}

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[460px]">

            {/* MOBILE LOGO */}

            <div className="mb-10 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-[#d8b978]">
                  <Gift size={17} />
                </div>

                <div>
                  <p className="text-lg font-semibold">
                    BPS
                  </p>

                  <p className="text-[7px] uppercase tracking-[0.25em] text-black/35">
                    Budgetree Premium Store
                  </p>
                </div>
              </Link>
            </div>

            {/* HEADING */}

            <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#b28b3f]">
              {mode === "login"
                ? "Welcome Back"
                : "Create Account"}
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
              {mode === "login"
                ? "Sign in to BPS"
                : "Join BPS"}
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-black/40">
              {mode === "login"
                ? "Access your account and continue your gifting journey."
                : "Create your account to save favourites and manage your orders."}
            </p>

            {/* SWITCH */}

            <div className="mt-8 grid grid-cols-2 rounded-full bg-[#ebe8e2] p-1">
              <button
                type="button"
                onClick={() =>
                  switchMode("login")
                }
                className={`h-11 rounded-full text-[9px] font-semibold uppercase tracking-[0.18em] transition ${
                  mode === "login"
                    ? "bg-[#171717] text-white shadow"
                    : "text-black/40 hover:text-black"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode("register")
                }
                className={`h-11 rounded-full text-[9px] font-semibold uppercase tracking-[0.18em] transition ${
                  mode === "register"
                    ? "bg-[#171717] text-white shadow"
                    : "text-black/40 hover:text-black"
                }`}
              >
                Register
              </button>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div className="mt-6 rounded-2xl border border-[#d8b978]/30 bg-[#d8b978]/10 px-4 py-3 text-xs text-[#856525]">
                {message}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {mode === "register" && (
                <InputField
                  label="Full Name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={setName}
                  icon={<User size={16} />}
                  autoComplete="name"
                />
              )}

              <InputField
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                icon={<Mail size={16} />}
                type="email"
                autoComplete="email"
              />

              {/* PASSWORD */}

              <div>
                <label className="mb-2 block text-[8px] font-semibold uppercase tracking-[0.2em] text-black/45">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
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
                    className="h-14 w-full rounded-2xl border border-black/[0.09] bg-[#faf9f6] pl-11 pr-12 text-sm outline-none transition placeholder:text-black/25 focus:border-[#b28b3f] focus:bg-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* FORGOT */}

              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        "Password reset will be added next."
                      )
                    }
                    className="text-[8px] font-medium text-[#a27b32] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#171717] text-xs font-semibold text-white transition hover:bg-[#b28b3f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Please wait...
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Sign In"
                      : "Create Account"}

                    <ArrowRight
                      size={15}
                      className="transition group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* FOOTER LINKS */}

            <div className="mt-8 text-center">
              <p className="text-xs text-black/35">
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
                
                className="mt-2 text-sm font-semibold text-[#9b752e] hover:underline"
              >
                {mode === "login"
                  ? "Create one"
                  : "Sign in"}
              </button>
            </div>

            <div className="mt-8 border-t border-black/[0.06] pt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-black/30 transition hover:text-black"
              >
                <ArrowLeft size={12} />
                Back to Store
              </Link>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}

/* =====================================================
   INPUT FIELD
===================================================== */

function InputField({
  label,
  placeholder,
  value,
  onChange,
  icon,
  type = "text",
  autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[8px] font-semibold uppercase tracking-[0.2em] text-black/45">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30">
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-14 w-full rounded-2xl border border-black/[0.09] bg-[#faf9f6] pl-11 pr-4 text-sm outline-none transition placeholder:text-black/25 focus:border-[#b28b3f] focus:bg-white"
        />
      </div>
    </div>
  );
}

/* =====================================================
   MINI FEATURE
===================================================== */

function MiniFeature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
      <p className="text-[9px] font-semibold text-[#d8b978]">
        {title}
      </p>

      <p className="mt-2 text-[8px] leading-4 text-white/30">
        {text}
      </p>
    </div>
  );
}
