import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, publicOffers } from "@/lib/laundry";
import { ArrowRight, Check, CheckCircle2, Clock3, Loader2, MapPin, Phone } from "lucide-react";
import { CONTACT_PHONE, SiteHeader } from "@/components/Brand";

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

const serviceChoices = [
  ...publicOffers.map(offer => ({ value: offer.name as string, label: offer.name as string, price: formatCurrency(offer.priceCents), detail: offer.features[2] })),
  { value: "Nettoyage & lustrage de chaussures", label: "Chaussures", price: "1 000 FCFA", detail: "Nettoyage & lustrage, par paire" },
];

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

  const busy = customerSession.isLoading || createCustomerOrder.isPending;
  const shortDate = (value: string, hour: string) => formatDate(new Date(`${value}T${hour}`), { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader back={{ href: "/", label: "Accueil" }} cta={{ href: customerSession.data ? "/mon-espace" : "/connexion", label: "Mon espace" }} />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 md:pt-14">
        <div className="max-w-2xl">
          <p className="eyebrow text-gold">Demande de collecte</p>
          <h1 className="mt-4 display-lg text-ink">Réservez votre <span className="accent-word">soin.</span></h1>
          <p className="mt-4 text-sm leading-6 text-ink-muted">Trois étapes, deux minutes. L’atelier vous recontacte pour confirmer le tarif et le passage. Aucun paiement n’est demandé maintenant.</p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
          <form id="order-form" onSubmit={submit} className="space-y-14" noValidate>
            {customerSession.data && <div className="flex items-start gap-3 rounded-none border border-success/20 bg-success-soft px-4 py-3 text-sm text-ink-muted"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><p><span className="font-bold text-ink">Vous êtes connecté.</span> Vos coordonnées sont reprises depuis votre espace personnel.</p></div>}
            {showErrors && <div role="alert" className="rounded-none border border-danger/30 bg-danger-soft p-4 text-sm text-danger"><p className="font-bold">Votre demande n’est pas encore complète.</p><p className="mt-1 text-xs leading-5">Renseignez les coordonnées, les créneaux et une quantité ou un poids pour continuer.</p></div>}

            <FormSection number="01" title="Vos coordonnées">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nom complet" required htmlFor="fullName" className="sm:col-span-2"><Input id="fullName" autoComplete="name" aria-invalid={showErrors && !customerSession.data && !form.fullName} value={form.fullName} onChange={event => update("fullName", event.target.value)} placeholder="Ex. Awa Kouassi" className="field" /></Field>
                <Field label="Téléphone" required htmlFor="phone"><Input id="phone" autoComplete="tel" aria-invalid={showErrors && !customerSession.data && !form.phone} type="tel" value={form.phone} onChange={event => update("phone", event.target.value)} placeholder="+225 07 00 00 00 00" className="field" /></Field>
                <Field label="E-mail" htmlFor="email"><Input id="email" autoComplete="email" type="email" value={form.email} onChange={event => update("email", event.target.value)} placeholder="vous@email.com" className="field" /></Field>
                <Field label="Adresse de collecte" required htmlFor="address" className="sm:col-span-2"><Input id="address" autoComplete="street-address" aria-invalid={showErrors && !customerSession.data && !form.address} value={form.address} onChange={event => update("address", event.target.value)} placeholder="Résidence, rue, repère…" className="field" /></Field>
                <Field label="Ville" required htmlFor="city"><Input id="city" aria-invalid={showErrors && !customerSession.data && !form.city} value={form.city} onChange={event => update("city", event.target.value)} placeholder="Cocody" className="field" /></Field>
                <Field label="Code postal" hint="facultatif" htmlFor="postalCode"><Input id="postalCode" value={form.postalCode} onChange={event => update("postalCode", event.target.value)} placeholder="00225" className="field" /></Field>
              </div>
              {showErrors && !customerSession.data && <p className="mt-3 text-xs font-semibold text-danger">Vérifiez votre nom, téléphone et adresse de collecte.</p>}
            </FormSection>

            <FormSection number="02" title="La prestation">
              <fieldset>
                <legend className="mb-3 text-[13px] font-semibold text-ink">Type de soin <span className="text-gold">*</span></legend>
                <div className="grid gap-3 sm:grid-cols-2">{serviceChoices.map(choice => {
                  const selected = form.service === choice.value;
                  return <label key={choice.value} className={`relative flex cursor-pointer items-start gap-3 rounded-none border p-4 transition-colors ${selected ? "border-forest bg-forest-soft/60" : "border-line-strong bg-white/60 hover:border-forest/50"}`}>
                    <input type="radio" name="service" value={choice.value} checked={selected} onChange={() => update("service", choice.value)} className="sr-only" />
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-forest" : "border-line-strong"}`}>{selected && <span className="h-1.5 w-1.5 rounded-full bg-forest" />}</span>
                    <span className="min-w-0 flex-1"><span className="flex items-baseline justify-between gap-2"><span className="font-display text-lg text-ink">{choice.label}</span><span className="text-sm font-bold text-forest tabular">{choice.price}</span></span><span className="mt-0.5 block text-xs text-ink-muted">{choice.detail}</span></span>
                  </label>;
                })}</div>
              </fieldset>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Nombre de pièces" htmlFor="itemCount"><Input id="itemCount" aria-invalid={showErrors && !form.itemCount && !form.weightKg} type="number" min="1" value={form.itemCount} onChange={event => update("itemCount", event.target.value)} placeholder="Ex. 12" className="field" /></Field>
                <Field label="Poids estimé (kg)" htmlFor="weightKg"><Input id="weightKg" aria-invalid={showErrors && !form.itemCount && !form.weightKg} inputMode="decimal" value={form.weightKg} onChange={event => update("weightKg", event.target.value)} placeholder="Ex. 4,5" className="field" /></Field>
              </div>
              <p className={`mt-3 text-xs ${showErrors && !form.itemCount && !form.weightKg ? "font-semibold text-danger" : "text-ink-faint"}`}>Indiquez au moins le nombre de pièces ou le poids estimé.</p>
            </FormSection>

            <FormSection number="03" title="Les créneaux">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Collecte souhaitée" required htmlFor="pickupDate"><Input id="pickupDate" aria-invalid={showErrors && !form.pickupDate} type="date" min={today} value={form.pickupDate} onChange={event => update("pickupDate", event.target.value)} className="field" /></Field>
                <Field label="Livraison souhaitée" required htmlFor="deliveryDate"><Input id="deliveryDate" aria-invalid={showErrors && !form.deliveryDate} type="date" min={form.pickupDate || today} value={form.deliveryDate} onChange={event => update("deliveryDate", event.target.value)} className="field" /></Field>
                <Field label="Consignes particulières" htmlFor="instructions" className="sm:col-span-2"><Textarea id="instructions" value={form.instructions} onChange={event => update("instructions", event.target.value)} placeholder="Accès, tache délicate, textile fragile…" className="min-h-28 resize-none rounded-full border-line-strong bg-white/70 shadow-none" /></Field>
              </div>
              {showErrors && (!form.pickupDate || !form.deliveryDate) && <p className="mt-3 text-xs font-semibold text-danger">Choisissez une date de collecte et une date de livraison.</p>}
            </FormSection>

            {!customerSession.isLoading && !customerSession.data && <div className="rounded-none border border-gold/40 bg-gold-soft p-5"><p className="text-sm font-bold text-ink">Connectez-vous pour finaliser.</p><p className="mt-1 text-xs leading-5 text-ink-muted">Un compte vous permet de retrouver votre commande et son avancement dans votre espace personnel.</p><Button asChild className="mt-4 h-10 rounded-full bg-forest text-white hover:bg-forest-deep"><Link href="/connexion">Se connecter ou créer un compte <ArrowRight className="h-4 w-4" /></Link></Button></div>}
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-forest text-sm font-bold text-white hover:bg-forest-deep lg:hidden">{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi de la demande…</> : !customerSession.data ? <>Connexion requise <ArrowRight className="h-4 w-4" /></> : <>Envoyer ma demande <ArrowRight className="h-4 w-4" /></>}</Button>
          </form>

          {/* Récapitulatif : reste visible pendant la saisie sur grand écran */}
          <aside className="lg:sticky lg:top-24">
            <div className="panel overflow-hidden">
              <div className="border-b border-dashed border-line-strong px-6 py-5"><p className="eyebrow text-gold">Votre demande</p><p className="mt-2 font-display text-2xl text-ink">{form.service === "Nettoyage & lustrage de chaussures" ? "Chaussures" : `Formule ${form.service}`}</p></div>
              <dl className="divide-y divide-line px-6 text-sm">
                <ReviewItem label="Client" value={form.fullName} placeholder="À renseigner" />
                <ReviewItem label="Téléphone" value={form.phone} placeholder="À renseigner" />
                <ReviewItem label="E-mail" value={form.email} placeholder="Non renseigné" />
                <ReviewItem label="Adresse" value={form.address ? `${form.address}, ${form.postalCode || ""} ${form.city || ""}` : ""} placeholder="À renseigner" />
                <ReviewItem label="Volume" value={form.itemCount ? `${form.itemCount} pièce${form.itemCount === "1" ? "" : "s"}` : form.weightKg ? `${form.weightKg} kg estimés` : ""} placeholder="À préciser" />
                <ReviewItem label="Collecte" value={form.pickupDate ? shortDate(form.pickupDate, "09:00:00") : ""} placeholder="À choisir" />
                <ReviewItem label="Livraison" value={form.deliveryDate ? shortDate(form.deliveryDate, "18:00:00") : ""} placeholder="À choisir" />
              </dl>
              {form.instructions && <p className="border-t border-line px-6 py-4 text-xs leading-5 text-ink-muted"><span className="font-semibold text-ink">Consignes :</span> {form.instructions}</p>}
              <div className="hidden border-t border-line p-5 lg:block"><Button type="submit" form="order-form" disabled={busy} className="h-12 w-full rounded-full bg-forest text-sm font-bold text-white hover:bg-forest-deep">{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</> : !customerSession.data ? <>Connexion requise <ArrowRight className="h-4 w-4" /></> : <>Envoyer ma demande <ArrowRight className="h-4 w-4" /></>}</Button></div>
            </div>
            <ul className="mt-5 space-y-2 px-1 text-xs text-ink-muted">
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gold" />Sans engagement, tarif confirmé par l’atelier</li>
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gold" />Zone : Cocody Riviera M’Pouto</li>
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold" />{CONTACT_PHONE} · Appel & WhatsApp</li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section><div className="mb-6 flex items-baseline gap-4 border-b border-line pb-3"><span className="font-display text-sm text-gold tabular">{number}</span><h2 className="font-display text-2xl text-ink">{title}</h2></div>{children}</section>;
}

function Field({ label, htmlFor, required = false, hint, className = "", children }: { label: string; htmlFor: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode }) {
  return <div className={`space-y-2 ${className}`}><Label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink">{label}{required && <span className="text-gold"> *</span>}{hint && <span className="ml-1 font-normal text-ink-faint">({hint})</span>}</Label>{children}</div>;
}

function ReviewItem({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  return <div className="flex items-baseline justify-between gap-4 py-3"><dt className="shrink-0 text-xs text-ink-faint">{label}</dt><dd className={`min-w-0 truncate text-right ${value ? "font-semibold text-ink" : "italic text-ink-faint"}`}>{value || placeholder}</dd></div>;
}

function Confirmation({ orderId, orderNumber, onRestart }: { orderId?: number; orderNumber: string; onRestart: () => void }) {
  return <div className="min-h-screen bg-paper text-ink"><SiteHeader /><main className="mx-auto max-w-xl px-5 py-16 text-center sm:px-8 md:py-24">
    <div className="rise mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest text-gold-bright"><Check className="h-7 w-7" /></div>
    <p className="rise rise-1 eyebrow mt-8 justify-center text-gold">Demande bien reçue</p>
    <h1 className="rise rise-1 mt-4 display-lg">Merci, nous prenons <span className="accent-word">le relais.</span></h1>
    <p className="rise rise-2 mx-auto mt-5 max-w-md text-sm leading-7 text-ink-muted">Votre demande <strong className="font-bold text-forest">{orderNumber}</strong> est arrivée à l’atelier. Nous vous recontactons pour confirmer le tarif et le créneau.</p>
    <div className="rise rise-3 mx-auto mt-9 grid max-w-md grid-cols-2 border-y border-line text-left"><p className="flex items-center gap-3 py-4 pr-3 text-xs text-ink-muted"><Phone className="h-4 w-4 shrink-0 text-gold" />Nous vous appelons pour confirmer</p><p className="flex items-center gap-3 border-l border-line py-4 pl-4 text-xs text-ink-muted"><Clock3 className="h-4 w-4 shrink-0 text-gold" />Délai indicatif de 72 heures</p></div>
    <div className="rise rise-4 mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild className="h-12 rounded-full bg-forest px-6 font-bold text-white hover:bg-forest-deep"><Link href={orderId ? `/mon-espace/commandes/${orderId}` : "/mon-espace"}>Suivre cette commande <ArrowRight className="h-4 w-4" /></Link></Button><Button onClick={onRestart} variant="outline" className="h-12 rounded-full border-line-strong bg-transparent px-6 font-bold text-forest hover:bg-forest-soft">Faire une autre demande</Button></div>
  </main></div>;
}
