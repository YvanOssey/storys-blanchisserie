import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { ENV } from "./_core/env";

export const CUSTOMER_COOKIE_NAME = "storys_customer_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export async function createCustomerSession(customerId: number) {
  return new SignJWT({ customerId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_DURATION_MS) / 1000))
    .sign(secretKey());
}

export async function verifyCustomerSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const customerId = payload.customerId;
    return typeof customerId === "number" && Number.isInteger(customerId) ? { customerId } : null;
  } catch {
    return null;
  }
}
