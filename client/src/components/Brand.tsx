import { Link } from "wouter";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { customerStatusSteps, statusLabels, statusStyles } from "@/lib/laundry";

export const CONTACT_PHONE = "+225 07 77 06 72 90";
export const WHATSAPP_URL = "https://wa.me/2250777067290";

/** Capsule pleine vert Story’s : pas de flou, pas de verre, pas d’ombre. */
const pill = "flex h-12 items-center rounded-full border border-forest-deep bg-forest text-paper transition-colors hover:border-gold-bright";

export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  const light = tone === "light";
  return <Link href="/" className="inline-flex items-center gap-3" aria-label="Story’s, retour à l’accueil">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${light ? "bg-paper/10" : "bg-forest"}`}><img src="/logo.PNG" alt="" className="h-7 w-7 object-contain" /></span>
    {!compact && <span className="leading-none"><span className={`block font-display text-xl ${light ? "text-paper" : "text-ink"}`}>Story’s</span><span className={`meta mt-1 block text-[10px] ${light ? "text-gold-bright" : "text-ink-faint"}`}>Lavage · soins à domicile</span></span>}
  </Link>;
}

/**
 * Navigation en pilules : logo · liens · action. Sur les pages de parcours, la
 * première pilule devient un retour.
 */
export function SiteHeader({ children, back, cta, actions }: { children?: React.ReactNode; back?: { href: string; label: string }; cta?: { href: string; label: string }; actions?: React.ReactNode }) {
  return <header className="sticky top-0 z-30 bg-paper">
    <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
      {back
        ? <Link href={back.href} className={`${pill} gap-2 px-5 text-sm font-semibold`}><ArrowLeft className="h-4 w-4" />{back.label}</Link>
        : <Link href="/" className={`${pill} gap-3 pl-1.5 pr-5`} aria-label="Story’s, accueil"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10"><img src="/logo.PNG" alt="" className="h-7 w-7 object-contain" /></span><span className="font-display text-lg">Story’s</span></Link>}
      {children && <nav aria-label="Navigation principale" className={`${pill} hidden gap-7 px-7 text-sm font-semibold md:flex`}>{children}</nav>}
      {cta ? <Link href={cta.href} className="flex h-12 items-center gap-2 rounded-full bg-gold-bright px-6 text-sm font-bold text-ink hover:bg-ink hover:text-gold-bright">{cta.label}<ArrowUpRight className="h-4 w-4" /></Link> : actions ? <div className={`${pill} gap-1 px-1.5`}>{actions}</div> : <span className="hidden md:block md:w-12" />}
    </div>
  </header>;
}

/** Lien de navigation à l’intérieur de la pilule centrale. */
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = "relative py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-gold-bright after:transition-transform hover:after:scale-x-100";
  return href.startsWith("#") || href.startsWith("/#") ? <a href={href} className={className}>{children}</a> : <Link href={href} className={className}>{children}</Link>;
}

export function SiteFooter() {
  return <footer className="band-forest">
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-16 sm:px-8">
      <p className="display-lg max-w-2xl">Propre. Repassé. <span className="accent-word">Livré chez vous.</span></p>
      <div className="mt-14 grid gap-10 border-t border-paper/15 pt-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div><Logo tone="light" /><p className="mt-5 max-w-xs text-sm leading-6 text-paper/65">Atelier de lavage et de repassage à Cocody Riviera M’Pouto. Collecte et livraison à domicile.</p></div>
        <div><p className="meta text-gold-bright">Contact</p><a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="mt-4 block text-sm font-semibold hover:text-gold-bright">{CONTACT_PHONE}</a><a href={WHATSAPP_URL} className="link-arrow mt-2 inline-block text-sm font-semibold">Écrire sur WhatsApp</a></div>
        <div><p className="meta text-gold-bright">Raccourcis</p><nav className="mt-4 grid gap-2 text-sm text-paper/75"><Link href="/commander" className="hover:text-gold-bright">Passer une commande</Link><Link href="/connexion" className="hover:text-gold-bright">Mon espace client</Link><a href="/#formules" className="hover:text-gold-bright">Nos formules</a></nav></div>
      </div>
      <p className="meta mt-12 text-paper/45">© {new Date().getFullYear()} Story’s · Cocody, Abidjan</p>
    </div>
  </footer>;
}

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status as keyof typeof statusStyles] ?? "border-line bg-paper text-ink-muted"} ${className}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{statusLabels[status as keyof typeof statusLabels] ?? status}</span>;
}

/** Fil de progression : une ligne continue qui se remplit d’étape en étape. */
export function StatusTrack({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const activeIndex = customerStatusSteps.findIndex(step => step.key === status);
  const progress = activeIndex <= 0 ? 0 : (activeIndex / (customerStatusSteps.length - 1)) * 100;
  const dot = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  return <div className="w-full" role="img" aria-label={`Étape ${activeIndex + 1} sur ${customerStatusSteps.length} : ${statusLabels[status as keyof typeof statusLabels] ?? status}`}>
    <div className="relative mx-[7%]">
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
      <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-forest transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
      <div className="relative flex justify-between">{customerStatusSteps.map((step, index) => <span key={step.key} className={`${dot} rounded-full border-2 ${index < activeIndex ? "border-forest bg-forest" : index === activeIndex ? "border-ink bg-gold-bright" : "border-line-strong bg-paper"}`} />)}</div>
    </div>
    <div className="mt-3 grid grid-cols-6">{customerStatusSteps.map((step, index) => <span key={step.key} className={`text-center leading-tight ${size === "sm" ? "text-[10px] sm:text-xs" : "text-xs"} ${index === activeIndex ? "font-bold text-ink" : index < activeIndex ? "text-ink-muted" : "text-ink-faint"}`}>{step.label}</span>)}</div>
  </div>;
}

export function PageLoader({ label }: { label: string }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper text-sm text-ink-muted"><span className="h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-forest" />{label}</div>;
}

export function SectionTitle({ eyebrow, index, title, children, className = "" }: { eyebrow: string; index?: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return <div className={className}><p className="eyebrow text-gold">{index && <span className="text-ink-faint">{index}</span>}{eyebrow}</p><h2 className="mt-5 display-lg text-ink">{title}</h2>{children && <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted">{children}</p>}</div>;
}
