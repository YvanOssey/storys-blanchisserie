import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, paymentLabels, paymentMethodLabels, services, statusLabels, statusStyles } from "@/lib/laundry";
import { QueryError } from "@/components/QueryState";
import { ChevronDown, Filter, Loader2, PackagePlus, Plus, Search, SlidersHorizontal } from "lucide-react";

const statuses = ["all", "to_collect", "received", "washing", "ready", "in_delivery", "delivered"] as const;
const statusFilters = { all: "Toutes", to_collect: "À collecter", received: "Reçu", washing: "En lavage", ready: "Prêt", in_delivery: "En livraison", delivered: "Livré" } as const;

type OrderForm = {
  customerId: string;
  service: string;
  itemCount: string;
  weightKg: string;
  amount: string;
  pickupDate: string;
  deliveryDate: string;
  paymentMethod: "cash" | "card" | "transfer" | "mobile" | "";
  instructions: string;
};

const emptyForm: OrderForm = { customerId: "", service: services[0], itemCount: "", weightKg: "", amount: "", pickupDate: "", deliveryDate: "", paymentMethod: "", instructions: "" };

export default function Orders() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [open, setOpen] = useState(() => location.includes("new=1"));
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const orders = trpc.orders.list.useQuery({ search: search || undefined, status: status === "all" ? undefined : status });
  const customers = trpc.customers.list.useQuery({});
  const utils = trpc.useUtils();
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Commande créée", { description: "La commande a été ajoutée au registre." });
      setForm(emptyForm);
      setOpen(false);
      setLocation("/orders");
      void utils.orders.list.invalidate();
      void utils.dashboard.metrics.invalidate();
    },
    onError: error => toast.error("Impossible de créer la commande", { description: error.message }),
  });
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { void utils.orders.list.invalidate(); void utils.dashboard.metrics.invalidate(); toast.success("Statut mis à jour", { description: "La notification est maintenant visible dans l’espace du client." }); },
    onError: error => toast.error("Mise à jour impossible", { description: error.message }),
  });

  useEffect(() => {
    if (location.includes("new=1")) setOpen(true);
  }, [location]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customerId || !form.amount) {
      toast.error("Informations manquantes", { description: "Sélectionnez un client et indiquez un montant." });
      return;
    }
    createOrder.mutate({
      customerId: Number(form.customerId),
      service: form.service,
      itemCount: form.itemCount ? Number(form.itemCount) : undefined,
      weightKg: form.weightKg || undefined,
      instructions: form.instructions || undefined,
      amountCents: Math.round(Number(form.amount.replace(",", "."))),
      pickupAt: form.pickupDate ? new Date(`${form.pickupDate}T09:00:00`).getTime() : undefined,
      deliveryAt: form.deliveryDate ? new Date(`${form.deliveryDate}T18:00:00`).getTime() : undefined,
      paymentMethod: form.paymentMethod || undefined,
      status: "to_collect",
      paymentStatus: "pending",
    });
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="eyebrow text-[#b3863d]">Registre opérationnel</p><h1 className="mt-2 font-display text-4xl tracking-tight text-[#102033] sm:text-5xl">Commandes</h1><p className="mt-3 text-sm leading-6 text-[#647180]">Chaque pièce suit son chemin, de la collecte à la livraison.</p></div>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value && location.includes("new=1")) setLocation("/orders"); }}>
          <DialogTrigger asChild><Button className="rounded-xl bg-[#102033] text-white shadow-lg shadow-[#102033]/15 hover:bg-[#1c344f]"><Plus className="mr-2 h-4 w-4" />Nouvelle commande</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 p-0 sm:max-w-2xl">
            <div className="bg-[#102033] px-6 py-7 text-white"><DialogHeader><p className="eyebrow text-[#f4c46d]">Nouvelle entrée</p><DialogTitle className="mt-2 font-display text-3xl font-medium text-white">Créer une commande</DialogTitle><DialogDescription className="mt-2 text-sm text-white/60">Ajoutez les informations essentielles. Vous pourrez faire évoluer son statut ensuite.</DialogDescription></DialogHeader></div>
            <form onSubmit={submit} className="space-y-5 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="customer">Client</Label>{customers.isError && <QueryError onRetry={() => void customers.refetch()} message="La liste des clients n’a pas pu être chargée." />}<Select value={form.customerId || undefined} onValueChange={value => setForm({ ...form, customerId: value })}><SelectTrigger id="customer" className="rounded-xl bg-[#faf9f6]"><SelectValue placeholder={customers.data?.length ? "Sélectionner un client" : "Aucun client enregistré"} /></SelectTrigger><SelectContent>{customers.data?.map(customer => <SelectItem key={customer.id} value={String(customer.id)}>{customer.fullName} · {customer.phone}</SelectItem>)}</SelectContent></Select>{!customers.data?.length && <p className="text-xs text-[#a07837]">Commencez par <Link href="/admin/clients" className="font-semibold underline">ajouter un client</Link>.</p>}</div>
                <div className="space-y-2"><Label htmlFor="service">Prestation</Label><Select value={form.service} onValueChange={value => setForm({ ...form, service: value })}><SelectTrigger id="service" className="rounded-xl bg-[#faf9f6]"><SelectValue /></SelectTrigger><SelectContent>{services.map(service => <SelectItem key={service} value={service}>{service}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="amount">Montant (FCFA)</Label><Input id="amount" inputMode="decimal" placeholder="15 000" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} className="rounded-xl bg-[#faf9f6]" /></div>
                <div className="space-y-2"><Label htmlFor="itemCount">Nombre de pièces</Label><Input id="itemCount" type="number" min="0" placeholder="Ex. 12" value={form.itemCount} onChange={event => setForm({ ...form, itemCount: event.target.value })} className="rounded-xl bg-[#faf9f6]" /></div>
                <div className="space-y-2"><Label htmlFor="weight">Poids (kg)</Label><Input id="weight" inputMode="decimal" placeholder="Ex. 4,5" value={form.weightKg} onChange={event => setForm({ ...form, weightKg: event.target.value })} className="rounded-xl bg-[#faf9f6]" /></div>
                <div className="space-y-2"><Label htmlFor="pickup">Date de collecte</Label><Input id="pickup" type="date" value={form.pickupDate} onChange={event => setForm({ ...form, pickupDate: event.target.value })} className="rounded-xl bg-[#faf9f6]" /></div>
                <div className="space-y-2"><Label htmlFor="delivery">Date de livraison</Label><Input id="delivery" type="date" value={form.deliveryDate} onChange={event => setForm({ ...form, deliveryDate: event.target.value })} className="rounded-xl bg-[#faf9f6]" /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="payment">Moyen de paiement prévu</Label><Select value={form.paymentMethod || undefined} onValueChange={value => setForm({ ...form, paymentMethod: value as OrderForm["paymentMethod"] })}><SelectTrigger id="payment" className="rounded-xl bg-[#faf9f6]"><SelectValue placeholder="À définir" /></SelectTrigger><SelectContent>{Object.entries(paymentMethodLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="instructions">Instructions particulières</Label><Textarea id="instructions" placeholder="Tache, textile délicat, consigne de livraison…" value={form.instructions} onChange={event => setForm({ ...form, instructions: event.target.value })} className="min-h-24 resize-none rounded-xl bg-[#faf9f6]" /></div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#102033]/10 pt-5"><Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Annuler</Button><Button type="submit" disabled={createOrder.isPending} className="rounded-xl bg-[#102033] text-white hover:bg-[#1c344f]">{createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer la commande</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="soft-card rounded-2xl border-0 bg-white">
        <CardHeader className="space-y-5 p-5 pb-4 sm:p-6 sm:pb-4"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><CardTitle className="font-display text-2xl font-medium text-[#102033]">Toutes les commandes</CardTitle><div className="flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1 sm:flex-none"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1a8]" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher…" className="h-10 rounded-xl border-[#102033]/10 bg-[#faf9f6] pl-9 text-sm" /></div><Button variant="outline" className="h-10 rounded-xl border-[#102033]/10 bg-white px-3 text-[#526477] sm:hidden"><SlidersHorizontal className="h-4 w-4" /></Button></div></div><div className="flex flex-wrap gap-2">{statuses.map(item => <Button key={item} onClick={() => setStatus(item)} variant="ghost" className={`h-8 rounded-full px-3 text-xs ${status === item ? "bg-[#102033] text-white hover:bg-[#1c344f] hover:text-white" : "text-[#647180] hover:bg-[#f7f6f1]"}`}>{statusFilters[item]}</Button>)}</div></CardHeader>
        <CardContent className="p-0">
          {orders.isLoading ? <div className="space-y-3 p-6">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#f0eee8]" />)}</div> : orders.isError ? <div className="p-6"><QueryError onRetry={() => void orders.refetch()} message="Le registre des commandes n’a pas pu être chargé." /></div> : orders.data?.length ? <div className="overflow-x-auto rounded-b-2xl"><Table className="min-w-[820px]"><TableHeader><TableRow className="border-[#102033]/[0.07] hover:bg-transparent"><TableHead className="whitespace-nowrap pl-6 text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">Commande</TableHead><TableHead className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">Client</TableHead><TableHead className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">Prestation</TableHead><TableHead className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">Étape</TableHead><TableHead className="whitespace-nowrap text-right text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">Montant</TableHead><TableHead className="pr-6 text-right text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">Paiement</TableHead></TableRow></TableHeader><TableBody>{orders.data.map(({ order, customerName, customerPhone }) => <TableRow key={order.id} className="border-[#102033]/[0.07] hover:bg-[#faf9f6]"><TableCell className="whitespace-nowrap pl-6"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#26384a]">{order.orderNumber}</p>{order.source === "website" && <Badge variant="outline" className="rounded-full border-[#c8daf6] bg-[#e8f1ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#3d68a5]">Site</Badge>}</div><p className="mt-1 text-xs text-[#9aa1a8]">{formatDate(order.createdAt, { day: "2-digit", month: "short", year: "numeric" })}</p></TableCell><TableCell className="whitespace-nowrap"><p className="text-sm font-medium text-[#526477]">{customerName || "Client supprimé"}</p><p className="mt-1 text-xs text-[#9aa1a8]">{customerPhone || "—"}</p></TableCell><TableCell className="whitespace-nowrap"><p className="text-sm text-[#526477]">{order.service}</p><p className="mt-1 text-xs text-[#9aa1a8]">{order.itemCount ? `${order.itemCount} pièces` : order.weightKg ? `${order.weightKg} kg` : "Quantité à préciser"}</p></TableCell><TableCell><Select value={order.status} onValueChange={value => updateStatus.mutate({ id: order.id, status: value as typeof order.status })}><SelectTrigger className={`h-8 w-[135px] rounded-full border px-3 text-xs font-semibold ${statusStyles[order.status as keyof typeof statusStyles]}`}><SelectValue /></SelectTrigger><SelectContent>{statuses.slice(1).map(value => <SelectItem key={value} value={value}>{statusLabels[value as keyof typeof statusLabels]}</SelectItem>)}</SelectContent></Select></TableCell><TableCell className="whitespace-nowrap text-right"><p className="text-sm font-semibold text-[#26384a]">{formatCurrency(order.amountCents)}</p><p className="mt-1 text-xs text-[#9aa1a8]">{order.deliveryAt ? `Livraison ${formatDate(order.deliveryAt)}` : "Date à planifier"}</p></TableCell><TableCell className="whitespace-nowrap pr-6 text-right"><Badge variant="outline" className={`rounded-full px-3 py-1 text-[11px] font-semibold ${order.paymentStatus === "paid" ? "border-[#c3e5d2] bg-[#e8f6ef] text-[#367957]" : "border-[#f1d497] bg-[#fff5df] text-[#9a6b22]"}`}>{paymentLabels[order.paymentStatus]}</Badge></TableCell></TableRow>)}</TableBody></Table></div> : <EmptyOrders onCreate={() => setOpen(true)} />}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyOrders({ onCreate }: { onCreate: () => void }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f6f1] text-[#b3863d]"><PackagePlus className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl text-[#102033]">Aucune commande pour le moment</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#8c969d]">Le registre se remplira dès votre prochaine collecte. Tout commence par une première commande.</p><Button onClick={onCreate} className="mt-5 rounded-xl bg-[#102033] text-white hover:bg-[#1c344f]"><Plus className="mr-2 h-4 w-4" />Créer une commande</Button></div>;
}
