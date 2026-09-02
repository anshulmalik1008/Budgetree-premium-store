"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  UserRound,
} from "lucide-react";

type ExternalApi = {
  id: number;
  name: string;
  baseUrl: string;
  productsUrl: string;
  authType: string;
  username: string | null;
  active: boolean;
  createdAt: string;
};

export default function ApiSettingsPage() {
  const [apis, setApis] = useState<ExternalApi[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState<number | null>(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    name: "",
    baseUrl: "",
    productsUrl: "",
    authType: "BASIC",
    username: "",
    password: "",
    apiKey: "",
    active: true,
  });

  /* =====================================================
     LOAD APIs
  ===================================================== */

  async function loadApis() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/api-settings",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load APIs"
        );
      }

      setApis(data.apis || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load APIs"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApis();
  }, []);

  /* =====================================================
     FORM
  ===================================================== */

  function updateField(
    field: string,
    value: string | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/admin/api-settings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save API"
        );
      }

      setMessage(
        "External API added successfully."
      );

      setForm({
        name: "",
        baseUrl: "",
        productsUrl: "",
        authType: "BASIC",
        username: "",
        password: "",
        apiKey: "",
        active: true,
      });

      setShowPassword(false);

      await loadApis();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save API"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function deleteApi(id: number) {
    const confirmed =
      window.confirm(
        "Delete this external API?"
      );

    if (!confirmed) return;

    try {
      setDeleting(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/api-settings?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete API"
        );
      }

      setMessage(
        "External API deleted successfully."
      );

      await loadApis();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete API"
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#171717]">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-black/40">
              <Server size={14} />
              Admin Portal
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              External APIs
            </h1>

            <p className="mt-2 text-sm text-black/45">
              Connect your product suppliers
              directly to your store.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApis}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold transition hover:bg-black/[0.03]"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          {/* =================================================
              ADD API FORM
          ================================================= */}

          <section className="h-fit rounded-3xl border border-black/[0.07] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171717] text-white">
                <Plus size={19} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Add External API
                </h2>

                <p className="mt-1 text-xs text-black/40">
                  Add supplier API credentials
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* API NAME */}

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  API Name
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="SiriPay"
                  className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-black/30"
                  required
                />
              </div>

              {/* BASE URL */}

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Base URL
                </label>

                <div className="relative">
                  <Link2
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                  />

                  <input
                    value={form.baseUrl}
                    onChange={(e) =>
                      updateField(
                        "baseUrl",
                        e.target.value
                      )
                    }
                    placeholder="https://api.example.com/api"
                    className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm outline-none transition focus:border-black/30"
                  />
                </div>
              </div>

              {/* PRODUCTS URL */}

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Products API URL
                </label>

                <div className="relative">
                  <Link2
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                  />

                  <input
                    value={form.productsUrl}
                    onChange={(e) =>
                      updateField(
                        "productsUrl",
                        e.target.value
                      )
                    }
                    placeholder="https://api.example.com/products"
                    className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm outline-none transition focus:border-black/30"
                    required
                  />
                </div>
              </div>

              {/* AUTH TYPE */}

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Authentication
                </label>

                <select
                  value={form.authType}
                  onChange={(e) =>
                    updateField(
                      "authType",
                      e.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none"
                >
                  <option value="NONE">
                    No Authentication
                  </option>

                  <option value="BASIC">
                    Basic Auth
                  </option>

                  <option value="BEARER">
                    Bearer Token
                  </option>

                  <option value="API_KEY">
                    API Key
                  </option>
                </select>
              </div>

              {/* BASIC AUTH */}

              {form.authType ===
                "BASIC" && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      Username
                    </label>

                    <div className="relative">
                      <UserRound
                        size={15}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                      />

                      <input
                        value={form.username}
                        onChange={(e) =>
                          updateField(
                            "username",
                            e.target.value
                          )
                        }
                        placeholder="sales@example.com"
                        className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm outline-none focus:border-black/30"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      Password
                    </label>

                    <div className="relative">
                      <KeyRound
                        size={15}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={form.password}
                        onChange={(e) =>
                          updateField(
                            "password",
                            e.target.value
                          )
                        }
                        placeholder="Enter password"
                        className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-11 text-sm outline-none focus:border-black/30"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (value) =>
                              !value
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/35 hover:text-black"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* TOKEN / API KEY */}

              {(form.authType ===
                "BEARER" ||
                form.authType ===
                  "API_KEY") && (
                <div>
                  <label className="mb-2 block text-xs font-semibold">
                    {form.authType ===
                    "BEARER"
                      ? "Bearer Token"
                      : "API Key"}
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                    />

                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) =>
                        updateField(
                          "apiKey",
                          e.target.value
                        )
                      }
                      placeholder="Enter credential"
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-10 pr-4 text-sm outline-none focus:border-black/30"
                      required
                    />
                  </div>
                </div>
              )}

              {/* ACTIVE */}

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-black/[0.07] bg-[#fafafa] p-4">
                <div>
                  <p className="text-sm font-semibold">
                    Active API
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Use this API for products
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    updateField(
                      "active",
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 accent-black"
                />
              </label>

              {/* SAVE */}

              <button
                type="submit"
                disabled={saving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add API
                  </>
                )}
              </button>
            </form>
          </section>

          {/* =================================================
              API LIST
          ================================================= */}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Connected APIs
                </h2>

                <p className="mt-1 text-xs text-black/40">
                  {apis.length} API
                  {apis.length !== 1
                    ? "s"
                    : ""}{" "}
                  configured
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-black/[0.07] bg-white">
                <Loader2
                  size={24}
                  className="animate-spin text-black/40"
                />
              </div>
            ) : apis.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white px-6 text-center">
                <Server
                  size={32}
                  className="mb-4 text-black/20"
                />

                <h3 className="font-semibold">
                  No external APIs
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-5 text-black/40">
                  Add your supplier API from
                  the form to start fetching
                  products.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {apis.map((api) => (
                  <div
                    key={api.id}
                    className="rounded-3xl border border-black/[0.07] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04]">
                          <Server
                            size={20}
                            className="text-black/60"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                              {api.name}
                            </h3>

                            {api.active ? (
                              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-600">
                                Active
                              </span>
                            ) : (
                              <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="mt-2 break-all text-xs text-black/40">
                            {api.productsUrl}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-black/[0.04] px-2.5 py-1.5 text-[10px] font-semibold">
                              {api.authType}
                            </span>

                            {api.username && (
                              <span className="rounded-lg bg-black/[0.04] px-2.5 py-1.5 text-[10px] text-black/50">
                                {api.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          deleting === api.id
                        }
                        onClick={() =>
                          deleteApi(api.id)
                        }
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-100 px-4 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting ===
                        api.id ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}

                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
