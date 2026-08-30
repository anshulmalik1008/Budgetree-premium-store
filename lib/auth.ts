import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

const CUSTOMER_COOKIE = "bps_customer_token";
const ADMIN_COOKIE = "bps_admin_token";

/* =====================================================
   CUSTOMER AUTH
===================================================== */

export async function createCustomerToken(userId: number) {
  return await new SignJWT({
    userId,
    type: "customer",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function setCustomerAuthCookie(userId: number) {
  const token = await createCustomerToken(userId);

  const cookieStore = await cookies();

  cookieStore.set({
    name: CUSTOMER_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getCurrentCustomerId() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(CUSTOMER_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      secretKey
    );

    if (payload.type !== "customer") {
      return null;
    }

    if (
      typeof payload.userId !== "number" ||
      !Number.isInteger(payload.userId)
    ) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export async function clearCustomerAuthCookie() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: CUSTOMER_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}


/* =====================================================
   ADMIN AUTH
===================================================== */

export async function createAdminToken(userId: number) {
  return await new SignJWT({
    userId,
    type: "admin",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function setAdminAuthCookie(userId: number) {
  const token = await createAdminToken(userId);

  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      secretKey
    );

    if (payload.type !== "admin") {
      return null;
    }

    if (
      typeof payload.userId !== "number" ||
      !Number.isInteger(payload.userId)
    ) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export async function clearAdminAuthCookie() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}
