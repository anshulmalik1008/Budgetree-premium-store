"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

    if (mode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
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
        mode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const body =
        mode === "register"
          ? {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
            }
          : {
              email: email.trim().toLowerCase(),
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Something went wrong. Please try again."
        );
      }

      setMessage(
        mode === "register"
          ? "Account created successfully."
          : "Login successful."
      );

      setTimeout(() => {
        window.location.href = "/account";
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#171717]">
      {/* TOP BAR */}
      <div className="border-b border-black/[0.06] bg-[#f1eee7]">
        <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-center px-5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-black/45">
            Premium gifting, thoughtfully curated
          </p>
        </div>
      </div>

      {/* NAVBAR */}
      <header className="border-b border-black/[0.06] bg-[#f7f5f0]/95">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1c1c] text-[#d8b978]">
              <Gift size={17} strokeWidth={1.5} />
            </div>

            <div>
              <div className="text-lg font-semibold tracking-[-0.05em]">
                BPS
              </div>

              <div className="text-[7px] uppercase tracking-[0.28em] text-black/35">
                Budgetree Premium Store
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft
              size={13}
              className="transition group-hover:-translate-x-1"
            />
            Back to Store
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto flex min-h-[calc(100vh-117px)] max-w-[1400px] items-center justify-center px-5 py-14 md:px-8">
        <div className="grid w-full max-w-[1050px] overflow-hidden rounded-[32px] border border-black/[0.07] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
          {/* LEFT */}
          <div className="relative hidden overflow-hidden bg-[#171717] p-10 text-white lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between">
            <div className="absolute right-[-100px] top-[-100px] h-[330px] w-[330px] rounded-full bg-[#d8b978]/15 blur-[90px]" />

            <div className="relative">
              <span className="inline-flex rounded-full border border-[#d8b978]/20 bg-[#d8b978]/10 px-4 py-2 text-[7px] uppercase tracking-[0.25em] text-[#d8b978]">
                BPS Members
              </span>

              <h1 className="mt-8 max-w-md text-5xl font-semibold leading-[0.96] tracking-[-0.055em]">
                Your world of
                <br />
                <span className="text-[#d8b978]">
                  thoughtful gifting.
                </span>
              </h1>

              <p className="mt-6 max-w-sm text-sm leading-7 text-white/40">
                Sign in to manage your orders,
                wishlist and personal gifting
                experience.
              </p>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
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

          {/* RIGHT */}
          <div className="p-6 sm:p-10 md:p-12">
            <div className="mx-auto max-w-[440px]">
              {/* MOBILE LOGO */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
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
              </div>

              {/* HEADING */}
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#b28b3f]">
                  {mode === "login"
                    ? "Welcome Back"
                    : "Create Account"}
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] md:text-4xl">
                  {mode === "login"
                    ? "Sign in to BPS"
                    : "Join BPS"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-black/40">
                  {mode === "login"
                    ? "Access your account and continue your gifting journey."
                    : "Create your account to save favourites and manage orders."}
                </p>
              </div>

              {/* MODE SWITCH */}
              <div className="mt-8 grid grid-cols-2 rounded-full bg-[#f3f1ec] p-1">
                <button
                  type="button"
                  onClick={() =>
                    switchMode("login")
                  }
                  className={`h-11 rounded-full text-[9px] font-semibold uppercase tracking-[0.18em] transition ${
                    mode === "login"
                      ? "bg-[#171717] text-white shadow-sm"
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
                      ? "bg-[#171717] text-white shadow-sm"
                      : "text-black/40 hover:text-black"
                  }`}
                >
                  Register
                </button>
              </div>

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

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[8px] font-semibold uppercase tracking-[0.2em] text-black/45">
                      Password
                    </label>

                    {mode === "login" && (
                      <button
                        type="button"
                        className="text-[8px] font-medium text-[#a27b32] hover:underline"
                        onClick={() =>
                          setMessage(
                            "Password reset will be added next."
                          )
                        }
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <LockKeyhole
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
                      className="h-13 w-full rounded-2xl border border-black/[0.09] bg-[#faf9f6] pl-11 pr-12 text-sm outline-none transition placeholder:text-black/25 focus:border-[#b28b3f] focus:bg-white"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 transition hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {message && (
                  <div className="rounded-2xl border border-[#d8b978]/30 bg-[#d8b978]/10 px-4 py-3 text-xs text-[#856525]">
                    {message}
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-13 w-full items-center justify-center gap-3 rounded-full bg-[#171717] text-xs font-semibold text-white transition hover:bg-[#292929] disabled:cursor-not-allowed disabled:opacity-60"
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

              {/* BOTTOM */}
              <div className="mt-8 text-center">
                <p className="text-xs text-black/35">
                  {mode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      switchMode(
                        mode === "login"
                          ? "register"
                          : "login"
                      )
                    }
                    className="font-semibold text-[#9b752e] hover:underline"
                  >
                    {mode === "login"
                      ? "Create one"
                      : "Sign in"}
                  </button>
                </p>
              </div>

              {/* SECURITY */}
              <div className="mt-8 border-t border-black/[0.06] pt-6 text-center">
                <p className="text-[8px] uppercase tracking-[0.18em] text-black/25">
                  Secure customer authentication
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* INPUT */

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
          className="h-13 w-full rounded-2xl border border-black/[0.09] bg-[#faf9f6] pl-11 pr-4 text-sm outline-none transition placeholder:text-black/25 focus:border-[#b28b3f] focus:bg-white"
        />
      </div>
    </div>
  );
}

/* MINI FEATURE */

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
