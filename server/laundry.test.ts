import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./customerAuth";

const dbMock = vi.hoisted(() => ({
  listCustomers: vi.fn(),
  getCustomer: vi.fn(),
  getCustomerOrder: vi.fn(),
  listCustomerNotifications: vi.fn(),
  markCustomerNotificationRead: vi.fn(),
  deleteCustomerNotification: vi.fn(),
  createCustomer: vi.fn(),
  createCustomerAccount: vi.fn(),
  createCustomerOrder: vi.fn(),
  getCustomerAccountByEmail: vi.fn(),
  getCustomerAccountByCustomerId: vi.fn(),
  getCustomerByPhone: vi.fn(),
  createWebsiteOrder: vi.fn(),
  trackWebsiteOrder: vi.fn(),
  listOrders: vi.fn(),
  createOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  updateOrderPayment: vi.fn(),
  getDashboardMetrics: vi.fn(),
  getPaymentSummary: vi.fn(),
  getEffectiveUserRole: vi.fn(async (user: AuthenticatedUser) => user.role),
  isAdminEmailWhitelisted: vi.fn(async () => false),
  listAdminWhitelistEntries: vi.fn(),
  addAdminWhitelistEntry: vi.fn(),
  removeAdminWhitelistEntry: vi.fn(),
  getAdminAccountByEmail: vi.fn(),
  getAdminAccountById: vi.fn(),
  createAdminAccount: vi.fn(),
  touchAdminAccount: vi.fn(),
  listCouriers: vi.fn(),
  createCourier: vi.fn(),
  updateCourier: vi.fn(),
  listRouteRuns: vi.fn(),
  createRouteRun: vi.fn(),
  updateRouteRun: vi.fn(),
  listCustomerOrderAssignments: vi.fn(),
  listAdminNotifications: vi.fn(),
  markAdminNotificationRead: vi.fn(),
  deleteAdminNotification: vi.fn(),
  updateAssignmentStatus: vi.fn(),
  upsertOrderAssignment: vi.fn(),
  listOperationalCalendar: vi.fn(),
}));

vi.mock("./db", () => dbMock);

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser, customer: TrpcContext["customer"] = null): TrpcContext {
  return {
    user,
    customer,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined, cookie: () => undefined } as TrpcContext["res"],
  };
}

const sampleUser: AuthenticatedUser = {
  id: 1,
  openId: "laundry-owner",
  email: "owner@example.com",
  name: "Atelier Linge",
  loginMethod: "manus",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const sampleOrder = {
  id: 8,
  orderNumber: "LINGE-ABC123",
  customerId: 4,
  service: "Lavage & pliage",
  itemCount: 12,
  weightKg: null,
  instructions: null,
  status: "to_collect" as const,
  pickupAt: null,
  deliveryAt: null,
  amountCents: 2400,
  paymentMethod: "card" as const,
  paymentStatus: "pending" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("laundry procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the current user through the public auth procedure", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.auth.me()).resolves.toMatchObject({ openId: "laundry-owner", role: "admin" });
  });

  it("logs in a whitelisted admin account with a dedicated session cookie", async () => {
    const passwordHash = hashPassword("secure-pass-123");
    dbMock.isAdminEmailWhitelisted.mockResolvedValueOnce(true);
    dbMock.getAdminAccountByEmail.mockResolvedValueOnce({ id: 9, email: "admin@example.com", passwordHash, displayName: "Admin Story’s", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null });
    dbMock.touchAdminAccount.mockResolvedValueOnce({ id: 9, email: "admin@example.com", passwordHash, displayName: "Admin Story’s", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() });
    const response = { cookies: [] as unknown[], cookie: vi.fn(), clearCookie: vi.fn() };
    const caller = appRouter.createCaller({ ...createContext(), res: response as unknown as TrpcContext["res"] });
    await expect(caller.adminAuth.login({ email: "admin@example.com", password: "secure-pass-123" })).resolves.toMatchObject({ account: { email: "admin@example.com" } });
    expect(response.cookie).toHaveBeenCalledWith("storys_admin_session", expect.any(String), expect.objectContaining({ httpOnly: true }));
  });

  it("clears the dedicated admin session cookie on logout", async () => {
    const response = { cookies: [] as unknown[], cookie: vi.fn(), clearCookie: vi.fn() };
    const caller = appRouter.createCaller({ ...createContext(), res: response as unknown as TrpcContext["res"] });
    await expect(caller.adminAuth.logout()).resolves.toEqual({ success: true });
    expect(response.clearCookie).toHaveBeenCalledWith("storys_admin_session", expect.objectContaining({ httpOnly: true, maxAge: -1 }));
  });

  it("refuses a dedicated admin login when the email is not whitelisted", async () => {
    dbMock.isAdminEmailWhitelisted.mockResolvedValueOnce(false);
    const caller = appRouter.createCaller(createContext());
    await expect(caller.adminAuth.login({ email: "blocked@example.com", password: "secure-pass-123" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMock.getAdminAccountByEmail).not.toHaveBeenCalled();
  });

  it("revokes a whitelisted admin and refuses a later dedicated login", async () => {
    dbMock.removeAdminWhitelistEntry.mockResolvedValueOnce({ id: 7, email: "revoked@example.com", addedByOpenId: sampleUser.openId, createdAt: new Date() });
    const adminCaller = appRouter.createCaller(createContext(sampleUser));
    await expect(adminCaller.adminWhitelist.remove({ id: 7 })).resolves.toMatchObject({ id: 7 });
    dbMock.isAdminEmailWhitelisted.mockResolvedValueOnce(false);
    const publicCaller = appRouter.createCaller(createContext());
    await expect(publicCaller.adminAuth.login({ email: "revoked@example.com", password: "secure-pass-123" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("protects operational planning from unauthenticated and non-admin users", async () => {
    const visitorCaller = appRouter.createCaller(createContext());
    await expect(visitorCaller.operations.couriers()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(visitorCaller.operations.calendar({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const clientUser: AuthenticatedUser = { ...sampleUser, id: 4, openId: "client-planner", email: "client-planner@example.com", role: "user" };
    const clientCaller = appRouter.createCaller(createContext(clientUser));
    await expect(clientCaller.operations.routes({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admins to create a courier, a route and an order assignment", async () => {
    dbMock.createCourier.mockResolvedValueOnce({ id: 3, fullName: "Ibrahim Koné", phone: "+2250700000000", vehicle: "Moto", status: "active", notes: null, createdAt: new Date(), updatedAt: new Date() });
    dbMock.createRouteRun.mockResolvedValueOnce({ id: 5, routeDate: Date.now(), kind: "pickup", zone: "Riviera", status: "planned", courierId: 3, notes: null, createdAt: new Date(), updatedAt: new Date() });
    dbMock.upsertOrderAssignment.mockResolvedValueOnce({ id: 8, orderId: sampleOrder.id, kind: "pickup", routeId: 5, courierId: 3, scheduledAt: Date.now(), timeWindow: "09:00-11:00", address: "Riviera", status: "scheduled", notes: null, createdAt: new Date(), updatedAt: new Date() });
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.operations.createCourier({ fullName: "Ibrahim Koné", phone: "+2250700000000", vehicle: "Moto" })).resolves.toMatchObject({ id: 3 });
    await expect(caller.operations.createRoute({ routeDate: Date.now(), kind: "pickup", zone: "Riviera" })).resolves.toMatchObject({ id: 5 });
    await expect(caller.operations.assign({ orderId: sampleOrder.id, kind: "pickup", scheduledAt: Date.now(), address: "Riviera", courierId: 3, routeId: 5 })).resolves.toMatchObject({ id: 8 });
    expect(dbMock.createCourier).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Ibrahim Koné" }));
    expect(dbMock.upsertOrderAssignment).toHaveBeenCalledWith(expect.objectContaining({ orderId: sampleOrder.id, kind: "pickup" }));
  });

  it("protects admin order notifications and marks them as read", async () => {
    const visitorCaller = appRouter.createCaller(createContext());
    await expect(visitorCaller.adminNotifications.list({ unreadOnly: true })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    dbMock.listAdminNotifications.mockResolvedValueOnce([{ id: 1, orderId: sampleOrder.id, title: "Nouvelle commande reçue", message: "LINGE-ABC123 est prête à être organisée pour la collecte.", readAt: null, createdAt: new Date() }]);
    dbMock.markAdminNotificationRead.mockResolvedValueOnce({ id: 1, orderId: sampleOrder.id, title: "Nouvelle commande reçue", message: "LINGE-ABC123 est prête à être organisée pour la collecte.", readAt: new Date(), createdAt: new Date() });
    dbMock.deleteAdminNotification.mockResolvedValueOnce({ id: 1, orderId: sampleOrder.id, title: "Nouvelle commande reçue", message: "LINGE-ABC123 est prête à être organisée pour la collecte.", readAt: new Date(), createdAt: new Date() });
    const adminCaller = appRouter.createCaller(createContext(sampleUser));
    await expect(adminCaller.adminNotifications.list({ unreadOnly: true, limit: 6 })).resolves.toHaveLength(1);
    await expect(adminCaller.adminNotifications.markRead({ id: 1 })).resolves.toMatchObject({ id: 1, readAt: expect.any(Date) });
    await expect(adminCaller.adminNotifications.remove({ id: 1 })).resolves.toMatchObject({ id: 1 });
    expect(dbMock.listAdminNotifications).toHaveBeenCalledWith({ unreadOnly: true, limit: 6 });
    expect(dbMock.markAdminNotificationRead).toHaveBeenCalledWith(1);
    expect(dbMock.deleteAdminNotification).toHaveBeenCalledWith(1);
  });

  it("protects dashboard metrics from unauthenticated access", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.dashboard.metrics()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects authenticated non-admin users from admin procedures", async () => {
    const clientUser: AuthenticatedUser = { ...sampleUser, id: 2, openId: "client-user", email: "client@example.com", role: "user" };
    const caller = appRouter.createCaller(createContext(clientUser));
    await expect(caller.dashboard.metrics()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.orders.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.payments.summary()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a whitelisted email to manage the admin whitelist", async () => {
    dbMock.getEffectiveUserRole.mockResolvedValueOnce("admin");
    dbMock.listAdminWhitelistEntries.mockResolvedValueOnce([{ id: 1, email: "team@example.com", addedByOpenId: sampleUser.openId, createdAt: new Date() }]);
    dbMock.addAdminWhitelistEntry.mockResolvedValueOnce({ id: 2, email: "new@example.com", addedByOpenId: sampleUser.openId, createdAt: new Date() });
    dbMock.getAdminAccountByEmail.mockResolvedValueOnce(undefined);
    dbMock.createAdminAccount.mockResolvedValueOnce({ id: 2, email: "new@example.com", displayName: "Nouvel admin", passwordHash: "hash", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null });
    dbMock.removeAdminWhitelistEntry.mockResolvedValueOnce({ id: 2, email: "new@example.com", addedByOpenId: sampleUser.openId, createdAt: new Date() });
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.adminWhitelist.list()).resolves.toHaveLength(1);
    await expect(caller.adminWhitelist.add({ email: "NEW@example.com", password: "secure-pass-123", displayName: "Nouvel admin" })).resolves.toMatchObject({ email: "new@example.com" });
    await expect(caller.adminWhitelist.remove({ id: 2 })).resolves.toMatchObject({ id: 2 });
    expect(dbMock.addAdminWhitelistEntry).toHaveBeenCalledWith("NEW@example.com", sampleUser.openId);
    expect(dbMock.removeAdminWhitelistEntry).toHaveBeenCalledWith(2);

    dbMock.getEffectiveUserRole.mockResolvedValueOnce("user");
    const clientUser: AuthenticatedUser = { ...sampleUser, id: 3, openId: "client-user", email: "client@example.com", role: "user" };
    const clientCaller = appRouter.createCaller(createContext(clientUser));
    await expect(clientCaller.adminWhitelist.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("protects admin order procedures from public visitors", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.orders.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.payments.summary()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an order with an invalid amount before touching the database", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.orders.create({ customerId: 1, service: "Lavage & pliage", amountCents: -1, status: "to_collect", paymentStatus: "pending" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createOrder).not.toHaveBeenCalled();
  });

  it("rejects unknown operational statuses", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.orders.updateStatus({ id: 1, status: "unknown" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.updateOrderStatus).not.toHaveBeenCalled();
  });

  it("passes customer filters to the customer procedure", async () => {
    dbMock.listCustomers.mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.customers.list({ search: "Camille", city: "Paris", withBalance: true })).resolves.toEqual([]);
    expect(dbMock.listCustomers).toHaveBeenCalledWith({ search: "Camille", city: "Paris", withBalance: true });
  });

  it("creates an order through the protected procedure", async () => {
    dbMock.createOrder.mockResolvedValueOnce(sampleOrder);
    const caller = appRouter.createCaller(createContext(sampleUser));
    const input = { customerId: 4, service: "Lavage & pliage", itemCount: 12, amountCents: 2400, status: "to_collect" as const, paymentStatus: "pending" as const, paymentMethod: "card" as const };
    await expect(caller.orders.create(input)).resolves.toEqual(sampleOrder);
    expect(dbMock.createOrder).toHaveBeenCalledWith(input);
  });

  it("accepts a connected customer order without a postal code", async () => {
    dbMock.createCustomerOrder.mockResolvedValueOnce(sampleOrder);
    const customerSession = { customer: { id: 4, fullName: "Camille Martin", phone: "0600000000", email: "camille@example.com", address: "12 rue des Lilas", city: "Paris" }, orders: [] } as TrpcContext["customer"];
    const caller = appRouter.createCaller(createContext(undefined, customerSession));
    const input = { service: "Essentiel", itemCount: 12, pickupAt: Date.now() + 86400000, deliveryAt: Date.now() + 172800000 };
    await expect(caller.customer.createOrder(input)).resolves.toEqual(sampleOrder);
    expect(dbMock.createCustomerOrder).toHaveBeenCalledWith(4, input);
  });

  it("updates a payment and returns the updated order", async () => {
    const paidOrder = { ...sampleOrder, paymentStatus: "paid" as const };
    dbMock.updateOrderPayment.mockResolvedValueOnce(paidOrder);
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.orders.updatePayment({ id: 8, paymentStatus: "paid", paymentMethod: "card" })).resolves.toEqual(paidOrder);
    expect(dbMock.updateOrderPayment).toHaveBeenCalledWith(8, { id: 8, paymentStatus: "paid", paymentMethod: "card" });
  });

  it("creates a customer through the protected procedure", async () => {
    const customer = { id: 4, fullName: "Camille Martin", phone: "0600000000", email: null, address: "12 rue des Lilas", city: "Paris", postalCode: "75011", notes: null, createdAt: new Date(), updatedAt: new Date() };
    dbMock.createCustomer.mockResolvedValueOnce(customer);
    const caller = appRouter.createCaller(createContext(sampleUser));
    const input = { fullName: "Camille Martin", phone: "0600000000", email: "", address: "12 rue des Lilas", city: "Paris", postalCode: "75011", notes: "" };
    await expect(caller.customers.create(input)).resolves.toEqual(customer);
    expect(dbMock.createCustomer).toHaveBeenCalledWith({ ...input, email: null });
  });

  it("returns the payment summary through the protected procedure", async () => {
    const summary = { paidCents: 18000, pendingCents: 4200, paidCount: 6, pendingCount: 2 };
    dbMock.getPaymentSummary.mockResolvedValueOnce(summary);
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.payments.summary()).resolves.toEqual(summary);
    expect(dbMock.getPaymentSummary).toHaveBeenCalledOnce();
  });

  it("refuses a public order request without a client session", async () => {
    const caller = appRouter.createCaller(createContext());
    const input = { fullName: "Camille Martin", phone: "0600000000", email: "camille@example.com", address: "12 rue des Lilas", city: "Paris", service: "Lavage & pliage", itemCount: 12, pickupAt: Date.now() + 86400000, deliveryAt: Date.now() + 172800000 };
    await expect(caller.publicOrders.submit(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(dbMock.createWebsiteOrder).not.toHaveBeenCalled();
  });

  it("refuses client order creation without a client session", async () => {
    const caller = appRouter.createCaller(createContext());
    const input = { service: "Essentiel", itemCount: 12, pickupAt: Date.now() + 86400000, deliveryAt: Date.now() + 172800000 };
    await expect(caller.customer.createOrder(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(dbMock.createCustomerOrder).not.toHaveBeenCalled();
  });

  it("rejects a public request without quantity or weight", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.publicOrders.submit({ fullName: "Camille Martin", phone: "0600000000", address: "12 rue des Lilas", city: "Paris", postalCode: "75011", service: "Lavage & pliage", pickupAt: Date.now() + 86400000, deliveryAt: Date.now() + 172800000 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createWebsiteOrder).not.toHaveBeenCalled();
  });

  it("protects the personal customer space from public visitors", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.customer.orders()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("protects order detail and notifications from public visitors", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.customer.orderDetail({ id: 8 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.notifications()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("protects and handles client notification actions", async () => {
    const visitorCaller = appRouter.createCaller(createContext());
    await expect(visitorCaller.customer.markNotificationRead({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(visitorCaller.customer.removeNotification({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    dbMock.markCustomerNotificationRead.mockResolvedValueOnce({ id: 1, customerId: 4, orderId: 8, status: "to_collect", title: "Commande enregistrée", message: "Votre demande est bien reçue.", readAt: new Date(), createdAt: new Date() });
    dbMock.deleteCustomerNotification.mockResolvedValueOnce({ id: 1, customerId: 4, orderId: 8, status: "to_collect", title: "Commande enregistrée", message: "Votre demande est bien reçue.", readAt: new Date(), createdAt: new Date() });
    const customerSession = { customer: { id: 4, fullName: "Camille Martin", phone: "0600000000", email: "camille@example.com", address: "12 rue des Lilas", city: "Paris" }, orders: [sampleOrder], balanceCents: sampleOrder.amountCents } as TrpcContext["customer"];
    const caller = appRouter.createCaller(createContext(undefined, customerSession));
    await expect(caller.customer.markNotificationRead({ id: 1 })).resolves.toMatchObject({ id: 1, customerId: 4 });
    await expect(caller.customer.removeNotification({ id: 1 })).resolves.toMatchObject({ id: 1, customerId: 4 });
    expect(dbMock.markCustomerNotificationRead).toHaveBeenCalledWith(4, 1);
    expect(dbMock.deleteCustomerNotification).toHaveBeenCalledWith(4, 1);
  });

  it("returns an order detail and notifications for the current customer", async () => {
    dbMock.getCustomerOrder.mockResolvedValueOnce(sampleOrder);
    const notifications = [{ id: 1, customerId: 4, orderId: 8, status: "to_collect", title: "Commande enregistrée", message: "Votre demande est bien reçue.", readAt: null, createdAt: new Date() }];
    dbMock.listCustomerNotifications.mockResolvedValueOnce(notifications);
    const customerSession = { customer: { id: 4, fullName: "Camille Martin", phone: "0600000000", email: "camille@example.com", address: "12 rue des Lilas", city: "Paris" }, orders: [sampleOrder], balanceCents: sampleOrder.amountCents } as TrpcContext["customer"];
    const caller = appRouter.createCaller(createContext(undefined, customerSession));
    await expect(caller.customer.orderDetail({ id: 8 })).resolves.toEqual(sampleOrder);
    await expect(caller.customer.notifications()).resolves.toEqual(notifications);
    expect(dbMock.getCustomerOrder).toHaveBeenCalledWith(4, 8);
    expect(dbMock.listCustomerNotifications).toHaveBeenCalledWith(4, {});
  });

  it("returns only the orders attached to the current customer session", async () => {
    const customerA = { id: 11, fullName: "Client A", phone: "+2250700000011", email: "a@example.com", address: "Cocody", city: "Abidjan", postalCode: "00225", notes: null, createdAt: new Date(), updatedAt: new Date() };
    const customerB = { id: 12, fullName: "Client B", phone: "+2250700000012", email: "b@example.com", address: "Marcory", city: "Abidjan", postalCode: "00225", notes: null, createdAt: new Date(), updatedAt: new Date() };
    const orderA = { ...sampleOrder, id: 21, customerId: 11, orderNumber: "STORY-A" };
    const orderB = { ...sampleOrder, id: 22, customerId: 12, orderNumber: "STORY-B" };
    const callerA = appRouter.createCaller(createContext(undefined, { customer: customerA, orders: [orderA], balanceCents: orderA.amountCents }));
    const callerB = appRouter.createCaller(createContext(undefined, { customer: customerB, orders: [orderB], balanceCents: orderB.amountCents }));
    await expect(callerA.customer.orders()).resolves.toEqual([orderA]);
    await expect(callerB.customer.orders()).resolves.toEqual([orderB]);
    await expect(callerA.customer.profile()).resolves.toMatchObject({ id: 11, email: "a@example.com" });
  });

  it("registers a customer account and sets a dedicated session cookie", async () => {
    const customer = { id: 9, fullName: "Awa Kouassi", phone: "+2250700000000", email: "awa@example.com", address: "Cocody Riviera M’Pouto", city: "Abidjan", postalCode: "00225", notes: null, createdAt: new Date(), updatedAt: new Date() };
    dbMock.getCustomerAccountByEmail.mockResolvedValueOnce(undefined);
    dbMock.getCustomerByPhone.mockResolvedValueOnce(undefined);
    dbMock.createCustomer.mockResolvedValueOnce(customer);
    dbMock.getCustomerAccountByCustomerId.mockResolvedValueOnce(undefined);
    dbMock.createCustomerAccount.mockResolvedValueOnce({ id: 1, customerId: 9, email: "awa@example.com", passwordHash: "hash", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null });
    const cookie = vi.fn();
    const caller = appRouter.createCaller({ ...createContext(), res: { clearCookie: vi.fn(), cookie } as TrpcContext["res"] });
    await expect(caller.customerAuth.register({ fullName: "Awa Kouassi", phone: "+2250700000000", email: "awa@example.com", password: "motdepassefort", address: "Cocody Riviera M’Pouto", city: "Abidjan", postalCode: "00225" })).resolves.toMatchObject({ customer });
    expect(cookie).toHaveBeenCalledOnce();
  });

  it("registers a customer account without a postal code", async () => {
    const customer = { id: 10, fullName: "Yvan Test", phone: "+2250700000010", email: "itsyvan135@gmail.com", address: "Cocody Riviera M’Pouto", city: "Abidjan", postalCode: null, notes: null, createdAt: new Date(), updatedAt: new Date() };
    dbMock.getCustomerAccountByEmail.mockResolvedValueOnce(undefined);
    dbMock.getCustomerByPhone.mockResolvedValueOnce(undefined);
    dbMock.createCustomer.mockResolvedValueOnce(customer);
    dbMock.getCustomerAccountByCustomerId.mockResolvedValueOnce(undefined);
    dbMock.createCustomerAccount.mockResolvedValueOnce({ id: 2, customerId: 10, email: "itsyvan135@gmail.com", passwordHash: "hash", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null });
    const cookie = vi.fn();
    const caller = appRouter.createCaller({ ...createContext(), res: { clearCookie: vi.fn(), cookie } as TrpcContext["res"] });
    await expect(caller.customerAuth.register({ fullName: "Yvan Test", phone: "+2250700000010", email: "itsyvan135@gmail.com", password: "motdepassefort", address: "Cocody Riviera M’Pouto", city: "Abidjan", postalCode: "" })).resolves.toMatchObject({ customer });
    expect(dbMock.createCustomer).toHaveBeenCalledWith({ fullName: "Yvan Test", phone: "+2250700000010", email: "itsyvan135@gmail.com", address: "Cocody Riviera M’Pouto", city: "Abidjan", postalCode: undefined, notes: "Compte créé depuis l’espace client Story’s." });
  });

  it("rejects a non-empty postal code shorter than three characters", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.customerAuth.register({ fullName: "Yvan Test", phone: "+2250700000010", email: "short-postal@example.com", password: "motdepassefort", address: "Cocody Riviera M’Pouto", city: "Abidjan", postalCode: "12" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createCustomer).not.toHaveBeenCalled();
  });

  it("logs in a customer with the stored password hash", async () => {
    const customer = { id: 9, fullName: "Awa Kouassi", phone: "+2250700000000", email: "awa@example.com", address: "Cocody Riviera M’Pouto", city: "Abidjan", postalCode: "00225", notes: null, createdAt: new Date(), updatedAt: new Date() };
    dbMock.getCustomerAccountByEmail.mockResolvedValueOnce({ id: 1, customerId: 9, email: "awa@example.com", passwordHash: hashPassword("motdepassefort"), createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null });
    dbMock.getCustomer.mockResolvedValueOnce({ customer, orders: [sampleOrder], balanceCents: sampleOrder.amountCents });
    const cookie = vi.fn();
    const caller = appRouter.createCaller({ ...createContext(), res: { clearCookie: vi.fn(), cookie } as TrpcContext["res"] });
    await expect(caller.customerAuth.login({ email: "awa@example.com", password: "motdepassefort" })).resolves.toMatchObject({ customer });
    expect(cookie).toHaveBeenCalledOnce();
  });
});
