import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  customers,
  customerAccounts,
  customerNotifications,
  adminWhitelist,
  AdminWhitelistEntry,
  adminAccounts,
  AdminAccount,
  InsertCustomer,
  InsertOrder,
  orders,
  orderStatus,
  Customer,
  Order,
  users,
  InsertUser,
  User,
  couriers,
  Courier,
  InsertCourier,
  routeRuns,
  orderAssignments,
  routeKind,
  routeStatus,
  assignmentStatus,
  adminNotifications,
  InsertRouteRun,
  InsertOrderAssignment,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb() {
  if (!_db) {
    throw new Error("Database unavailable");
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach(field => {
      const value = user[field];
      if (value !== undefined) {
        values[field] = value ?? null;
        updateSet[field] = value ?? null;
      }
    });
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function isAdminEmailWhitelisted(email?: string | null) {
  if (!email) return false;
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: adminWhitelist.id }).from(adminWhitelist).where(eq(adminWhitelist.email, normalizeAdminEmail(email))).limit(1);
  return Boolean(result[0]);
}

export async function getEffectiveUserRole(user: Pick<User, "openId" | "email" | "role">) {
  return (await isAdminEmailWhitelisted(user.email)) ? "admin" as const : "user" as const;
}

export async function getAdminAccountByEmail(email: string): Promise<AdminAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.email, normalizeAdminEmail(email))).limit(1);
  return result[0];
}

export async function getAdminAccountById(id: number): Promise<AdminAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.id, id)).limit(1);
  return result[0];
}

export async function createAdminAccount(input: { email: string; passwordHash: string; displayName?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const normalizedEmail = normalizeAdminEmail(input.email);
  const inserted = await db.insert(adminAccounts).values({ email: normalizedEmail, passwordHash: input.passwordHash, displayName: input.displayName || null });
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.id, Number(inserted[0].insertId))).limit(1);
  return result[0];
}

export async function touchAdminAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(adminAccounts).set({ lastSignedIn: new Date() }).where(eq(adminAccounts.id, id));
  return getAdminAccountById(id);
}

export async function listAdminWhitelistEntries(): Promise<AdminWhitelistEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminWhitelist).orderBy(desc(adminWhitelist.createdAt));
}

export async function addAdminWhitelistEntry(email: string, addedByOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const normalizedEmail = normalizeAdminEmail(email);
  await db.insert(adminWhitelist).values({ email: normalizedEmail, addedByOpenId });
  const result = await db.select().from(adminWhitelist).where(eq(adminWhitelist.email, normalizedEmail)).limit(1);
  return result[0];
}

export async function removeAdminWhitelistEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(adminWhitelist).where(eq(adminWhitelist.id, id)).limit(1);
  if (!result[0]) return undefined;
  await db.delete(adminWhitelist).where(eq(adminWhitelist.id, id));
  return result[0];
}

export async function listCustomers(input: { search?: string; city?: string; withBalance?: boolean } = {}): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];
  const normalized = input.search?.trim();
  const where = and(
    normalized
      ? or(
          like(customers.fullName, `%${normalized}%`),
          like(customers.phone, `%${normalized}%`),
          like(customers.email, `%${normalized}%`),
        )
      : undefined,
    input.city ? eq(customers.city, input.city) : undefined,
  );
  const rows = await db.select().from(customers).where(where).orderBy(desc(customers.createdAt));
  if (!input.withBalance || rows.length === 0) return rows;
  const balances = await db
    .select({
      customerId: orders.customerId,
      balanceCents: sql<number>`sum(${orders.amountCents})`,
    })
    .from(orders)
    .where(eq(orders.paymentStatus, "pending"))
    .groupBy(orders.customerId);
  const customerIdsWithBalance = new Set(balances.filter(row => Number(row.balanceCents) > 0).map(row => row.customerId));
  return rows.filter(customer => customerIdsWithBalance.has(customer.id));
}

export async function getCustomer(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!result[0]) return undefined;
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt));
  const balanceCents = customerOrders
    .filter(order => order.paymentStatus === "pending")
    .reduce((sum, order) => sum + order.amountCents, 0);
  return { customer: result[0], orders: customerOrders, balanceCents };
}

export async function createCustomer(input: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const inserted = await db.insert(customers).values(input);
  const id = Number(inserted[0].insertId);
  const created = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return created[0];
}

export async function getCustomerAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customerAccounts).where(eq(customerAccounts.email, email.trim().toLowerCase())).limit(1);
  return result[0];
}

export async function getCustomerAccountByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customerAccounts).where(eq(customerAccounts.customerId, customerId)).limit(1);
  return result[0];
}

export async function createCustomerAccount(input: { customerId: number; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const inserted = await db.insert(customerAccounts).values({ ...input, email: input.email.trim().toLowerCase() });
  const id = Number(inserted[0].insertId);
  const result = await db.select().from(customerAccounts).where(eq(customerAccounts.id, id)).limit(1);
  return result[0];
}

export async function getCustomerByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  return result[0];
}

export async function trackWebsiteOrder(orderNumber: string, phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ order: orders, customerName: customers.fullName, customerPhone: customers.phone })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(and(eq(orders.orderNumber, orderNumber.trim()), eq(customers.phone, phone.trim())))
    .limit(1);
  return result[0];
}

export async function createCustomerOrder(customerId: number, input: {
  service: string;
  itemCount?: number;
  weightKg?: string;
  instructions?: string;
  pickupAt?: number;
  deliveryAt?: number;
}) {
  const order = await createOrder({
    customerId,
    service: input.service,
    itemCount: input.itemCount,
    weightKg: input.weightKg,
    instructions: input.instructions,
    status: "to_collect",
    pickupAt: input.pickupAt,
    deliveryAt: input.deliveryAt,
    amountCents: 0,
    paymentStatus: "pending",
    source: "website",
  });
  if (order) {
    await createCustomerNotification(order, "to_collect");
    await createAdminOrderNotification(order);
  }
  return order;
}

export async function createWebsiteOrder(input: {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  postalCode?: string;
  service: string;
  itemCount?: number;
  weightKg?: string;
  instructions?: string;
  pickupAt?: number;
  deliveryAt?: number;
}) {
  const existing = await getCustomerByPhone(input.phone);
  const customer = existing ?? await createCustomer({
    fullName: input.fullName,
    phone: input.phone,
    email: input.email || null,
    address: input.address,
    city: input.city || null,
    postalCode: input.postalCode || null,
    notes: "Demande reçue depuis le site public.",
  });
  const order = await createOrder({
    customerId: customer.id,
    service: input.service,
    itemCount: input.itemCount,
    weightKg: input.weightKg,
    instructions: input.instructions,
    status: "to_collect",
    pickupAt: input.pickupAt,
    deliveryAt: input.deliveryAt,
    amountCents: 0,
    paymentStatus: "pending",
    source: "website",
  });
  if (order) {
    await createCustomerNotification(order, "to_collect");
    await createAdminOrderNotification(order);
  }
  return order;
}

export async function listOrders(input: { search?: string; status?: (typeof orderStatus)[number] }) {
  const db = await getDb();
  if (!db) return [];
  const normalized = input.search?.trim();
  const filters = [
    input.status ? eq(orders.status, input.status) : undefined,
    normalized
      ? or(
          like(orders.orderNumber, `%${normalized}%`),
          like(orders.service, `%${normalized}%`),
          like(customers.fullName, `%${normalized}%`),
        )
      : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;
  const rows = await db
    .select({ order: orders, customerName: customers.fullName, customerPhone: customers.phone })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(where)
    .orderBy(desc(orders.createdAt));
  const balances = await db
    .select({ customerId: orders.customerId, balanceCents: sql<number>`sum(${orders.amountCents})` })
    .from(orders)
    .where(eq(orders.paymentStatus, "pending"))
    .groupBy(orders.customerId);
  const balanceByCustomer = new Map(balances.map(row => [row.customerId, Number(row.balanceCents) || 0]));
  return rows.map(row => ({ ...row, customerBalanceCents: balanceByCustomer.get(row.order.customerId) ?? 0 }));
}

export async function createOrder(input: Omit<InsertOrder, "orderNumber">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const orderNumber = `LINGE-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(orders).values({ ...input, orderNumber });
  const created = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return created[0];
}

const statusNotificationCopy: Record<(typeof orderStatus)[number], { title: string; message: string }> = {
  to_collect: { title: "Commande enregistrée", message: "Votre demande est bien reçue. Story’s vous contactera pour organiser la collecte." },
  received: { title: "Linge reçu", message: "Votre linge a été réceptionné par Story’s et va entrer en traitement." },
  washing: { title: "Lavage en cours", message: "Votre linge est actuellement pris en charge par notre équipe." },
  ready: { title: "Commande prête", message: "Votre linge est prêt. La livraison peut maintenant être organisée." },
  in_delivery: { title: "Commande en livraison", message: "Votre linge est en route vers l’adresse indiquée." },
  delivered: { title: "Commande livrée", message: "Votre commande est marquée comme livrée. Merci d’avoir choisi Story’s." },
};

async function createCustomerNotification(order: Order, status: (typeof orderStatus)[number]) {
  const db = await getDb();
  if (!db || !order) return;
  const copy = statusNotificationCopy[status];
  await db.insert(customerNotifications).values({ customerId: order.customerId, orderId: order.id, status, title: copy.title, message: copy.message });
}

export async function createAdminOrderNotification(order: Order) {
  const db = await getDb();
  if (!db || !order) return;
  await db.insert(adminNotifications).values({
    orderId: order.id,
    title: "Nouvelle commande reçue",
    message: `${order.orderNumber} est prête à être organisée pour la collecte.`,
  });
}

export async function listAdminNotifications(input: { unreadOnly?: boolean; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(adminNotifications).where(input.unreadOnly ? isNull(adminNotifications.readAt) : undefined).orderBy(desc(adminNotifications.createdAt));
  return input.limit ? rows.slice(0, input.limit) : rows;
}

export async function markAdminNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(adminNotifications).set({ readAt: new Date() }).where(eq(adminNotifications.id, id));
  const result = await db.select().from(adminNotifications).where(eq(adminNotifications.id, id)).limit(1);
  return result[0];
}

export async function deleteAdminNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(adminNotifications).where(eq(adminNotifications.id, id)).limit(1);
  if (!result[0]) return undefined;
  await db.delete(adminNotifications).where(eq(adminNotifications.id, id));
  return result[0];
}

export async function markAllAdminNotificationsRead() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(adminNotifications).set({ readAt: new Date() }).where(isNull(adminNotifications.readAt));
  return { success: true } as const;
}

export async function listCustomerNotifications(customerId: number, input: { unreadOnly?: boolean } = {}) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerNotifications).where(and(eq(customerNotifications.customerId, customerId), input.unreadOnly ? isNull(customerNotifications.readAt) : undefined)).orderBy(desc(customerNotifications.createdAt));
}

export async function markCustomerNotificationRead(customerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(customerNotifications).set({ readAt: new Date() }).where(and(eq(customerNotifications.id, id), eq(customerNotifications.customerId, customerId)));
  const result = await db.select().from(customerNotifications).where(and(eq(customerNotifications.id, id), eq(customerNotifications.customerId, customerId))).limit(1);
  return result[0];
}

export async function deleteCustomerNotification(customerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(customerNotifications).where(and(eq(customerNotifications.id, id), eq(customerNotifications.customerId, customerId))).limit(1);
  if (!result[0]) return undefined;
  await db.delete(customerNotifications).where(and(eq(customerNotifications.id, id), eq(customerNotifications.customerId, customerId)));
  return result[0];
}

export async function markAllCustomerNotificationsRead(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(customerNotifications).set({ readAt: new Date() }).where(and(eq(customerNotifications.customerId, customerId), isNull(customerNotifications.readAt)));
  return { success: true } as const;
}

export async function getCustomerOrder(customerId: number, orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.customerId, customerId))).limit(1);
  return result[0];
}

export async function listCustomerOrderAssignments(customerId: number, orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ assignment: orderAssignments, courier: couriers, route: routeRuns })
    .from(orderAssignments)
    .innerJoin(orders, eq(orderAssignments.orderId, orders.id))
    .leftJoin(couriers, eq(orderAssignments.courierId, couriers.id))
    .leftJoin(routeRuns, eq(orderAssignments.routeId, routeRuns.id))
    .where(and(eq(orders.customerId, customerId), eq(orderAssignments.orderId, orderId)))
    .orderBy(orderAssignments.scheduledAt);
}

export async function updateOrderStatus(id: number, status: (typeof orderStatus)[number]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!current[0]) return undefined;
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  const updated = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (updated[0] && current[0].status !== status) await createCustomerNotification(updated[0], status);
  return updated[0];
}

export async function updateOrderPayment(
  id: number,
  input: { paymentStatus: "pending" | "paid"; paymentMethod?: "cash" | "card" | "transfer" | "mobile" },
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(orders).set(input).where(eq(orders.id, id));
  const updated = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return updated[0];
}

export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) {
    return { ordersToday: 0, inTreatment: 0, deliveriesDue: 0, paymentsPending: 0, pendingAmountCents: 0, recentOrders: [] };
  }
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const todayOrders = allOrders.filter(order => order.createdAt >= today && order.createdAt < tomorrow);
  const yesterdayOrders = allOrders.filter(order => order.createdAt >= yesterday && order.createdAt < today);
  const ordersToday = todayOrders.length;
  const inTreatment = allOrders.filter(order => ["received", "washing"].includes(order.status)).length;
  const deliveriesDue = allOrders.filter(order => ["ready", "in_delivery"].includes(order.status)).length;
  const pending = allOrders.filter(order => order.paymentStatus === "pending");
  const currentPendingToday = todayOrders.filter(order => order.paymentStatus === "pending").length;
  const recentOrders = allOrders.slice(0, 6);
  const previous = {
    ordersToday: yesterdayOrders.length,
    inTreatment: yesterdayOrders.filter(order => ["received", "washing"].includes(order.status)).length,
    deliveriesDue: yesterdayOrders.filter(order => ["ready", "in_delivery"].includes(order.status)).length,
    paymentsPending: yesterdayOrders.filter(order => order.paymentStatus === "pending").length,
  };
  return {
    ordersToday,
    inTreatment,
    deliveriesDue,
    paymentsPending: pending.length,
    pendingAmountCents: pending.reduce((sum, order) => sum + order.amountCents, 0),
    recentOrders,
    previous,
    pendingToday: currentPendingToday,
  };
}

export async function getPaymentSummary() {
  const db = await getDb();
  if (!db) return { paidCents: 0, pendingCents: 0, paidCount: 0, pendingCount: 0 };
  const allOrders = await db.select().from(orders);
  const paid = allOrders.filter(order => order.paymentStatus === "paid");
  const pending = allOrders.filter(order => order.paymentStatus === "pending");
  return {
    paidCents: paid.reduce((sum, order) => sum + order.amountCents, 0),
    pendingCents: pending.reduce((sum, order) => sum + order.amountCents, 0),
    paidCount: paid.length,
    pendingCount: pending.length,
  };
}

export async function getCustomerBalances() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ customerId: orders.customerId, balanceCents: sql<number>`sum(case when ${orders.paymentStatus} = 'pending' then ${orders.amountCents} else 0 end)` })
    .from(orders)
    .groupBy(orders.customerId);
}

export async function listCouriers(): Promise<Courier[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(couriers).orderBy(couriers.status, couriers.fullName);
}

export async function createCourier(input: Omit<InsertCourier, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const inserted = await db.insert(couriers).values(input);
  const result = await db.select().from(couriers).where(eq(couriers.id, Number(inserted[0].insertId))).limit(1);
  return result[0];
}

export async function updateCourier(id: number, input: Partial<Pick<InsertCourier, "fullName" | "phone" | "vehicle" | "status" | "notes">>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(couriers).set(input).where(eq(couriers.id, id));
  const result = await db.select().from(couriers).where(eq(couriers.id, id)).limit(1);
  return result[0];
}

export async function listRouteRuns(input: { from?: number; to?: number; kind?: (typeof routeKind)[number] } = {}) {
  const db = await getDb();
  if (!db) return [];
  const filters = [
    input.from !== undefined ? sql`${routeRuns.routeDate} >= ${input.from}` : undefined,
    input.to !== undefined ? sql`${routeRuns.routeDate} <= ${input.to}` : undefined,
    input.kind ? eq(routeRuns.kind, input.kind) : undefined,
  ].filter(Boolean);
  return db.select({ route: routeRuns, courier: couriers }).from(routeRuns).leftJoin(couriers, eq(routeRuns.courierId, couriers.id)).where(filters.length ? and(...filters) : undefined).orderBy(routeRuns.routeDate);
}

export async function createRouteRun(input: Omit<InsertRouteRun, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const inserted = await db.insert(routeRuns).values(input);
  const result = await db.select().from(routeRuns).where(eq(routeRuns.id, Number(inserted[0].insertId))).limit(1);
  return result[0];
}

export async function updateRouteRun(id: number, input: Partial<Pick<InsertRouteRun, "routeDate" | "kind" | "zone" | "status" | "courierId" | "notes">>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(routeRuns).set(input).where(eq(routeRuns.id, id));
  const result = await db.select().from(routeRuns).where(eq(routeRuns.id, id)).limit(1);
  return result[0];
}

export async function upsertOrderAssignment(input: Omit<InsertOrderAssignment, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(orderAssignments).values(input).onDuplicateKeyUpdate({ set: {
    routeId: input.routeId ?? null,
    courierId: input.courierId ?? null,
    scheduledAt: input.scheduledAt,
    timeWindow: input.timeWindow ?? null,
    address: input.address,
    status: input.status ?? "scheduled",
    notes: input.notes ?? null,
  }});
  const result = await db.select().from(orderAssignments).where(and(eq(orderAssignments.orderId, input.orderId), eq(orderAssignments.kind, input.kind))).limit(1);
  return result[0];
}

export async function updateAssignmentStatus(id: number, status: (typeof assignmentStatus)[number]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(orderAssignments).set({ status }).where(eq(orderAssignments.id, id));
  const result = await db.select().from(orderAssignments).where(eq(orderAssignments.id, id)).limit(1);
  return result[0];
}

export async function listOperationalCalendar(input: { from?: number; to?: number; kind?: (typeof routeKind)[number] } = {}) {
  const db = await getDb();
  if (!db) return [];
  const filters = [
    input.from !== undefined ? sql`${orderAssignments.scheduledAt} >= ${input.from}` : undefined,
    input.to !== undefined ? sql`${orderAssignments.scheduledAt} <= ${input.to}` : undefined,
    input.kind ? eq(orderAssignments.kind, input.kind) : undefined,
  ].filter(Boolean);
  return db.select({ assignment: orderAssignments, order: orders, customer: customers, courier: couriers, route: routeRuns })
    .from(orderAssignments)
    .leftJoin(orders, eq(orderAssignments.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(couriers, eq(orderAssignments.courierId, couriers.id))
    .leftJoin(routeRuns, eq(orderAssignments.routeId, routeRuns.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(orderAssignments.scheduledAt);
}
