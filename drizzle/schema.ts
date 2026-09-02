import {
  bigint,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const adminWhitelist = mysqlTable("adminWhitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  addedByOpenId: varchar("addedByOpenId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminWhitelistEntry = typeof adminWhitelist.$inferSelect;
export type InsertAdminWhitelistEntry = typeof adminWhitelist.$inferInsert;

export const adminAccounts = mysqlTable("adminAccounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  displayName: varchar("displayName", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  email: varchar("email", { length: 320 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 120 }),
  postalCode: varchar("postalCode", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export const customerAccounts = mysqlTable("customerAccounts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type CustomerAccount = typeof customerAccounts.$inferSelect;
export type InsertCustomerAccount = typeof customerAccounts.$inferInsert;

export const orderStatus = [
  "to_collect",
  "received",
  "washing",
  "ready",
  "in_delivery",
  "delivered",
] as const;

export const paymentStatus = ["pending", "paid"] as const;
export const paymentMethods = ["cash", "card", "transfer", "mobile"] as const;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  service: varchar("service", { length: 160 }).notNull(),
  itemCount: int("itemCount"),
  weightKg: varchar("weightKg", { length: 20 }),
  instructions: text("instructions"),
  status: mysqlEnum("status", orderStatus).default("to_collect").notNull(),
  pickupAt: bigint("pickupAt", { mode: "number" }),
  deliveryAt: bigint("deliveryAt", { mode: "number" }),
  amountCents: int("amountCents").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", paymentMethods),
  paymentStatus: mysqlEnum("paymentStatus", paymentStatus).default("pending").notNull(),
  source: mysqlEnum("source", ["backoffice", "website"]).default("backoffice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const courierStatus = ["active", "inactive"] as const;
export const routeKind = ["pickup", "delivery"] as const;
export const routeStatus = ["planned", "in_progress", "completed", "cancelled"] as const;
export const assignmentStatus = ["scheduled", "confirmed", "in_progress", "completed", "cancelled"] as const;

export const couriers = mysqlTable("couriers", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  vehicle: varchar("vehicle", { length: 120 }),
  status: mysqlEnum("status", courierStatus).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Courier = typeof couriers.$inferSelect;
export type InsertCourier = typeof couriers.$inferInsert;

export const routeRuns = mysqlTable("routeRuns", {
  id: int("id").autoincrement().primaryKey(),
  routeDate: bigint("routeDate", { mode: "number" }).notNull(),
  kind: mysqlEnum("kind", routeKind).notNull(),
  zone: varchar("zone", { length: 120 }),
  status: mysqlEnum("status", routeStatus).default("planned").notNull(),
  courierId: int("courierId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RouteRun = typeof routeRuns.$inferSelect;
export type InsertRouteRun = typeof routeRuns.$inferInsert;

export const orderAssignments = mysqlTable("orderAssignments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  kind: mysqlEnum("kind", routeKind).notNull(),
  routeId: int("routeId"),
  courierId: int("courierId"),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  timeWindow: varchar("timeWindow", { length: 80 }),
  address: text("address").notNull(),
  status: mysqlEnum("status", assignmentStatus).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  orderOperationUnique: unique("orderOperationUnique").on(table.orderId, table.kind),
}));

export type OrderAssignment = typeof orderAssignments.$inferSelect;
export type InsertOrderAssignment = typeof orderAssignments.$inferInsert;

export const customerNotifications = mysqlTable("customerNotifications", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  orderId: int("orderId").notNull(),
  status: mysqlEnum("status", orderStatus).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsertCustomerNotification = typeof customerNotifications.$inferInsert;

export const adminNotifications = mysqlTable("adminNotifications", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId"),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

