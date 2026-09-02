export const statusLabels = {
  to_collect: "À collecter",
  received: "Reçu",
  washing: "En lavage",
  ready: "Prêt",
  in_delivery: "En livraison",
  delivered: "Livré",
} as const;

export const statusStyles = {
  to_collect: "bg-[#fff5df] text-[#9a6b22] border-[#f1d497]",
  received: "bg-[#edf3f8] text-[#46647d] border-[#cadbe8]",
  washing: "bg-[#eeeafa] text-[#6657a5] border-[#d8d0f2]",
  ready: "bg-[#e8f6ef] text-[#367957] border-[#c3e5d2]",
  in_delivery: "bg-[#e8f1ff] text-[#3d68a5] border-[#c8daf6]",
  delivered: "bg-[#eef0ed] text-[#5a6d62] border-[#d6ddd8]",
} as const;

export const paymentLabels = {
  pending: "En attente",
  paid: "Payé",
} as const;

export const paymentMethodLabels = {
  cash: "Espèces",
  card: "Carte",
  transfer: "Virement",
  mobile: "Mobile money",
} as const;

export const services = [
  "Essentiel",
  "Confort",
  "Prestige",
  "Nettoyage & lustrage de chaussures",
] as const;

export const customerStatusSteps = [{ key: "to_collect", label: "À collecter" }, { key: "received", label: "Reçu" }, { key: "washing", label: "En lavage" }, { key: "ready", label: "Prêt" }, { key: "in_delivery", label: "En livraison" }, { key: "delivered", label: "Livré" }] as const;

export function getCustomerNextStep(status: string) { const steps: Record<string, string> = { to_collect: "collecte à votre domicile", received: "mise en lavage", washing: "préparation et séchage", ready: "livraison", in_delivery: "remise de votre linge", delivered: "aucune, commande terminée" }; return steps[status] || "confirmation par l’atelier"; }

export function getCustomerTrackingPath(isAuthenticated: boolean) { return isAuthenticated ? "/mon-espace" : "/connexion"; }

export const publicOffers = [
  { name: "Essentiel", priceCents: 15000, features: ["Récupération et livraison", "02 passages par mois", "Lavage uniquement", "Literie non incluse"] },
  { name: "Confort", priceCents: 25000, features: ["Récupération et livraison", "02 passages par mois", "Lavage et repassage", "Literie non incluse"] },
  { name: "Prestige", priceCents: 35000, features: ["Récupération et livraison", "02 passages par mois", "Lavage et repassage", "Literie incluse"] },
] as const;

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(value: Date | number | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", options ?? { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

export function formatDateTime(value: Date | number | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date).replace(".", "");
}

export function initials(name: string) {
  return name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}
