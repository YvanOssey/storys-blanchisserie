import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getEffectiveUserRole, isAdminEmailWhitelisted } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requireCustomer = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.customer) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Connectez-vous à votre espace client." });
  }
  return next({ ctx: { ...ctx, customer: ctx.customer } });
});

export const clientProcedure = t.procedure.use(requireCustomer);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (ctx.admin) {
      if (!(await isAdminEmailWhitelisted(ctx.admin.email))) {
        throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      }
      return next({ ctx: { ...ctx, admin: ctx.admin } });
    }
    if (ctx.user && (await getEffectiveUserRole(ctx.user)) === "admin") {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }),
);
