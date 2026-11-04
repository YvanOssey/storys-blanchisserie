import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Brand";

export default function NotFound() {
  return <div className="flex min-h-[80vh] w-full flex-col items-center justify-center bg-paper px-5 py-16 text-center text-ink">
    <Logo compact />
    <p className="mt-10 font-display text-[clamp(5rem,18vw,9rem)] leading-none text-forest/15 tabular">404</p>
    <h1 className="-mt-4 display-md">Cette page s’est égarée <span className="accent-word">au lavage.</span></h1>
    <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted">L’adresse demandée n’existe pas ou a été déplacée.</p>
    <Link href="/" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-bold text-white hover:bg-forest-deep"><ArrowLeft className="h-4 w-4" />Retour à l’accueil</Link>
  </div>;
}
