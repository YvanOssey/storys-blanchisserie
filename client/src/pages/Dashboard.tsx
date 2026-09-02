import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryError } from "@/components/QueryState";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime, initials, statusLabels, statusStyles } from "@/lib/laundry";
import { ArrowUpRight, CalendarDays, ChevronRight, CircleCheck, Clock3, Droplets, PackageCheck, Plus, Sparkles, Truck, WalletCards } from "lucide-react";
import { Link } from "wouter";

const kpis = [
  { key: "ordersToday", label: "Commandes du jour", icon: PackageCheck, tone: "bg-[#fff5df] text-[#a17129]", helper: "créées aujourd’hui" },
  { key: "inTreatment", label: "Linge en traitement", icon: Droplets, tone: "bg-[#eeeafa] text-[#6758a4]", helper: "reçu ou en lavage" },
  { key: "deliveriesDue", label: "Livraisons à effectuer", icon: Truck, tone: "bg-[#e8f1ff] text-[#3d68a5]", helper: "prêtes à partir" },
  { key: "paymentsPending", label: "Paiements en attente", icon: WalletCards, tone: "bg-[#f9e9e6] text-[#b05a49]", helper: "commandes à solder" },
] as const;

export default function Dashboard() {
  const { user } = useAuth();
  const metrics = trpc.dashboard.metrics.useQuery();
  const orders = trpc.orders.list.useQuery({});
  const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const firstName = user?.name?.split(" ")[0] || "bienvenue";

  if (metrics.isError) {
    return <div className="mx-auto max-w-[1440px] space-y-7"><header><p className="eyebrow text-[#b3863d]">Vue d’ensemble</p><h1 className="mt-2 font-display text-4xl tracking-tight text-[#102033]">Bonjour, {firstName}.</h1></header><QueryError onRetry={() => void metrics.refetch()} message="Le tableau de bord n’a pas pu récupérer les chiffres de Story’s." /></div>;
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-[#b3863d]">{dateLabel}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102033] sm:text-5xl">Bonjour, {firstName}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#647180]">Voici le rythme de Story’s aujourd’hui. Un aperçu clair pour garder chaque commande dans le bon tempo.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-xl border-[#102033]/15 bg-white text-[#102033] hover:bg-[#102033]/5" asChild>
            <Link href="/admin/planning"><CalendarDays className="mr-2 h-4 w-4" />Voir le planning</Link>
          </Button>
          <Button className="rounded-xl bg-[#102033] text-white shadow-lg shadow-[#102033]/15 hover:bg-[#1c344f]" asChild>
            <Link href="/admin/orders?new=1"><Plus className="mr-2 h-4 w-4" />Nouvelle commande</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
        {kpis.map(item => {
          const Icon = item.icon;
          const value = metrics.data?.[item.key] ?? 0;
          const previousValue = metrics.data?.previous?.[item.key] ?? 0;
          const trend = trendLabel(value, previousValue);
          return (
            <Card key={item.key} className="soft-card rounded-2xl border-0 bg-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}><Icon className="h-5 w-5" /></div>
                  <ArrowUpRight className="h-4 w-4 text-[#b5b2aa]" />
                </div>
                <p className="mt-7 text-sm font-medium text-[#647180]">{item.label}</p>
                {metrics.isLoading ? <Skeleton className="mt-2 h-10 w-20 bg-[#f0eee8]" /> : <p className="mt-1 font-display text-4xl text-[#102033]">{value}</p>}
                <div className="mt-1 flex items-center gap-2"><p className="text-xs text-[#9aa1a8]">{item.helper}</p><span className={`text-[10px] font-bold ${trend.tone}`}>{trend.label}</span></div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <Card className="soft-card overflow-hidden rounded-2xl border-0 bg-[#102033] text-white">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-white/10 p-6 pb-5">
            <div>
              <p className="eyebrow text-[#f4c46d]">Vue atelier Story’s</p>
              <CardTitle className="mt-2 font-display text-2xl font-medium">Le fil des commandes</CardTitle>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/45">À encaisser</p>
              <p className="mt-0.5 text-sm font-semibold text-[#f4c46d]">{formatCurrency(metrics.data?.pendingAmountCents ?? 0)}</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                ["À collecter", "to_collect", "#f4c46d"], ["Reçu", "received", "#9dbed7"], ["En lavage", "washing", "#b9a9ee"], ["Prêt", "ready", "#93d0ae"], ["En livraison", "in_delivery", "#9bc3f7"], ["Livré", "delivered", "#aab7b0"],
              ].map(([label, status, color]) => {
                const count = orders.data?.filter(item => item.order.status === status).length ?? 0;
                return <div key={status} className="rounded-xl bg-white/[0.07] p-3"><div className="mb-3 h-1.5 rounded-full" style={{ backgroundColor: color }} /><p className="text-xl font-semibold">{count}</p><p className="mt-1 text-[11px] leading-4 text-white/50">{label}</p></div>;
              })}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4c46d]/15 text-[#f4c46d]"><Sparkles className="h-4 w-4" /></div><p className="text-sm text-white/65">Gardez une vue sur chaque étape, sans rien laisser au hasard.</p></div>
              <Link href="/admin/orders" className="hidden items-center gap-1 text-sm font-semibold text-[#f4c46d] hover:text-white sm:flex">Tout voir <ChevronRight className="h-4 w-4" /></Link>
            </div>
          </CardContent>
        </Card>

        <Card className="soft-card rounded-2xl border-0 bg-white">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-3">
            <div><p className="eyebrow text-[#b3863d]">À surveiller</p><CardTitle className="mt-2 font-display text-2xl font-medium text-[#102033]">Prochaines actions</CardTitle></div>
            <Clock3 className="h-5 w-5 text-[#b3863d]" />
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-3">
            <ActionRow icon={Truck} label="Tournées à préparer" value={`${metrics.data?.deliveriesDue ?? 0} commandes`} tone="bg-[#e8f1ff] text-[#3d68a5]" />
            <ActionRow icon={WalletCards} label="Encaissements à suivre" value={`${metrics.data?.paymentsPending ?? 0} paiements`} tone="bg-[#f9e9e6] text-[#b05a49]" />
            <ActionRow icon={CircleCheck} label="Capacité du jour" value={orders.isLoading ? "Calcul…" : "À jour"} tone="bg-[#e8f6ef] text-[#367957]" />
          </CardContent>
        </Card>
      </section>

      <Card className="soft-card rounded-2xl border-0 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
          <div><p className="eyebrow text-[#b3863d]">Activité récente</p><CardTitle className="mt-2 font-display text-2xl font-medium text-[#102033]">Les dernières commandes</CardTitle></div>
          <Button variant="ghost" className="hidden rounded-xl text-[#526477] hover:bg-[#f7f6f1] sm:flex" asChild><Link href="/admin/orders">Ouvrir le registre <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          {orders.isLoading ? <div className="space-y-4 px-6 pb-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full bg-[#f0eee8]" />)}</div> : orders.isError ? <div className="p-6"><QueryError onRetry={() => void orders.refetch()} message="L’activité récente n’a pas pu être chargée." /></div> : orders.data?.length ? <div className="divide-y divide-[#102033]/[0.07]">{orders.data.slice(0, 5).map(({ order, customerName }) => <RecentOrder key={order.id} order={order} customerName={customerName || "Client sans nom"} />)}</div> : <EmptyActivity />}
        </CardContent>
      </Card>
    </div>
  );
}

function trendLabel(current: number, previous: number) {
  if (current === previous) return { label: "Stable", tone: "text-[#9aa1a8]" };
  if (previous === 0) return { label: current > 0 ? "+100%" : "Stable", tone: current > 0 ? "text-[#367957]" : "text-[#9aa1a8]" };
  const percentage = Math.round(((current - previous) / previous) * 100);
  return { label: `${percentage > 0 ? "+" : ""}${percentage}%`, tone: percentage > 0 ? "text-[#367957]" : "text-[#b05a49]" };
}

function ActionRow({ icon: Icon, label, value, tone }: { icon: typeof Truck; label: string; value: string; tone: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[#102033]/[0.07] p-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#26384a]">{label}</p><p className="mt-0.5 text-xs text-[#8c969d]">{value}</p></div><ChevronRight className="h-4 w-4 text-[#c3c7c5]" /></div>;
}

function RecentOrder({ order, customerName }: { order: any; customerName: string }) {
  return <div className="flex flex-wrap items-center gap-4 px-6 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#102033] text-xs font-bold text-[#f4c46d]">{initials(customerName)}</div><div className="min-w-[150px] flex-1"><p className="text-sm font-semibold text-[#26384a]">{customerName}</p><p className="mt-0.5 text-xs text-[#8c969d]">{order.orderNumber} · {order.service}</p></div><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-[#26384a]">{formatCurrency(order.amountCents)}</p><p className="mt-0.5 text-xs text-[#8c969d]">{formatDateTime(order.createdAt)}</p></div><Badge variant="outline" className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[order.status as keyof typeof statusStyles]}`}>{statusLabels[order.status as keyof typeof statusLabels]}</Badge></div>;
}

function EmptyActivity() {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f6f1] text-[#b3863d]"><PackageCheck className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl text-[#102033]">Le registre est prêt</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#8c969d]">Créez votre première commande pour voir l’activité de Story’s apparaître ici.</p><Button className="mt-5 rounded-xl bg-[#102033] text-white hover:bg-[#1c344f]" asChild><Link href="/admin/orders?new=1"><Plus className="mr-2 h-4 w-4" />Créer une commande</Link></Button></div>;
}
