import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

export async function createCustomerToken(
  userId: number
) {
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

export async function getCurrentCustomerId() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("bps_customer_token")?.value;

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

    const userId = Number(payload.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    return userId;
  } catch (error) {
    console.error("CUSTOMER TOKEN ERROR:", error);
    return null;
  }
}

export async function clearCustomerToken() {
  const cookieStore = await cookies();

  cookieStore.set(
    "bps_customer_token",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    }
  );
}