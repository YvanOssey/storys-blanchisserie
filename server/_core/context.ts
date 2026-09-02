import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse } from "cookie";
import { getAdminAccountById, getCustomer } from "../db";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSession } from "../customerAuth";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "../adminAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  customer: Awaited<ReturnType<typeof getCustomer>> | null;
  admin: Awaited<ReturnType<typeof getAdminAccountById>> | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let customer: Awaited<ReturnType<typeof getCustomer>> | null = null;
  let admin: Awaited<ReturnType<typeof getAdminAccountById>> | null = null;

  const cookies = parse(opts.req.headers.cookie ?? "");
  const customerSession = await verifyCustomerSession(cookies[CUSTOMER_COOKIE_NAME]);
  if (customerSession) customer = (await getCustomer(customerSession.customerId)) ?? null;
  const adminSession = await verifyAdminSession(cookies[ADMIN_COOKIE_NAME]);
  if (adminSession) admin = (await getAdminAccountById(adminSession.adminAccountId)) ?? null;

  return {
    req: opts.req,
    res: opts.res,
    user,
    customer,
    admin,
  };
}
