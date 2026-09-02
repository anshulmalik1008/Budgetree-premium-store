"use client";

import { FormEvent, useEffect, useState } from "react";

type ApiSettings = {
  id?: number;
  name?: string;
  baseUrl?: string | null;
  productsUrl?: string;
  authType?: string;
  username?: string | null;
  hasPassword?: boolean;
  hasApiKey?: boolean;
};

export default function ExternalApiPage() {
  const [name, setName] = useState("SiriPay");
  const [baseUrl, setBaseUrl] = useState(
    "https://api.dealer.siripay.co/api"
  );
  const [productsUrl, setProductsUrl] = useState(
    "https://api.dealer.siripay.co/api/v1/merchandise/products"
  );

  const [authType, setAuthType] = useState("BEARER");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [jwtToken, setJwtToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/external-api", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success && data.api) {
        const api: ApiSettings = data.api;

        setName(api.name || "");
        setBaseUrl(api.baseUrl || "");
        setProductsUrl(api.productsUrl || "");
        setAuthType(api.authType || "BEARER");
        setUsername(api.username || "");
      }
    } catch (error) {
      console.error("LOAD API SETTINGS ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/external-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          baseUrl,
          productsUrl,
          authType,
          username,
          password,
          apiKey,
          jwtToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save API settings"
        );
      }

      setMessage("API settings saved successfully ✅");

      setPassword("");
      setApiKey("");
      setJwtToken("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            Loading API settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Admin Panel
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            External API Settings
          </h1>

          <p className="mt-2 text-slate-500">
            Connect your product catalogue with an external API.
          </p>
        </div>

        <form onSubmit={saveSettings} className="space-y-6">
          {/* BASIC SETTINGS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              API Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add the external product API that your store will use.
            </p>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  API Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="SiriPay"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Base URL
                </label>

                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/api"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Products API URL
                </label>

                <input
                  value={productsUrl}
                  onChange={(e) => setProductsUrl(e.target.value)}
                  placeholder="https://api.example.com/api/v1/products"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* AUTH */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Authentication
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select how the external API authenticates requests.
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Authentication Type
              </label>

              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="NONE">No Authentication</option>
                <option value="BEARER">JWT / Bearer Token</option>
                <option value="BASIC">Basic Authentication</option>
                <option value="API_KEY">API Key</option>
              </select>
            </div>

            {/* JWT */}
            {authType === "BEARER" && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  JWT Token
                </label>

                <textarea
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  placeholder="Paste JWT token here"
                  rows={5}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  The server will send this as:
                  <span className="ml-1 font-mono">
                    Authorization: Bearer &lt;token&gt;
                  </span>
                </p>
              </div>
            )}

            {/* BASIC AUTH */}
            {authType === "BASIC" && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>

                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* API KEY */}
            {authType === "API_KEY" && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  API Key
                </label>

                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste API key"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500"
                />
              </div>
            )}
          </section>

          {/* SAVE */}
          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              {message && (
                <p
                  className={`text-sm font-medium ${
                    message.includes("successfully")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save API Settings"}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}
