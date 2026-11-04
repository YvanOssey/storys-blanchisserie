import { Link } from "wouter";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/Brand";

export default function TrackOrder() {
  return <div className="min-h-screen bg-paper text-ink"><SiteHeader /><main className="mx-auto max-w-lg px-5 py-20 text-center sm:px-8"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-gold-bright"><LockKeyhole className="h-6 w-6" /></div><p className="eyebrow mt-8 justify-center text-gold">Suivi sécurisé</p><h1 className="mt-4 display-lg">Votre suivi est dans <span className="accent-word">votre espace.</span></h1><p className="mt-5 text-sm leading-7 text-ink-muted">Connectez-vous pour consulter uniquement vos commandes et suivre leur avancement, de la collecte à la livraison.</p><Button asChild className="mt-8 h-12 rounded-full bg-forest px-6 font-bold text-white hover:bg-forest-deep"><Link href="/connexion">Se connecter <ArrowRight className="h-4 w-4" /></Link></Button><p className="mt-6 text-sm text-ink-muted">Pas encore de compte ? <Link href="/connexion" className="font-bold text-forest underline decoration-gold decoration-2 underline-offset-4">Créer mon espace</Link></p></main></div>;
}
