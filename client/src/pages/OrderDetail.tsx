import { Link, useParams } from "wouter";
import { CalendarDays, Clock3, MapPin, MessageCircle } from "lucide-react";
import { QueryError } from "@/components/QueryState";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, getCustomerNextStep } from "@/lib/laundry";
import { CONTACT_PHONE, PageLoader, SiteHeader, StatusBadge, StatusTrack, WHATSAPP_URL } from "@/components/Brand";

const assignmentLabels: Record<string, string> = { confirmed: "Confirmé", scheduled: "Planifié", completed: "Terminé" };

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const order = trpc.customer.orderDetail.useQuery({ id: orderId }, { enabled: Number.isInteger(orderId) && orderId > 0 });
  const operations = trpc.customer.orderOperations.useQuery({ orderId }, { enabled: Number.isInteger(orderId) && orderId > 0 });
  if (order.isLoading) return <PageLoader label="Ouverture de votre commande…" />;
  if (order.isError || !order.data) return <div className="min-h-screen bg-paper"><SiteHeader back={{ href: "/mon-espace", label: "Mes commandes" }} /><div className="mx-auto max-w-xl px-5 py-16"><QueryError message="Cette commande n’est pas disponible dans votre espace." onRetry={() => void order.refetch()} /></div></div>;
  const item = order.data;
  const details = [
    { label: "Prestation", value: item.service },
    { label: "Montant", value: formatCurrency(item.amountCents) },
    { label: "Volume", value: item.itemCount ? `${item.itemCount} pièce${item.itemCount === 1 ? "" : "s"}` : item.weightKg ? `${item.weightKg} kg estimés` : "À préciser" },
    { label: "Collecte", value: formatDate(item.pickupAt, { weekday: "short", day: "numeric", month: "long" }) },
    { label: "Livraison", value: formatDate(item.deliveryAt, { weekday: "short", day: "numeric", month: "long" }) },
  ];

  return <div className="min-h-screen bg-paper text-ink">
    <SiteHeader back={{ href: "/mon-espace", label: "Mes commandes" }} />
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8 md:pt-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-gold">Commande du {formatDate(item.createdAt, { day: "numeric", month: "long", year: "numeric" })}</p><h1 className="mt-4 display-lg tabular">{item.orderNumber}</h1></div>
        <StatusBadge status={item.status} className="w-fit text-xs" />
      </div>

      <section className="mt-10 rounded-none border border-line bg-card px-5 py-8 sm:px-10">
        <StatusTrack status={item.status} />
        <p className="mt-8 border-t border-line pt-5 text-center text-sm text-ink-muted">Prochaine étape : <span className="font-semibold text-forest">{getCustomerNextStep(item.status)}</span></p>
      </section>

      {operations.data?.length ? <section className="mt-12">
        <p className="eyebrow text-gold">Organisation confirmée</p><h2 className="mt-3 display-md">Vos prochains créneaux</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{operations.data.map(operation => <div key={operation.assignment.id} className="rounded-none border border-line bg-card p-5">
          <div className="flex items-center justify-between gap-3"><p className="font-display text-xl">{operation.assignment.kind === "pickup" ? "Collecte" : "Livraison"}</p><span className="rounded-full border border-gold/40 bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-warning">{assignmentLabels[operation.assignment.status] ?? "En cours"}</span></div>
          <div className="mt-4 space-y-2 text-sm"><p className="flex items-center gap-2 font-semibold first-letter:uppercase"><CalendarDays className="h-4 w-4 text-gold" />{formatDate(operation.assignment.scheduledAt, { weekday: "long", day: "numeric", month: "long" })}</p><p className="flex items-center gap-2 text-ink-muted"><Clock3 className="h-4 w-4 text-gold" />{new Date(operation.assignment.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p><p className="flex items-start gap-2 text-ink-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{operation.assignment.address}</p></div>
          {operation.courier && <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">Livreur : <span className="font-semibold text-ink">{operation.courier.fullName}</span></p>}
        </div>)}</div>
      </section> : null}

      <section className="mt-12 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="display-md">Informations</h2>
          <dl className="mt-5 divide-y divide-line border-y border-line">{details.map(detail => <div key={detail.label} className="flex items-baseline justify-between gap-4 py-4"><dt className="text-sm text-ink-muted">{detail.label}</dt><dd className="text-right text-sm font-semibold tabular">{detail.value}</dd></div>)}</dl>
          {item.instructions && <p className="mt-6 rounded-none bg-linen/70 p-4 text-sm leading-6 text-ink-muted"><strong className="text-ink">Consignes :</strong> {item.instructions}</p>}
        </div>
        <aside className="band-forest h-fit rounded-none p-7 text-white"><p className="eyebrow text-gold-bright">Besoin d’aide ?</p><h2 className="mt-3 font-display text-2xl">Nous restons disponibles.</h2><p className="mt-3 text-sm leading-6 text-white/65">Story’s vous confirme le tarif et le créneau par téléphone ou WhatsApp. Délai indicatif : 72 heures.</p><a href={WHATSAPP_URL} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gold-bright px-4 text-sm font-bold text-forest-deep hover:bg-white"><MessageCircle className="h-4 w-4" />{CONTACT_PHONE}</a></aside>
      </section>
      <p className="mt-12 text-center"><Link href="/mon-espace" className="text-sm font-bold text-forest underline decoration-gold decoration-2 underline-offset-4">Retour à mes commandes</Link></p>
    </main>
  </div>;
}
