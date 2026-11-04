export const statusLabels = {
  to_collect: "À collecter",
  received: "Reçu",
  washing: "En lavage",
  ready: "Prêt",
  in_delivery: "En livraison",
  delivered: "Livré",
} as const;

export const statusStyles = {
  to_collect: "bg-[#fbf0d9] text-[#8a5f17] border-[#ecd5a2]",
  received: "bg-[#e9f0f0] text-[#3f6463] border-[#c9dbda]",
  washing: "bg-[#e6eff5] text-[#2f5f7f] border-[#c4d9e8]",
  ready: "bg-[#e4f2ea] text-[#2f7a55] border-[#bfe0cd]",
  in_delivery: "bg-[#efe9f6] text-[#5d4f8a] border-[#d9cfec]",
  delivered: "bg-[#efece4] text-[#5c6f6b] border-[#dcd6c8]",
} as const;

export const statusDots = {
  to_collect: "#c99a3c",
  received: "#5f8f8d",
  washing: "#4f86ad",
  ready: "#3f9a6c",
  in_delivery: "#7d6db0",
  delivered: "#9aa5a1",
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
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount).replace(/\u202f/g, "\u00a0");
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
