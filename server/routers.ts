import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  createCustomer,
  createCustomerAccount,
  createCustomerOrder,
  createOrder,
  createAdminAccount,
  getAdminAccountByEmail,
  getAdminAccountById,
  touchAdminAccount,
  createWebsiteOrder,
  getCustomer,
  getCustomerOrder,
  getCustomerAccountByCustomerId,
  getCustomerAccountByEmail,
  getCustomerByPhone,
  getDashboardMetrics,
  getEffectiveUserRole,
  listAdminWhitelistEntries,
  addAdminWhitelistEntry,
  removeAdminWhitelistEntry,
  getPaymentSummary,
  listCustomers,
  listCustomerNotifications,
  markCustomerNotificationRead,
  deleteCustomerNotification,
  markAllCustomerNotificationsRead,
  listCustomerOrderAssignments,
  listAdminNotifications,
  markAdminNotificationRead,
  deleteAdminNotification,
  markAllAdminNotificationsRead,
  isAdminEmailWhitelisted,
  listOrders,
  trackWebsiteOrder,
  updateOrderPayment,
  updateOrderStatus,
  listCouriers,
  createCourier,
  updateCourier,
  listRouteRuns,
  createRouteRun,
  updateRouteRun,
  upsertOrderAssignment,
  updateAssignmentStatus,
  listOperationalCalendar,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { createCustomerSession, CUSTOMER_COOKIE_NAME, hashPassword, verifyPassword } from "./customerAuth";
import { ADMIN_COOKIE_NAME, createAdminSession } from "./adminAuth";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, clientProcedure, publicProcedure, router } from "./_core/trpc";
import { assignmentStatus, courierStatus, orderStatus, paymentMethods, paymentStatus, routeKind, routeStatus } from "../drizzle/schema";

const statusSchema = z.enum(orderStatus);
const paymentStatusSchema = z.enum(paymentStatus);
const paymentMethodSchema = z.enum(paymentMethods);
const courierStatusSchema = z.enum(courierStatus);
const routeKindSchema = z.enum(routeKind);
const routeStatusSchema = z.enum(routeStatus);
const assignmentStatusSchema = z.enum(assignmentStatus);

function databaseError(error: unknown): never {
  console.error("[Laundry] Database operation failed:", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La base de données est momentanément indisponible." });
}

export const appRouter = router({
  system: systemRouter,
  adminAuth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (ctx.admin && await isAdminEmailWhitelisted(ctx.admin.email)) {
        return { id: ctx.admin.id, email: ctx.admin.email, name: ctx.admin.displayName, role: "admin" as const, authType: "password" as const };
      }
      return null;
    }),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8) })).mutation(async ({ input, ctx }) => {
      try {
        if (!(await isAdminEmailWhitelisted(input.email))) throw new TRPCError({ code: "FORBIDDEN", message: "Cette adresse n’est pas autorisée à administrer Story’s." });
        const account = await getAdminAccountByEmail(input.email);
        if (!account || !verifyPassword(input.password, account.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou mot de passe administrateur incorrect." });
        const refreshed = await touchAdminAccount(account.id);
        const token = await createAdminSession(account.id);
        ctx.res.cookie(ADMIN_COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 8 });
        return { account: { id: refreshed?.id ?? account.id, email: refreshed?.email ?? account.email, name: refreshed?.displayName ?? account.displayName } };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        return databaseError(error);
      }
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  adminNotifications: router({
    list: adminProcedure.input(z.object({ unreadOnly: z.boolean().optional(), limit: z.number().int().positive().max(50).optional() }).optional()).query(async ({ input }) => {
      try { return await listAdminNotifications(input ?? {}); } catch (error) { return databaseError(error); }
    }),
    markRead: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try { return await markAdminNotificationRead(input.id); } catch (error) { return databaseError(error); }
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try { return await deleteAdminNotification(input.id); } catch (error) { return databaseError(error); }
    }),
    markAllRead: adminProcedure.mutation(async () => {
      try { return await markAllAdminNotificationsRead(); } catch (error) { return databaseError(error); }
    }),
  }),

  customerAuth: router({
    me: publicProcedure.query(({ ctx }) => ctx.customer?.customer ?? null),
    register: publicProcedure
      .input(z.object({
        fullName: z.string().min(2),
        phone: z.string().min(6),
        email: z.string().email(),
        password: z.string().min(8),
        address: z.string().min(4),
        city: z.string().min(2),
        postalCode: z.preprocess(value => value === "" ? undefined : value, z.string().min(3).optional()),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (await getCustomerAccountByEmail(input.email)) throw new TRPCError({ code: "CONFLICT", message: "Un compte existe déjà avec cet e-mail." });
          const existingCustomer = await getCustomerByPhone(input.phone);
          const customer = existingCustomer ?? await createCustomer({ fullName: input.fullName, phone: input.phone, email: input.email, address: input.address, city: input.city, postalCode: input.postalCode, notes: "Compte créé depuis l’espace client Story’s." });
          if (await getCustomerAccountByCustomerId(customer.id)) throw new TRPCError({ code: "CONFLICT", message: "Un compte existe déjà pour ce numéro de téléphone." });
          await createCustomerAccount({ customerId: customer.id, email: input.email, passwordHash: hashPassword(input.password) });
          const token = await createCustomerSession(customer.id);
          ctx.res.cookie(CUSTOMER_COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 30 });
          return { customer };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          return databaseError(error);
        }
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const account = await getCustomerAccountByEmail(input.email);
        if (!account || !verifyPassword(input.password, account.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou mot de passe incorrect." });
        const customer = await getCustomer(account.customerId);
        if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Ce compte client n’est plus disponible." });
        const token = await createCustomerSession(customer.customer.id);
        ctx.res.cookie(CUSTOMER_COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 30 });
        return { customer: customer.customer };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(CUSTOMER_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  customer: router({
    profile: clientProcedure.query(({ ctx }) => ctx.customer?.customer ?? null),
    orders: clientProcedure.query(({ ctx }) => ctx.customer?.orders ?? []),
    orderDetail: clientProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      try {
        const order = await getCustomerOrder(ctx.customer!.customer.id, input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Cette commande n’est pas disponible dans votre espace." });
        return order;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        return databaseError(error);
      }
    }),
    orderOperations: clientProcedure.input(z.object({ orderId: z.number().int().positive() })).query(async ({ input, ctx }) => {
      try {
        const order = await getCustomerOrder(ctx.customer!.customer.id, input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Cette commande n’est pas disponible dans votre espace." });
        return await listCustomerOrderAssignments(ctx.customer!.customer.id, input.orderId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        return databaseError(error);
      }
    }),
    notifications: clientProcedure.input(z.object({ unreadOnly: z.boolean().optional() }).optional()).query(async ({ input, ctx }) => {
      try {
        return await listCustomerNotifications(ctx.customer!.customer.id, input ?? {});
      } catch (error) {
        return databaseError(error);
      }
    }),
    markNotificationRead: clientProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      try {
        return await markCustomerNotificationRead(ctx.customer!.customer.id, input.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    removeNotification: clientProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      try {
        return await deleteCustomerNotification(ctx.customer!.customer.id, input.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    markAllNotificationsRead: clientProcedure.mutation(async ({ ctx }) => {
      try {
        return await markAllCustomerNotificationsRead(ctx.customer!.customer.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    createOrder: clientProcedure
      .input(z.object({
        service: z.string().min(2),
        itemCount: z.number().int().positive().optional(),
        weightKg: z.string().optional(),
        instructions: z.string().optional(),
        pickupAt: z.number().int().positive(),
        deliveryAt: z.number().int().positive(),
      }).refine(value => Boolean(value.itemCount || value.weightKg), { message: "Indiquez une quantité ou un poids.", path: ["itemCount"] }))
      .mutation(async ({ input, ctx }) => {
        try {
          return await createCustomerOrder(ctx.customer!.customer.id, input);
        } catch (error) {
          return databaseError(error);
        }
      }),
  }),

  publicOrders: router({
    submit: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(2),
          phone: z.string().min(6),
          email: z.string().email().optional().or(z.literal("")),
          address: z.string().min(4),
          city: z.string().min(2),
          postalCode: z.preprocess(value => value === "" ? undefined : value, z.string().min(3).optional()),
          service: z.string().min(2),
          itemCount: z.number().int().positive().optional(),
          weightKg: z.string().optional(),
          instructions: z.string().optional(),
          pickupAt: z.number().int().positive(),
          deliveryAt: z.number().int().positive(),
        }).refine(value => Boolean(value.itemCount || value.weightKg), { message: "Indiquez une quantité ou un poids.", path: ["itemCount"] }),
      )
      .mutation(async () => {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Connectez-vous pour valider votre commande." });
      }),
  }),

  dashboard: router({
    metrics: adminProcedure.query(async () => {
      try {
        return await getDashboardMetrics();
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),

  customers: router({
    list: adminProcedure
      .input(z.object({ search: z.string().optional(), city: z.string().optional(), withBalance: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        try {
          return await listCustomers(input ?? {});
        } catch (error) {
          return databaseError(error);
        }
      }),
    get: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      try {
        return await getCustomer(input.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
    create: adminProcedure
      .input(
        z.object({
          fullName: z.string().min(2),
          phone: z.string().min(6),
          email: z.string().email().optional().or(z.literal("")),
          address: z.string().min(4),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await createCustomer({ ...input, email: input.email || null });
        } catch (error) {
          return databaseError(error);
        }
      }),
  }),

  orders: router({
    list: adminProcedure
      .input(z.object({ search: z.string().optional(), status: statusSchema.optional() }).optional())
      .query(async ({ input }) => {
        try {
          return await listOrders(input ?? {});
        } catch (error) {
          return databaseError(error);
        }
      }),
    create: adminProcedure
      .input(
        z.object({
          customerId: z.number().int().positive(),
          service: z.string().min(2),
          itemCount: z.number().int().nonnegative().optional(),
          weightKg: z.string().optional(),
          instructions: z.string().optional(),
          status: statusSchema.default("to_collect"),
          pickupAt: z.number().int().optional(),
          deliveryAt: z.number().int().optional(),
          amountCents: z.number().int().nonnegative(),
          paymentMethod: paymentMethodSchema.optional(),
          paymentStatus: paymentStatusSchema.default("pending"),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await createOrder(input);
        } catch (error) {
          return databaseError(error);
        }
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: statusSchema }))
      .mutation(async ({ input }) => {
        try {
          return await updateOrderStatus(input.id, input.status);
        } catch (error) {
          return databaseError(error);
        }
      }),
    updatePayment: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          paymentStatus: paymentStatusSchema,
          paymentMethod: paymentMethodSchema.optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await updateOrderPayment(input.id, input);
        } catch (error) {
          return databaseError(error);
        }
      }),
  }),

  adminWhitelist: router({
    list: adminProcedure.query(async () => {
      try {
        return await listAdminWhitelistEntries();
      } catch (error) {
        return databaseError(error);
      }
    }),
    add: adminProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8), displayName: z.string().min(2).optional() })).mutation(async ({ input, ctx }) => {
      try {
        if (await isAdminEmailWhitelisted(input.email) || await getAdminAccountByEmail(input.email)) throw new TRPCError({ code: "CONFLICT", message: "Cette adresse admin est déjà autorisée ou possède déjà un compte." });
        const account = await createAdminAccount({ email: input.email, passwordHash: hashPassword(input.password), displayName: input.displayName });
        await addAdminWhitelistEntry(input.email, ctx.user?.openId ?? `admin-account:${ctx.admin?.id ?? "unknown"}`);
        return { id: account?.id, email: account?.email, displayName: account?.displayName };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        return databaseError(error);
      }
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        return await removeAdminWhitelistEntry(input.id);
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),

  operations: router({
    couriers: adminProcedure.query(async () => {
      try { return await listCouriers(); } catch (error) { return databaseError(error); }
    }),
    createCourier: adminProcedure.input(z.object({ fullName: z.string().min(2), phone: z.string().min(6), vehicle: z.string().optional(), status: courierStatusSchema.default("active"), notes: z.string().optional() })).mutation(async ({ input }) => {
      try { return await createCourier(input); } catch (error) { return databaseError(error); }
    }),
    updateCourier: adminProcedure.input(z.object({ id: z.number().int().positive(), fullName: z.string().min(2).optional(), phone: z.string().min(6).optional(), vehicle: z.string().optional(), status: courierStatusSchema.optional(), notes: z.string().optional() })).mutation(async ({ input }) => {
      try { const { id, ...changes } = input; return await updateCourier(id, changes); } catch (error) { return databaseError(error); }
    }),
    routes: adminProcedure.input(z.object({ from: z.number().int().optional(), to: z.number().int().optional(), kind: routeKindSchema.optional() }).optional()).query(async ({ input }) => {
      try { return await listRouteRuns(input ?? {}); } catch (error) { return databaseError(error); }
    }),
    createRoute: adminProcedure.input(z.object({ routeDate: z.number().int().positive(), kind: routeKindSchema, zone: z.string().optional(), status: routeStatusSchema.default("planned"), courierId: z.number().int().positive().nullable().optional(), notes: z.string().optional() })).mutation(async ({ input }) => {
      try { return await createRouteRun(input); } catch (error) { return databaseError(error); }
    }),
    updateRoute: adminProcedure.input(z.object({ id: z.number().int().positive(), routeDate: z.number().int().positive().optional(), kind: routeKindSchema.optional(), zone: z.string().optional(), status: routeStatusSchema.optional(), courierId: z.number().int().positive().nullable().optional(), notes: z.string().optional() })).mutation(async ({ input }) => {
      try { const { id, ...changes } = input; return await updateRouteRun(id, changes); } catch (error) { return databaseError(error); }
    }),
    calendar: adminProcedure.input(z.object({ from: z.number().int().optional(), to: z.number().int().optional(), kind: routeKindSchema.optional() }).optional()).query(async ({ input }) => {
      try { return await listOperationalCalendar(input ?? {}); } catch (error) { return databaseError(error); }
    }),
    assign: adminProcedure.input(z.object({ orderId: z.number().int().positive(), kind: routeKindSchema, routeId: z.number().int().positive().nullable().optional(), courierId: z.number().int().positive().nullable().optional(), scheduledAt: z.number().int().positive(), timeWindow: z.string().optional(), address: z.string().min(4), status: assignmentStatusSchema.default("scheduled"), notes: z.string().optional() })).mutation(async ({ input }) => {
      try { return await upsertOrderAssignment(input); } catch (error) { return databaseError(error); }
    }),
    updateAssignmentStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: assignmentStatusSchema })).mutation(async ({ input }) => {
      try { return await updateAssignmentStatus(input.id, input.status); } catch (error) { return databaseError(error); }
    }),
  }),

  payments: router({
    summary: adminProcedure.query(async () => {
      try {
        return await getPaymentSummary();
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
