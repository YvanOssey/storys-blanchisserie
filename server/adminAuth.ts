import { jwtVerify, SignJWT } from "jose";
import { ENV } from "./_core/env";

export const ADMIN_COOKIE_NAME = "storys_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createAdminSession(adminAccountId: number) {
  return new SignJWT({ adminAccountId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_DURATION_MS) / 1000))
    .sign(secretKey());
}

export async function verifyAdminSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const adminAccountId = payload.adminAccountId;
    return typeof adminAccountId === "number" && Number.isInteger(adminAccountId) ? { adminAccountId } : null;
  } catch {
    return null;
  }
}
