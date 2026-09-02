import { Link } from "wouter";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrackOrder() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-5 py-10 text-[#123c3a]"><div className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,81,77,0.10)] sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f6ef] text-[#00514d]"><LockKeyhole className="h-7 w-7" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-[#99772a]">Suivi sécurisé Story’s</p><h1 className="mt-3 font-display text-4xl text-[#00514d]">Votre suivi est dans votre espace.</h1><p className="mt-4 text-sm leading-7 text-[#647180]">Connectez-vous pour consulter uniquement vos commandes et suivre leur avancement de la collecte à la livraison.</p><Button asChild className="mt-7 rounded-xl bg-[#00514d] text-white hover:bg-[#123c3a]"><Link href="/connexion">Se connecter <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><p className="mt-5 text-sm text-[#6f8580]">Pas encore de compte ? <Link href="/connexion" className="font-bold text-[#00514d]">Créer mon espace</Link></p></div></div>;
}
