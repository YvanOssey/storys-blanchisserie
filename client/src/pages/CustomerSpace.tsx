import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronRight, LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/QueryState";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CustomerNotificationBell from "@/components/CustomerNotificationBell";
import { formatDate, formatCurrency, getCustomerNextStep } from "@/lib/laundry";
import { CONTACT_PHONE, PageLoader, SiteHeader, StatusBadge, StatusTrack, WHATSAPP_URL } from "@/components/Brand";

export default function CustomerSpace() {
  const [, navigate] = useLocation();
  const profile = trpc.customer.profile.useQuery();
  const orders = trpc.customer.orders.useQuery();
  const logout = trpc.customerAuth.logout.useMutation({ onSuccess: () => { toast.success("Vous êtes déconnecté."); navigate("/"); } });
  if (profile.isLoading || orders.isLoading) return <PageLoader label="Ouverture de votre espace…" />;
  if (profile.isError || orders.isError) return <div className="min-h-screen bg-paper"><SiteHeader /><div className="mx-auto max-w-xl px-5 py-16"><QueryError onRetry={() => { void profile.refetch(); void orders.refetch(); }} message="Votre session client a expiré ou n’a pas pu être chargée." /><div className="mt-6 text-center"><Link href="/connexion" className="font-bold text-forest underline decoration-gold decoration-2 underline-offset-4">Se connecter à nouveau</Link></div></div></div>;
  const customer = profile.data;
  const customerOrders = orders.data ?? [];
  const inProgress = customerOrders.filter(order => order.status !== "delivered");
  const stats = [
    { label: "Commandes", value: customerOrders.length },
    { label: "En traitement", value: customerOrders.filter(order => ["received", "washing"].includes(order.status)).length },
    { label: "Livrées", value: customerOrders.filter(order => order.status === "delivered").length },
  ];

  return <div className="min-h-screen bg-paper text-ink">
    <SiteHeader actions={<>
      <CustomerNotificationBell />
      <Button variant="ghost" onClick={() => logout.mutate()} className="h-9 text-paper hover:bg-paper/10 hover:text-gold-bright"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Déconnexion</span></Button>
    </>} />
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 md:pt-14">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-gold">Espace personnel</p>
          <h1 className="mt-4 display-lg">Bonjour <span className="accent-word">{customer?.fullName?.split(" ")[0] || "à vous"}.</span></h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">{inProgress.length ? `${inProgress.length} commande${inProgress.length > 1 ? "s" : ""} en cours chez Story’s.` : "Retrouvez vos demandes et l’avancement de votre linge au même endroit."}</p>
        </div>
        <Button asChild className="h-12 rounded-full bg-forest px-6 font-bold text-white hover:bg-forest-deep"><Link href="/commander">Nouvelle commande <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>

      <dl className="mt-10 grid grid-cols-3 border-y border-line">{stats.map((stat, index) => <div key={stat.label} className={`py-5 ${index ? "border-l border-line pl-4 sm:pl-8" : ""}`}><dt className="text-xs text-ink-muted">{stat.label}</dt><dd className="mt-1 figure text-5xl text-forest tabular">{stat.value}</dd></div>)}</dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="flex items-baseline justify-between gap-4"><h2 className="display-md">Mes commandes</h2><span className="text-sm text-ink-faint tabular">{customerOrders.length}</span></div>
          {customerOrders.length ? <ul className="mt-6 space-y-4">{customerOrders.map(order => <li key={order.id}>
            <Link href={`/mon-espace/commandes/${order.id}`} className="card-interactive group block border border-line bg-paper p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-display text-xl text-ink">{order.orderNumber}</p><p className="mt-1 text-xs text-ink-muted">{order.service} · Collecte {formatDate(order.pickupAt)}</p></div>
                <div className="flex items-center gap-3"><span className="text-sm font-bold text-ink tabular">{formatCurrency(order.amountCents)}</span><StatusBadge status={order.status} /></div>
              </div>
              <div className="mt-6"><StatusTrack status={order.status} size="sm" /></div>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs"><p className="text-ink-muted">Prochaine étape : <span className="font-semibold text-forest">{getCustomerNextStep(order.status)}</span></p><ChevronRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-forest" /></div>
            </Link>
          </li>)}</ul> : <div className="mt-6 rounded-none border border-dashed border-line-strong px-6 py-16 text-center"><Package className="mx-auto h-7 w-7 text-gold" /><p className="mt-4 font-display text-xl text-ink">Aucune commande pour l’instant</p><p className="mt-2 text-sm text-ink-muted">Votre première commande apparaîtra ici, avec son suivi.</p><Button asChild className="mt-6 h-11 rounded-full bg-forest text-white hover:bg-forest-deep"><Link href="/commander">Passer une commande</Link></Button></div>}
        </section>

        <aside className="space-y-8">
          <div>
            <p className="eyebrow text-gold">Mes informations</p>
            <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
              <div className="py-3"><dt className="text-xs text-ink-faint">Nom</dt><dd className="mt-0.5 font-semibold">{customer?.fullName}</dd></div>
              <div className="py-3"><dt className="text-xs text-ink-faint">E-mail</dt><dd className="mt-0.5 break-words font-semibold">{customer?.email || "Non renseigné"}</dd></div>
              <div className="py-3"><dt className="text-xs text-ink-faint">Client depuis</dt><dd className="mt-0.5 font-semibold">{customer?.createdAt ? formatDate(customer.createdAt, { day: "numeric", month: "long", year: "numeric" }) : "aujourd’hui"}</dd></div>
            </dl>
          </div>
          <div className="band-forest rounded-none p-6 text-white"><p className="eyebrow text-gold-bright">Besoin d’aide ?</p><p className="mt-3 font-display text-xl">L’atelier vous répond.</p><a href={WHATSAPP_URL} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gold-bright hover:text-white">{CONTACT_PHONE} <ArrowRight className="h-4 w-4" /></a></div>
        </aside>
      </div>
    </main>
  </div>;
}
