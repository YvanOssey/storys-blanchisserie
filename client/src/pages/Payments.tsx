import { useState } from "react";
import { QueryError } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, paymentLabels, paymentMethodLabels } from "@/lib/laundry";
import { ArrowDownToLine, Check, CircleDollarSign, Clock3, Download, Search, WalletCards } from "lucide-react";

export default function Payments() {
  const [search, setSearch] = useState("");
  const summary = trpc.payments.summary.useQuery();
  const orders = trpc.orders.list.useQuery({ search: search || undefined });
  const utils = trpc.useUtils();
  const updatePayment = trpc.orders.updatePayment.useMutation({
    onSuccess: () => {
      void utils.orders.list.invalidate();
      void utils.payments.summary.invalidate();
      void utils.dashboard.metrics.invalidate();
      toast.success("Paiement mis à jour");
    },
    onError: error => toast.error("Mise à jour impossible", { description: error.message }),
  });

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-[#b3863d]">Trésorerie Story’s</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102033] sm:text-5xl">Paiements</h1>
          <p className="mt-3 text-sm leading-6 text-[#647180]">Gardez une lecture simple des encaissements Story’s et des soldes qui restent à suivre.</p>
        </div>
        <Button onClick={() => toast.info("Export bientôt disponible", { description: "Le téléchargement CSV sera ajouté dans une prochaine version." })} variant="outline" className="rounded-xl border-[#102033]/15 bg-white text-[#526477] hover:bg-[#102033]/5">
          <Download className="mr-2 h-4 w-4" />Exporter le suivi
        </Button>
      </header>

      {summary.isError && <QueryError onRetry={() => void summary.refetch()} message="La synthèse des paiements n’a pas pu être chargée." />}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PaymentKpi label="Encaissé" value={formatCurrency(summary.data?.paidCents ?? 0)} detail={`${summary.data?.paidCount ?? 0} commandes réglées`} icon={CircleDollarSign} tone="bg-[#e8f6ef] text-[#367957]" loading={summary.isLoading} />
        <PaymentKpi label="En attente" value={formatCurrency(summary.data?.pendingCents ?? 0)} detail={`${summary.data?.pendingCount ?? 0} commandes à relancer`} icon={Clock3} tone="bg-[#fff5df] text-[#9a6b22]" loading={summary.isLoading} />
        <PaymentKpi label="Taux de règlement" value={summary.data && summary.data.paidCount + summary.data.pendingCount ? `${Math.round((summary.data.paidCount / (summary.data.paidCount + summary.data.pendingCount)) * 100)}%` : "0%"} detail="sur les commandes enregistrées" icon={ArrowDownToLine} tone="bg-[#e8f1ff] text-[#3d68a5]" loading={summary.isLoading} />
        <PaymentKpi label="Solde à suivre" value={formatCurrency(summary.data?.pendingCents ?? 0)} detail="total des créances ouvertes" icon={WalletCards} tone="bg-[#eeeafa] text-[#6657a5]" loading={summary.isLoading} />
      </section>

      <Card className="soft-card rounded-2xl border-0 bg-white">
        <CardHeader className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div><p className="eyebrow text-[#b3863d]">Journal des règlements</p><CardTitle className="mt-2 font-display text-2xl font-medium text-[#102033]">Paiements par commande</CardTitle></div>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1a8]" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une commande" className="rounded-xl border-[#102033]/10 bg-[#faf9f6] pl-9" /></div>
        </CardHeader>
        <CardContent className="p-0">
          {orders.isLoading ? <div className="space-y-3 p-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#f0eee8]" />)}</div> : orders.isError ? <div className="p-6"><QueryError onRetry={() => void orders.refetch()} message="Le journal des paiements n’a pas pu être chargé." /></div> : orders.data?.length ? <PaymentTable orders={orders.data} updatePayment={updatePayment} /> : <EmptyPayments />}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentTable({ orders, updatePayment }: { orders: any[]; updatePayment: { mutate: (input: any) => void } }) {
  return <div className="overflow-x-auto rounded-b-2xl"><table className="w-full min-w-[890px] text-left"><thead><tr className="border-y border-[#102033]/[0.07] text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]"><th className="px-6 py-4">Commande</th><th className="px-4 py-4">Client</th><th className="px-4 py-4">Montant</th><th className="px-4 py-4">Solde client</th><th className="px-4 py-4">Moyen</th><th className="px-4 py-4">État</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody>{orders.map(({ order, customerName, customerBalanceCents }) => <tr key={order.id} className="border-b border-[#102033]/[0.07] last:border-0 hover:bg-[#faf9f6]"><td className="whitespace-nowrap px-6 py-4"><p className="text-sm font-semibold text-[#26384a]">{order.orderNumber}</p><p className="mt-1 text-xs text-[#9aa1a8]">{formatDate(order.createdAt, { day: "2-digit", month: "short", year: "numeric" })}</p></td><td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-[#526477]">{customerName || "Client supprimé"}</td><td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-[#26384a]">{formatCurrency(order.amountCents)}</td><td className="whitespace-nowrap px-4 py-4"><p className={`text-sm font-semibold ${customerBalanceCents > 0 ? "text-[#b05a49]" : "text-[#367957]"}`}>{formatCurrency(customerBalanceCents)}</p><p className="mt-1 text-xs text-[#9aa1a8]">après cette commande</p></td><td className="whitespace-nowrap px-4 py-4"><Select value={order.paymentMethod || undefined} onValueChange={value => updatePayment.mutate({ id: order.id, paymentStatus: order.paymentStatus, paymentMethod: value as "cash" | "card" | "transfer" | "mobile" })}><SelectTrigger className="h-8 w-[130px] rounded-lg border-[#102033]/10 bg-white text-xs"><SelectValue placeholder="À définir" /></SelectTrigger><SelectContent>{Object.entries(paymentMethodLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></td><td className="whitespace-nowrap px-4 py-4"><Badge variant="outline" className={`rounded-full px-3 py-1 text-[11px] font-semibold ${order.paymentStatus === "paid" ? "border-[#c3e5d2] bg-[#e8f6ef] text-[#367957]" : "border-[#f1d497] bg-[#fff5df] text-[#9a6b22]"}`}>{paymentLabels[order.paymentStatus as keyof typeof paymentLabels]}</Badge></td><td className="px-6 py-4 text-right"><Button size="sm" variant={order.paymentStatus === "paid" ? "outline" : "default"} onClick={() => updatePayment.mutate({ id: order.id, paymentStatus: order.paymentStatus === "paid" ? "pending" : "paid", paymentMethod: order.paymentMethod || undefined })} className={`rounded-lg text-xs ${order.paymentStatus === "paid" ? "border-[#102033]/10 bg-white text-[#647180]" : "bg-[#102033] text-white hover:bg-[#1c344f]"}`}>{order.paymentStatus === "paid" ? "Marquer en attente" : <><Check className="mr-1.5 h-3.5 w-3.5" />Marquer payé</>}</Button></td></tr>)}</tbody></table></div>;
}

function EmptyPayments() {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f6f1] text-[#b3863d]"><WalletCards className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl text-[#102033]">Aucun paiement à afficher</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#8c969d]">Les paiements seront disponibles dès qu’une première commande sera enregistrée.</p></div>;
}

function PaymentKpi({ label, value, detail, icon: Icon, tone, loading }: { label: string; value: string; detail: string; icon: typeof Clock3; tone: string; loading: boolean }) {
  return <Card className="soft-card rounded-2xl border-0 bg-white"><CardContent className="p-5"><div className="flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-[#b2b8bb]">FCFA</span></div><p className="mt-7 text-sm font-medium text-[#647180]">{label}</p>{loading ? <Skeleton className="mt-2 h-9 w-28 bg-[#f0eee8]" /> : <p className="mt-1 font-display text-3xl text-[#102033]">{value}</p>}<p className="mt-1 text-xs text-[#9aa1a8]">{detail}</p></CardContent></Card>;
}
