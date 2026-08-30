"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Package,
  User,
  UserPlus,
  Heart,
  MapPin,
} from "lucide-react";

type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function CustomerAccountMenu() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function loadUser() {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("CUSTOMER AUTH ERROR:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }

    setUser(null);
    setOpen(false);

    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-black/5" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition hover:bg-black hover:text-white"
        title="Login"
      >
        <User size={17} />
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 transition hover:border-black/20"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
          <User size={14} />
        </span>

        <span className="hidden max-w-[100px] truncate text-xs font-medium sm:block">
          {user.name}
        </span>

        <ChevronDown
          size={13}
          className={`transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
            <div className="border-b border-black/10 px-3 py-3">
              <p className="text-sm font-semibold">
                Hi, {user.name}
              </p>

              <p className="mt-1 truncate text-xs text-black/40">
                {user.email}
              </p>
            </div>

            <div className="py-2">
              <AccountLink
                href="/account"
                icon={<User size={16} />}
                text="My Account"
              />

              <AccountLink
                href="/account/orders"
                icon={<Package size={16} />}
                text="My Orders"
              />

              <AccountLink
                href="/track-order"
                icon={<MapPin size={16} />}
                text="Track Order"
              />

              <AccountLink
                href="/wishlist"
                icon={<Heart size={16} />}
                text="Wishlist"
              />
            </div>

            <div className="border-t border-black/10 pt-2">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AccountLink({
  href,
  icon,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-black/[0.04]"
    >
      {icon}
      {text}
    </Link>
  );
}
