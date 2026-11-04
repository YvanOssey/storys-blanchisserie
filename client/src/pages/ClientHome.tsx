import { Link } from "wouter";
import { ArrowRight, Check, Minus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCustomerTrackingPath, publicOffers } from "@/lib/laundry";
import { CONTACT_PHONE, NavLink, SectionTitle, SiteFooter, SiteHeader, WHATSAPP_URL } from "@/components/Brand";

const steps = [
  { title: "Vous commandez", text: "En ligne, en quelques minutes. Choisissez votre formule et vos dates." },
  { title: "Nous collectons", text: "L’atelier confirme le passage sous 24 heures et vient chercher votre linge." },
  { title: "L’atelier soigne", text: "Lavage, séchage et repassage selon la formule choisie." },
  { title: "Nous livrons", text: "Linge propre et plié, rapporté chez vous. Délai indicatif de 72 heures." },
];

// La police n’a pas d’espace fine insécable : on la remplace par une espace insécable classique.
const groupDigits = (value: number) => value.toLocaleString("fr-FR").replace(/ /g, " ");

export default function ClientHome() {
  const customerSession = trpc.customerAuth.me.useQuery();
  const trackingPath = getCustomerTrackingPath(Boolean(customerSession.data));

  return <div className="min-h-screen bg-paper text-ink">
    <SiteHeader cta={{ href: "/commander", label: "Commander" }}>
      <NavLink href="#fonctionnement">Fonctionnement</NavLink>
      <NavLink href="#formules">Formules</NavLink>
      <NavLink href={customerSession.data ? "/mon-espace" : "/connexion"}>Mon espace</NavLink>
    </SiteHeader>

    <main>
      {/* Hero : affiche typographique à gauche, étiquette de pressing à droite */}
      <section className="mx-auto grid max-w-6xl items-end gap-14 px-5 pb-20 pt-10 sm:px-8 md:pt-16 lg:grid-cols-[1.3fr_0.7fr] lg:gap-10">
        <div>
          <p className="rise eyebrow text-gold">Cocody Riviera M’Pouto · Abidjan</p>
          <h1 className="rise rise-1 mt-7 display-xl">Où la propreté rime avec <span className="accent-word">le soin.</span></h1>
          <p className="rise rise-2 mt-8 max-w-lg text-lg leading-8 text-ink-muted">Nous collectons votre linge chez vous, l’atelier le lave et le repasse, nous vous le rapportons. Vous suivez chaque étape depuis votre espace.</p>
          <div className="rise rise-3 mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
            <Link href="/commander" className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-forest px-7 text-sm font-bold text-paper hover:bg-ink hover:text-gold-bright">Passer une commande<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            <Link href={trackingPath} className="link-arrow group inline-flex min-h-11 items-center gap-2 text-sm font-semibold">Suivre ma commande<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </div>
        <CareLabel />
      </section>

      {/* Chiffres clés : coupe condensée, filets */}
      <section className="border-y border-ink" aria-label="En chiffres">
        <dl className="mx-auto grid max-w-6xl grid-cols-3 px-5 sm:px-8">
          <Fact value="24 h" label="pour confirmer la collecte" />
          <Fact value="72 h" label="de traitement indicatif" divider />
          <Fact value="2×" label="passages par mois" divider />
        </dl>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="bg-linen">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
          <SectionTitle index="01" eyebrow="Fonctionnement" title={<>Quatre étapes, <span className="accent-word">aucun déplacement.</span></>} />
          <ol className="mt-14 grid gap-px bg-line-strong sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => <li key={step.title} className="bg-linen p-6 sm:pr-8">
              <p className="figure text-6xl text-forest">0{index + 1}</p>
              <h3 className="mt-6 font-display text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{step.text}</p>
            </li>)}
          </ol>
        </div>
      </section>

      {/* Formules */}
      <section id="formules" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <SectionTitle index="02" eyebrow="Formules mensuelles" title="Choisissez le niveau de soin.">Récupération et livraison à domicile incluses, deux passages par mois.</SectionTitle>
        <div className="mt-14 grid border border-ink md:grid-cols-3">
          {publicOffers.map((offer, index) => <Offer key={offer.name} name={offer.name} price={offer.priceCents} featured={offer.name === "Confort"} first={index === 0} />)}
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-x border-b border-ink px-6 py-5 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-muted">En complément : <strong className="font-semibold text-ink">nettoyage & lustrage de chaussures</strong></p>
          <p className="flex items-baseline gap-2"><span className="figure text-3xl text-forest">{groupDigits(1000)}&nbsp;FCFA</span><span className="meta text-ink-faint">/ paire</span></p>
        </div>
      </section>

      {/* Appel final : bande or, texte encre */}
      <section className="bg-gold-bright">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr] md:py-20">
          <div><p className="eyebrow text-ink before:!bg-ink">Une question avant de commander ?</p><h2 className="mt-5 display-lg">Parlons de votre linge.</h2><p className="mt-5 max-w-md text-base leading-7 text-ink/75">Appelez ou écrivez-nous : l’équipe vous répond et vous aide à choisir la bonne formule.</p></div>
          <div className="flex flex-col gap-4 md:items-end">
            <a href={WHATSAPP_URL} className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-ink px-7 text-sm font-bold text-paper hover:bg-paper hover:text-ink">Écrire sur WhatsApp<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
            <p className="meta text-ink/70">ou appelez le {CONTACT_PHONE}</p>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>;
}

function Fact({ value, label, divider = false }: { value: string; label: string; divider?: boolean }) {
  return <div className={`py-8 ${divider ? "border-l border-line pl-4 sm:pl-8" : ""}`}><dt className="figure text-5xl text-ink sm:text-7xl">{value}</dt><dd className="mt-3 text-xs leading-5 text-ink-muted sm:text-sm">{label}</dd></div>;
}

function Offer({ name, price, featured, first }: { name: string; price: number; featured: boolean; first: boolean }) {
  const rows = [
    { label: "Récupération et livraison", on: true },
    { label: "02 passages par mois", on: true },
    { label: "Lavage", on: true },
    { label: "Repassage", on: name !== "Essentiel" },
    { label: name === "Prestige" ? "Literie incluse" : "Literie non incluse", on: name === "Prestige" },
  ];
  return <article className={`flex flex-col p-7 sm:p-8 ${featured ? "band-forest" : "bg-paper"} ${first ? "" : "border-t border-ink md:border-l md:border-t-0"}`}>
    <div className="flex items-center justify-between gap-3"><h3 className="font-display text-2xl">{name}</h3>{featured && <span className="meta rounded-full bg-gold-bright px-2.5 py-1 text-[10px] text-ink">Le plus choisi</span>}</div>
    <p className={`mt-8 figure text-7xl ${featured ? "text-gold-bright" : "text-forest"}`}>{groupDigits(price)}</p>
    <p className={`meta mt-2 ${featured ? "text-paper/60" : "text-ink-faint"}`}>FCFA / mois</p>
    <ul className={`mt-8 flex-1 divide-y border-t text-sm ${featured ? "divide-paper/15 border-paper/15" : "divide-line border-line"}`}>{rows.map(row => <li key={row.label} className={`flex items-center gap-3 py-3 ${row.on ? "" : featured ? "text-paper/40" : "text-ink-faint"}`}>{row.on ? <Check className={`h-4 w-4 shrink-0 ${featured ? "text-gold-bright" : "text-forest"}`} /> : <Minus className="h-4 w-4 shrink-0" />}{row.label}</li>)}</ul>
    <Link href="/commander" className={`group mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-full text-sm font-bold ${featured ? "bg-gold-bright text-ink hover:bg-paper" : "border border-ink text-ink hover:bg-ink hover:text-paper"}`}>Choisir {name}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
  </article>;
}

const careSymbols = [
  { label: "Lavage délicat 30 °C", icon: <><path d="M4 9h24l-3 14H7L4 9Z" /><path d="M4 9c2 2 4 2 6 0s4-2 6 0 4 2 6 0 4-2 6 0" /><text x="16" y="20" textAnchor="middle" fontSize="7" fontWeight="700" stroke="none" fill="currentColor">30</text></> },
  { label: "Sans javel", icon: <><path d="M16 5 28 26H4L16 5Z" /><path d="M7 8l18 18M25 8 7 26" /></> },
  { label: "Séchage doux", icon: <><rect x="5" y="5" width="22" height="22" /><circle cx="16" cy="16" r="7" /><circle cx="16" cy="16" r="1.2" fill="currentColor" /></> },
  { label: "Repassage à la main", icon: <><path d="M5 23h22l-2-9c-.5-2.5-2.5-4-5-4h-6c-3 0-5 1-6 3L5 23Z" /><path d="M14 10V7h8" /><circle cx="13" cy="18" r="1" fill="currentColor" /><circle cx="19" cy="18" r="1" fill="currentColor" /></> },
  { label: "Plié avec soin", icon: <><circle cx="16" cy="16" r="11" /><text x="16" y="20.5" textAnchor="middle" fontSize="12" fontWeight="700" stroke="none" fill="currentColor">S</text></> },
];

/**
 * L’étiquette d’entretien cousue dans chaque vêtement, tissée aux couleurs de
 * Story’s : lisière piquée, pli en tête, symboles d’entretien.
 */
function CareLabel() {
  return <figure className="relative mx-auto w-full max-w-[300px] lg:mb-2">
    <div className="tag-swing band-forest relative px-7 pb-8 pt-10 outline outline-1 outline-forest-deep">
      {/* Pli cousu en tête et lisière piquée */}
      <div className="absolute inset-x-0 top-0 h-5 border-b border-dashed border-gold-bright/50 bg-forest-deep" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-2 top-7 border border-dashed border-gold-bright/35" aria-hidden="true" />
      <p className="meta text-center text-[10px] text-gold-bright/80">Atelier · Cocody</p>
      <p className="mt-2 text-center font-display text-4xl text-paper">Story’s</p>
      <p className="mt-6 text-center figure text-7xl text-gold-bright">100&nbsp;%</p>
      <p className="meta mt-2 text-center text-paper/70">soin</p>
      <ul className="mt-8 flex justify-between border-y border-paper/20 py-4 text-gold-bright" aria-label="Symboles d’entretien">
        {careSymbols.map(symbol => <li key={symbol.label} title={symbol.label}><svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" role="img" aria-label={symbol.label}>{symbol.icon}</svg></li>)}
      </ul>
      <ul className="mt-5 space-y-1.5 text-center text-xs text-paper/75">
        <li>Lavé à 30 °C, sans javel</li>
        <li>Repassé à la main</li>
        <li>Plié et livré chez vous</li>
      </ul>
      <p className="meta mt-7 text-center text-[10px] text-paper/45">Fait avec soin à Abidjan</p>
    </div>
  </figure>;
}
