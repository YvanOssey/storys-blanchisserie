import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, publicOffers } from "@/lib/laundry";
import { ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, Clock3, Droplets, Loader2, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  service: string;
  itemCount: string;
  weightKg: string;
  pickupDate: string;
  deliveryDate: string;
  instructions: string;
};

const initialValues: FormValues = { fullName: "", phone: "", email: "", address: "", city: "", postalCode: "", service: publicOffers[0].name, itemCount: "", weightKg: "", pickupDate: "", deliveryDate: "", instructions: "" };

export default function PublicOrder() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormValues>(initialValues);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id?: number; orderNumber: string } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const customerSession = trpc.customerAuth.me.useQuery();
  useEffect(() => {
    const customer = customerSession.data;
    if (!customer) return;
    setForm(current => ({ ...current, fullName: current.fullName || customer.fullName, phone: current.phone || customer.phone, email: current.email || customer.email || "", address: current.address || customer.address, city: current.city || customer.city || "", postalCode: current.postalCode || customer.postalCode || "" }));
  }, [customerSession.data]);
  const onOrderSuccess = (order: { id?: number; orderNumber?: string } | undefined) => {
    setConfirmedOrder({ id: order?.id, orderNumber: order?.orderNumber || "votre demande" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const createCustomerOrder = trpc.customer.createOrder.useMutation({ onSuccess: onOrderSuccess, onError: error => toast.error("La demande n’a pas pu être envoyée", { description: error.message }) });

  const update = (field: keyof FormValues, value: string) => { setShowErrors(false); setForm(current => ({ ...current, [field]: value })); };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const needsContactDetails = !customerSession.data;
    if (!customerSession.data) {
      toast.error("Connexion obligatoire", { description: "Créez votre compte ou connectez-vous pour valider cette commande." });
      navigate("/connexion");
      return;
    }
    if ((needsContactDetails && (!form.fullName || !form.phone || !form.address || !form.city)) || !form.pickupDate || !form.deliveryDate || (!form.itemCount && !form.weightKg)) {
      setShowErrors(true);
      toast.error("Quelques informations sont nécessaires", { description: "Vérifiez les champs signalés avant d’envoyer votre demande." });
      return;
    }
    if (form.deliveryDate < form.pickupDate) {
      toast.error("Dates à vérifier", { description: "La livraison doit avoir lieu après la collecte." });
      return;
    }
    const orderInput = {
      service: form.service,
      itemCount: form.itemCount ? Number(form.itemCount) : undefined,
      weightKg: form.weightKg || undefined,
      pickupAt: new Date(`${form.pickupDate}T09:00:00`).getTime(),
      deliveryAt: new Date(`${form.deliveryDate}T18:00:00`).getTime(),
      instructions: form.instructions || undefined,
    };
    createCustomerOrder.mutate(orderInput);
  };

  if (confirmedOrder) return <Confirmation orderId={confirmedOrder.id} orderNumber={confirmedOrder.orderNumber} onRestart={() => { setConfirmedOrder(null); setForm(initialValues); }} />;

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#00514d]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10"><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#00514d]"><img src="/logo.PNG" alt="Story’s" className="h-full w-full object-contain" /></span><span><span className="block font-display text-xl leading-none">Story’s</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#99772a]">Lavage & soins à domicile</span></span></Link></nav>
      <main className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <section className="grid overflow-hidden rounded-[2rem] bg-[#00514d] shadow-[0_24px_80px_rgba(16,32,51,0.15)] lg:grid-cols-[0.78fr_1.22fr]">
          <div className="relative overflow-hidden px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-12 lg:py-14"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#e8c875]/20" /><div className="absolute -bottom-20 -left-24 h-72 w-72 rounded-full border border-white/10" /><div className="relative z-10"><p className="eyebrow text-[#e8c875]">Story’s · Cocody Riviera M’Pouto</p><h1 className="mt-4 max-w-md font-display text-4xl leading-[1.08] sm:text-5xl">Où la propreté rime avec le soin.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/65">Propre. Repassé. Livré chez vous. Nous prenons soin de chaque textile et vous recontactons pour confirmer votre passage.</p><div className="mt-8 grid grid-cols-3 gap-2">{publicOffers.map(offer => <div key={offer.name} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-bold text-[#e8c875]">{offer.name}</p><p className="mt-1 text-sm font-semibold text-white">{formatCurrency(offer.priceCents)}</p></div>)}</div><p className="mt-3 text-xs text-white/45">Délai indicatif : 72 heures · Zone : Cocody Riviera M’Pouto</p><div className="mt-8 space-y-4"><Benefit icon={Droplets} title="Des soins adaptés" text="Essentiel, Confort ou Prestige selon vos besoins." /><Benefit icon={Clock3} title="Des créneaux simples" text="Choisissez quand nous passons chez vous." /><Benefit icon={ShieldCheck} title="Un suivi attentif" text="Votre demande arrive directement à l’atelier." /></div><div className="mt-12 border-t border-white/10 pt-5 text-xs text-white/45"><p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#e8c875]" />Appelez ou écrivez sur WhatsApp : +225 07 77 06 72 90</p></div></div></div>
          <div className="bg-white px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14">{customerSession.data && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#00514d]/10 bg-[#e8f6ef] p-4 text-sm text-[#356661]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#367957]" /><p><span className="font-bold text-[#00514d]">Vous êtes connecté.</span> Vos coordonnées sont reprises depuis votre espace personnel.</p></div>}<div className="mb-6 grid grid-cols-3 gap-2"><ProgressStep number="01" label="Coordonnées" /><ProgressStep number="02" label="Prestation" /><ProgressStep number="03" label="Créneau" /></div><div className="mb-8 flex items-start justify-between gap-4"><div><p className="eyebrow text-[#99772a]">Demande de collecte</p><h2 className="mt-2 font-display text-3xl text-[#00514d]">Réservez votre soin.</h2><p className="mt-2 text-sm leading-6 text-[#647180]">Les champs marqués d’un * sont nécessaires.</p></div><div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-[#f5eddc] text-[#a17129] sm:flex"><CalendarDays className="h-5 w-5" /></div></div>
            {showErrors && <div role="alert" className="mb-6 rounded-xl border border-[#d89583] bg-[#fff4f0] p-4 text-sm text-[#9a4d3d]"><p className="font-bold">Votre demande n’est pas encore complète.</p><p className="mt-1 text-xs leading-5">Renseignez les coordonnées, les créneaux et une quantité ou un poids pour continuer.</p></div>}<form onSubmit={submit} className="space-y-7">
              <FormSection number="01" title="Vos coordonnées"><div className="grid gap-5 sm:grid-cols-2"><Field label="Nom complet *" htmlFor="fullName" className="sm:col-span-2"><Input id="fullName" aria-invalid={showErrors && !customerSession.data && !form.fullName} value={form.fullName} onChange={event => update("fullName", event.target.value)} placeholder="Ex. Camille Martin" className="rounded-xl bg-[#faf9f6]" /></Field><Field label="Téléphone *" htmlFor="phone"><Input id="phone" aria-invalid={showErrors && !customerSession.data && !form.phone} type="tel" value={form.phone} onChange={event => update("phone", event.target.value)} placeholder="06 00 00 00 00" className="rounded-xl bg-[#faf9f6]" /></Field><Field label="E-mail" htmlFor="email"><Input id="email" type="email" value={form.email} onChange={event => update("email", event.target.value)} placeholder="vous@email.com" className="rounded-xl bg-[#faf9f6]" /></Field><Field label="Adresse *" htmlFor="address" className="sm:col-span-2"><Input id="address" aria-invalid={showErrors && !customerSession.data && !form.address} value={form.address} onChange={event => update("address", event.target.value)} placeholder="12 rue des Lilas" className="rounded-xl bg-[#faf9f6]" /></Field><Field label="Code postal (facultatif)" htmlFor="postalCode"><Input id="postalCode" value={form.postalCode} onChange={event => update("postalCode", event.target.value)} placeholder="75011" className="rounded-xl bg-[#faf9f6]" /></Field><Field label="Ville *" htmlFor="city"><Input id="city" aria-invalid={showErrors && !customerSession.data && !form.city} value={form.city} onChange={event => update("city", event.target.value)} placeholder="Paris" className="rounded-xl bg-[#faf9f6]" /></Field></div>{showErrors && !customerSession.data && <p className="mt-3 text-xs font-semibold text-[#9a4d3d]">Vérifiez votre nom, téléphone et adresse de collecte.</p>}</FormSection>
              <FormSection number="02" title="La prestation"><div className="grid gap-5 sm:grid-cols-2"><Field label="Type de soin *" htmlFor="service" className="sm:col-span-2"><Select value={form.service} onValueChange={value => update("service", value)}><SelectTrigger id="service" className="rounded-xl bg-[#faf9f6]"><SelectValue /></SelectTrigger><SelectContent>{publicOffers.map(offer => <SelectItem key={offer.name} value={offer.name}>{offer.name} · {formatCurrency(offer.priceCents)}</SelectItem>)}<SelectItem value="Nettoyage & lustrage de chaussures">Chaussures · 1 000 FCFA / paire</SelectItem></SelectContent></Select></Field><Field label="Nombre de pièces" htmlFor="itemCount"><Input id="itemCount" aria-invalid={showErrors && !form.itemCount && !form.weightKg} type="number" min="1" value={form.itemCount} onChange={event => update("itemCount", event.target.value)} placeholder="Ex. 12" className="rounded-xl bg-[#faf9f6]" /></Field><Field label="Poids estimé (kg)" htmlFor="weightKg"><Input id="weightKg" aria-invalid={showErrors && !form.itemCount && !form.weightKg} inputMode="decimal" value={form.weightKg} onChange={event => update("weightKg", event.target.value)} placeholder="Ex. 4,5" className="rounded-xl bg-[#faf9f6]" /></Field></div><p className="mt-3 text-xs text-[#9aa1a8]">Indiquez au moins le nombre de pièces ou le poids estimé.</p>{showErrors && !form.itemCount && !form.weightKg && <p className="mt-2 text-xs font-semibold text-[#9a4d3d]">Ajoutez le nombre de pièces ou le poids estimé.</p>}</FormSection>
              <FormSection number="03" title="Les créneaux"><div className="grid gap-5 sm:grid-cols-2"><Field label="Collecte souhaitée *" htmlFor="pickupDate"><Input id="pickupDate" aria-invalid={showErrors && !form.pickupDate} type="date" min={today} value={form.pickupDate} onChange={event => update("pickupDate", event.target.value)} className="rounded-xl bg-[#faf9f6]" /></Field><Field label="Livraison souhaitée *" htmlFor="deliveryDate"><Input id="deliveryDate" aria-invalid={showErrors && !form.deliveryDate} type="date" min={form.pickupDate || today} value={form.deliveryDate} onChange={event => update("deliveryDate", event.target.value)} className="rounded-xl bg-[#faf9f6]" /></Field><Field label="Consignes particulières" htmlFor="instructions" className="sm:col-span-2"><Textarea id="instructions" value={form.instructions} onChange={event => update("instructions", event.target.value)} placeholder="Accès, tache délicate, textile fragile…" className="min-h-24 resize-none rounded-xl bg-[#faf9f6]" /></Field></div>{showErrors && (!form.pickupDate || !form.deliveryDate) && <p className="mt-3 text-xs font-semibold text-[#9a4d3d]">Choisissez une date de collecte et une date de livraison.</p>}</FormSection>
              <div className="rounded-2xl border border-[#00514d]/10 bg-[#faf9f6] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow text-[#99772a]">Dernière lecture</p><h3 className="mt-1 font-display text-xl text-[#00514d]">Votre demande en résumé</h3></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c969d]">À vérifier</span></div><div className="mt-4 grid gap-3 border-t border-[#00514d]/10 pt-4 sm:grid-cols-2"><ReviewItem label="Client" value={form.fullName || "À renseigner"} /><ReviewItem label="Téléphone" value={form.phone || "À renseigner"} /><ReviewItem label="E-mail" value={form.email || "Non renseigné"} /><ReviewItem label="Collecte" value={form.pickupDate ? formatDate(new Date(`${form.pickupDate}T09:00:00`), { weekday: "short", day: "numeric", month: "short" }) : "À choisir"} /><ReviewItem label="Prestation" value={form.service} /><ReviewItem label="Livraison" value={form.deliveryDate ? formatDate(new Date(`${form.deliveryDate}T18:00:00`), { weekday: "short", day: "numeric", month: "short" }) : "À choisir"} /><ReviewItem label="Adresse" value={form.address ? `${form.address}, ${form.postalCode || ""} ${form.city || ""}` : "À renseigner"} /><ReviewItem label="Volume" value={form.itemCount ? `${form.itemCount} pièce${form.itemCount === "1" ? "" : "s"}` : form.weightKg ? `${form.weightKg} kg estimés` : "À préciser"} /></div>{form.instructions && <p className="mt-4 border-t border-[#00514d]/10 pt-3 text-xs leading-5 text-[#647180]"><span className="font-semibold text-[#526477]">Consignes :</span> {form.instructions}</p>}</div>
              <div className="rounded-2xl bg-[#faf9f6] p-4"><div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#99772a]" /><p className="text-xs leading-5 text-[#647180]">Après l’envoi, Story’s confirme le tarif et le créneau par téléphone ou WhatsApp. Aucun paiement n’est demandé à cette étape.</p></div></div>
              {!customerSession.isLoading && !customerSession.data && <div className="rounded-2xl border border-[#e8c875]/60 bg-[#fffaf0] p-4"><p className="text-sm font-bold text-[#00514d]">Connectez-vous pour finaliser.</p><p className="mt-1 text-xs leading-5 text-[#647180]">La création d’un compte permet de retrouver votre commande et son avancement dans votre espace personnel.</p><Button asChild className="mt-3 h-10 rounded-xl bg-[#00514d] text-white hover:bg-[#123c3a]"><Link href="/connexion">Se connecter ou créer un compte <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>}
              <Button type="submit" disabled={customerSession.isLoading || createCustomerOrder.isPending} className="h-12 w-full rounded-xl bg-[#00514d] text-white shadow-lg shadow-[#00514d]/15 hover:bg-[#123c3a]">{customerSession.isLoading || createCustomerOrder.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi de la demande…</> : !customerSession.data ? <>Connexion requise <ArrowRight className="ml-2 h-4 w-4" /></> : <>Envoyer ma demande <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </form>
          </div>
        </section>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs text-[#8c969d]"><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#99772a]" />Sans engagement</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#99772a]" />Tarif confirmé par l’atelier</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#99772a]" />Collecte à domicile</span></div>
      </main>
    </div>
  );
}

function ProgressStep({ number, label }: { number: string; label: string }) { return <div className="rounded-xl bg-[#f7f3ec] px-2 py-2.5 text-center"><span className="block text-[10px] font-bold text-[#99772a]">{number}</span><span className="mt-1 block text-[10px] font-bold text-[#356661] sm:text-xs">{label}</span></div>; }

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section><div className="mb-4 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00514d] text-[10px] font-bold text-[#e8c875]">{number}</span><h3 className="font-display text-xl text-[#00514d]">{title}</h3><div className="h-px flex-1 bg-[#00514d]/10" /></div>{children}</section>;
}

function Field({ label, htmlFor, className = "", children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return <div className={`space-y-2 ${className}`}><Label htmlFor={htmlFor} className="text-sm font-semibold text-[#526477]">{label}</Label>{children}</div>;
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-[#9aa1a8]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[#26384a]">{value}</p></div>;
}

function Benefit({ icon: Icon, title, text }: { icon: typeof Droplets; title: string; text: string }) {
  return <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#e8c875]"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-0.5 text-xs leading-5 text-white/45">{text}</p></div></div>;
}

function Confirmation({ orderId, orderNumber, onRestart }: { orderId?: number; orderNumber: string; onRestart: () => void }) {
  return <div className="min-h-screen bg-[#f7f3ec] text-[#00514d]"><nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#00514d]"><img src="/logo.PNG" alt="Story’s" className="h-full w-full object-contain" /></span>
<span className="font-display text-xl">Story’s</span></Link></nav><main className="mx-auto flex max-w-2xl items-center justify-center px-5 py-14 sm:px-8"><div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_80px_rgba(16,32,51,0.10)] sm:p-14"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e8f6ef] text-[#367957]"><CheckCircle2 className="h-9 w-9" /></div><p className="eyebrow mt-7 text-[#99772a]">Demande bien reçue</p><h1 className="mt-3 font-display text-4xl text-[#00514d]">Merci, nous prenons le relais.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#647180]">Votre demande <strong className="text-[#00514d]">{orderNumber}</strong> est bien arrivée à l’atelier. Nous vous recontactons pour confirmer le tarif et le créneau.</p><div className="mt-8 grid gap-3 rounded-2xl bg-[#faf9f6] p-4 text-left sm:grid-cols-2"><div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#99772a]" /><span className="text-xs text-[#647180]">Nous vous appelons pour confirmer</span></div><div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-[#99772a]" /><span className="text-xs text-[#647180]">Délai indicatif de 72 heures</span></div></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Button asChild className="rounded-xl bg-[#00514d] text-white hover:bg-[#123c3a]"><Link href={orderId ? `/mon-espace/commandes/${orderId}` : "/mon-espace"}>Voir le suivi de cette commande <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button onClick={onRestart} variant="outline" className="rounded-xl border-[#00514d]/20 text-[#00514d]">Faire une autre demande</Button></div></div></main></div>;
}
