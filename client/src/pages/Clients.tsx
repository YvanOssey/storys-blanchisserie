import { useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryError } from "@/components/QueryState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, initials, statusLabels, statusStyles } from "@/lib/laundry";
import { ArrowUpRight, ChevronRight, Filter, Mail, MapPin, Phone, Plus, Search, UserRound, UsersRound } from "lucide-react";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [withBalance, setWithBalance] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const customers = trpc.customers.list.useQuery({ search: search || undefined, city: city === "all" ? undefined : city, withBalance });
  const selected = trpc.customers.get.useQuery({ id: selectedId as number }, { enabled: selectedId !== null });
  const utils = trpc.useUtils();
  const cities = Array.from(new Set((customers.data ?? []).map(customer => customer.city).filter(Boolean))).sort();
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: data => {
      toast.success("Fiche client créée", { description: "Le client est maintenant disponible pour une commande." });
      setOpen(false);
      setSelectedId(data?.id ?? null);
      void utils.customers.list.invalidate();
    },
    onError: error => toast.error("Impossible de créer la fiche", { description: error.message }),
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("fullName") || "");
    const phone = String(data.get("phone") || "");
    const address = String(data.get("address") || "");
    if (!fullName || !phone || !address) {
      toast.error("Informations manquantes", { description: "Le nom, le téléphone et l’adresse sont nécessaires." });
      return;
    }
    createCustomer.mutate({ fullName, phone, address, email: String(data.get("email") || ""), city: String(data.get("city") || ""), postalCode: String(data.get("postalCode") || ""), notes: String(data.get("notes") || "") });
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="eyebrow text-[#b3863d]">Carnet relationnel</p><h1 className="mt-2 font-display text-4xl tracking-tight text-[#102033] sm:text-5xl">Clients</h1><p className="mt-3 text-sm leading-6 text-[#647180]">Retrouvez chaque adresse, chaque préférence et chaque histoire de commande.</p></div>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded-xl bg-[#102033] text-white shadow-lg shadow-[#102033]/15 hover:bg-[#1c344f]"><Plus className="mr-2 h-4 w-4" />Nouveau client</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 p-0 sm:max-w-2xl"><div className="bg-[#102033] px-6 py-7 text-white"><DialogHeader><p className="eyebrow text-[#f4c46d]">Nouveau contact</p><DialogTitle className="mt-2 font-display text-3xl font-medium text-white">Ajouter un client</DialogTitle><DialogDescription className="mt-2 text-sm text-white/60">Conservez les informations utiles pour simplifier chaque collecte.</DialogDescription></DialogHeader></div><form onSubmit={submit} className="space-y-5 p-6"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="fullName">Nom complet</Label><Input id="fullName" name="fullName" placeholder="Ex. Camille Martin" className="rounded-xl bg-[#faf9f6]" /></div><div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" name="phone" type="tel" placeholder="06 00 00 00 00" className="rounded-xl bg-[#faf9f6]" /></div><div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" placeholder="camille@email.com" className="rounded-xl bg-[#faf9f6]" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Adresse</Label><Input id="address" name="address" placeholder="12 rue des Lilas" className="rounded-xl bg-[#faf9f6]" /></div><div className="space-y-2"><Label htmlFor="postalCode">Code postal</Label><Input id="postalCode" name="postalCode" placeholder="75011" className="rounded-xl bg-[#faf9f6]" /></div><div className="space-y-2"><Label htmlFor="city">Ville</Label><Input id="city" name="city" placeholder="Paris" className="rounded-xl bg-[#faf9f6]" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Notes client</Label><Textarea id="notes" name="notes" placeholder="Préférences, accès, consignes…" className="min-h-24 resize-none rounded-xl bg-[#faf9f6]" /></div></div><div className="flex justify-end gap-3 border-t border-[#102033]/10 pt-5"><Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Annuler</Button><Button type="submit" disabled={createCustomer.isPending} className="rounded-xl bg-[#102033] text-white hover:bg-[#1c344f]">{createCustomer.isPending ? "Enregistrement…" : "Créer la fiche"}</Button></div></form></DialogContent></Dialog>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.5fr]">
        <Card className="soft-card rounded-2xl border-0 bg-white"><CardHeader className="space-y-4 p-5 sm:p-6"><div className="flex items-center justify-between"><CardTitle className="font-display text-2xl font-medium text-[#102033]">Répertoire</CardTitle><Badge variant="secondary" className="rounded-full bg-[#f7f6f1] text-[#647180]">{customers.data?.length ?? 0}</Badge></div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1a8]" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom, téléphone ou e-mail" className="rounded-xl border-[#102033]/10 bg-[#faf9f6] pl-9" /></div><div className="flex flex-wrap items-center gap-2"><Filter className="h-3.5 w-3.5 text-[#b3863d]" /><Select value={city} onValueChange={setCity}><SelectTrigger className="h-8 w-[145px] rounded-lg border-[#102033]/10 bg-white text-xs"><SelectValue placeholder="Toutes les villes" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les villes</SelectItem>{cities.map(item => <SelectItem key={item} value={item as string}>{item}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" onClick={() => setWithBalance(!withBalance)} className={`h-8 rounded-lg px-3 text-xs ${withBalance ? "border-[#b3863d] bg-[#fff5df] text-[#9a6b22]" : "border-[#102033]/10 bg-white text-[#647180]"}`}>{withBalance ? "Avec impayé" : "Tous les soldes"}</Button></div></CardHeader><CardContent className="p-0">{customers.isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#f0eee8]" />)}</div> : customers.isError ? <div className="p-5"><QueryError onRetry={() => void customers.refetch()} message="Le répertoire n’a pas pu être chargé." /></div> : customers.data?.length ? <div className="max-h-[62vh] overflow-y-auto divide-y divide-[#102033]/[0.07]">{customers.data.map(customer => <button key={customer.id} onClick={() => setSelectedId(customer.id)} className={`flex min-h-[68px] w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#faf9f6] ${selectedId === customer.id ? "bg-[#faf9f6]" : ""}`}><Avatar className="h-10 w-10 border border-[#102033]/10"><AvatarFallback className="bg-[#eeeafa] text-xs font-bold text-[#6657a5]">{initials(customer.fullName)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#26384a]">{customer.fullName}</p><p className="mt-1 truncate text-xs text-[#8c969d]">{customer.phone} · {customer.city || "Ville à préciser"}</p></div><ChevronRight className={`h-4 w-4 text-[#c3c7c5] ${selectedId === customer.id ? "text-[#b3863d]" : ""}`} /></button>)}</div> : <EmptyClients onCreate={() => setOpen(true)} />}</CardContent></Card>

        {selectedId && selected.isError ? <QueryError onRetry={() => void selected.refetch()} message="La fiche de ce client n’a pas pu être chargée." /> : selectedId && selected.data ? <CustomerDetail data={selected.data} /> : <Card className="soft-card flex min-h-[440px] items-center justify-center rounded-2xl border-0 bg-white"><div className="max-w-sm px-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f6f1] text-[#b3863d]"><UserRound className="h-6 w-6" /></div><h2 className="mt-4 font-display text-2xl text-[#102033]">Sélectionnez un client</h2><p className="mt-2 text-sm leading-6 text-[#8c969d]">Choisissez une fiche dans le répertoire pour voir ses coordonnées, son historique et son solde.</p></div></Card>}
      </div>
    </div>
  );
}

function CustomerDetail({ data }: { data: any }) {
  const { customer, orders, balanceCents } = data;
  return <Card className="soft-card rounded-2xl border-0 bg-white"><CardHeader className="border-b border-[#102033]/[0.07] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><Avatar className="h-14 w-14 border border-[#102033]/10"><AvatarFallback className="bg-[#102033] font-bold text-[#f4c46d]">{initials(customer.fullName)}</AvatarFallback></Avatar><div><p className="eyebrow text-[#b3863d]">Fiche client</p><CardTitle className="mt-1 font-display text-3xl font-medium text-[#102033]">{customer.fullName}</CardTitle></div></div><div className="rounded-xl bg-[#fff5df] px-4 py-3 text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-[#9a6b22]">Solde à suivre</p><p className="mt-1 font-display text-2xl text-[#102033]">{formatCurrency(balanceCents)}</p></div></div></CardHeader><CardContent className="space-y-6 p-6"><div className="grid gap-3 sm:grid-cols-2"><Info icon={Phone} label="Téléphone" value={customer.phone} /><Info icon={Mail} label="E-mail" value={customer.email || "Non renseigné"} /><Info icon={MapPin} label="Adresse" value={[customer.address, customer.postalCode, customer.city].filter(Boolean).join(", ")} /><Info icon={UsersRound} label="Client depuis" value={formatDate(customer.createdAt, { day: "numeric", month: "long", year: "numeric" })} /></div><Separator className="bg-[#102033]/[0.07]" /><div><div className="flex items-center justify-between gap-3"><div><p className="eyebrow text-[#b3863d]">Historique</p><h3 className="mt-1 font-display text-2xl text-[#102033]">Commandes récentes</h3></div><Button variant="outline" className="rounded-xl border-[#102033]/10" asChild><Link href="/admin/orders?new=1">Nouvelle commande <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div>{orders.length ? <div className="mt-4 space-y-3">{orders.slice(0, 5).map((order: any) => <div key={order.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#102033]/[0.07] p-3"><div className="min-w-[120px] flex-1"><p className="text-sm font-semibold text-[#26384a]">{order.orderNumber}</p><p className="mt-1 text-xs text-[#8c969d]">{order.service} · {formatDate(order.createdAt)}</p></div><span className="text-sm font-semibold text-[#526477]">{formatCurrency(order.amountCents)}</span><Badge variant="outline" className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[order.status as keyof typeof statusStyles]}`}>{statusLabels[order.status as keyof typeof statusLabels]}</Badge></div>)}</div> : <p className="mt-5 rounded-xl bg-[#faf9f6] p-5 text-center text-sm text-[#8c969d]">Aucune commande associée à cette fiche.</p>}</div></CardContent></Card>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return <div className="rounded-xl bg-[#faf9f6] p-3"><div className="flex items-center gap-2 text-[#b3863d]"><Icon className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">{label}</span></div><p className="mt-2 break-words text-sm font-medium text-[#526477]">{value}</p></div>;
}

function EmptyClients({ onCreate }: { onCreate: () => void }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f6f1] text-[#b3863d]"><UsersRound className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl text-[#102033]">Votre répertoire est vide</h3><p className="mt-2 text-sm leading-6 text-[#8c969d]">Ajoutez vos premiers clients pour retrouver leurs habitudes en un coup d’œil.</p><Button onClick={onCreate} className="mt-5 rounded-xl bg-[#102033] text-white hover:bg-[#1c344f]"><Plus className="mr-2 h-4 w-4" />Ajouter un client</Button></div>;
}
