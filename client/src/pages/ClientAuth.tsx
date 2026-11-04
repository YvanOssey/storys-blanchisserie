import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CONTACT_PHONE, Logo } from "@/components/Brand";

export default function ClientAuth() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const login = trpc.customerAuth.login.useMutation({ onSuccess: () => { toast.success("Bienvenue dans votre espace Story’s."); navigate("/mon-espace"); }, onError: error => toast.error(error.message) });
  const register = trpc.customerAuth.register.useMutation({ onSuccess: () => { toast.success("Votre espace client est créé."); navigate("/mon-espace"); }, onError: error => toast.error(error.message) });
  const pending = login.isPending || register.isPending;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");
    if (mode === "login") {
      login.mutate({ email, password });
      return;
    }
    register.mutate({ fullName: String(data.get("fullName") || ""), phone: String(data.get("phone") || ""), email, password, address: String(data.get("address") || ""), city: String(data.get("city") || ""), postalCode: String(data.get("postalCode") || "") });
  };

  return <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-[0.9fr_1.1fr]">
    <aside className="band-forest relative hidden flex-col justify-between p-12 text-white lg:flex">
      <Logo tone="light" />
      <div>
        <p className="eyebrow text-gold-bright">Espace client</p>
        <h1 className="mt-5 display-lg max-w-md">Votre linge, <span className="accent-word">votre suivi.</span></h1>
        <ul className="mt-10 max-w-sm divide-y divide-white/10 border-y border-white/10 text-sm text-white/75">
          <li className="flex gap-4 py-4"><span className="font-display text-gold-bright">01</span>Toutes vos commandes au même endroit</li>
          <li className="flex gap-4 py-4"><span className="font-display text-gold-bright">02</span>Chaque étape suivie, de la collecte à la livraison</li>
          <li className="flex gap-4 py-4"><span className="font-display text-gold-bright">03</span>Vos coordonnées gardées pour les prochaines collectes</li>
        </ul>
      </div>
      <p className="text-xs text-white/50">Besoin d’aide ? {CONTACT_PHONE} · Appel & WhatsApp</p>
    </aside>

    <main className="flex flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-10">
      <div className="flex items-center justify-between"><span className="lg:hidden"><Logo /></span><Link href="/" className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-forest"><ArrowLeft className="h-4 w-4" />Accueil</Link></div>
      <div className="mx-auto my-auto w-full max-w-md py-10">
        <div role="tablist" aria-label="Choisir une action" className="grid grid-cols-2 border-b border-line">
          {(["login", "register"] as const).map(value => <button key={value} role="tab" aria-selected={mode === value} type="button" onClick={() => setMode(value)} className={`-mb-px border-b-2 pb-3 text-sm font-bold ${mode === value ? "border-forest text-forest" : "border-transparent text-ink-faint hover:text-ink-muted"}`}>{value === "login" ? "Se connecter" : "Créer mon compte"}</button>)}
        </div>
        <div className="mt-9">
          <p className="eyebrow text-gold">{mode === "login" ? "Retrouver mon espace" : "Première visite"}</p>
          <h2 className="mt-3 display-md text-ink">{mode === "login" ? "Bon retour chez Story’s." : "Commençons par vous connaître."}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{mode === "login" ? "Utilisez l’e-mail et le mot de passe associés à votre compte." : "Ces informations permettront de préparer vos collectes à domicile."}</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          {mode === "register" && <>
            <Field id="fullName" label="Nom complet"><Input id="fullName" name="fullName" required autoComplete="name" placeholder="Ex. Awa Kouassi" className="field" /></Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="phone" label="Téléphone"><Input id="phone" name="phone" required type="tel" autoComplete="tel" placeholder="+225 07…" className="field" /></Field>
              <Field id="city" label="Ville"><Input id="city" name="city" required placeholder="Cocody" className="field" /></Field>
            </div>
            <Field id="address" label="Adresse"><Input id="address" name="address" required autoComplete="street-address" placeholder="Cocody Riviera M’Pouto" className="field" /></Field>
            <Field id="postalCode" label="Code postal" hint="facultatif"><Input id="postalCode" name="postalCode" placeholder="00225" className="field" /></Field>
          </>}
          <Field id="email" label="E-mail"><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" /><Input id="email" name="email" required type="email" autoComplete="email" placeholder="vous@exemple.com" className="field pl-10" /></div></Field>
          <Field id="password" label="Mot de passe"><Input id="password" name="password" required minLength={mode === "register" ? 8 : undefined} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "8 caractères minimum" : "Votre mot de passe"} className="field" /></Field>
          <Button type="submit" disabled={pending} className="mt-2 h-12 w-full rounded-full bg-forest text-sm font-bold text-white hover:bg-forest-deep">{pending ? "Veuillez patienter…" : mode === "login" ? "Ouvrir mon espace" : "Créer mon espace"}<ArrowRight className="h-4 w-4" /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">{mode === "login" ? "Pas encore de compte ? " : "Déjà client ? "}<button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-bold text-forest underline decoration-gold decoration-2 underline-offset-4">{mode === "login" ? "Créer mon espace" : "Se connecter"}</button></p>
      </div>
    </main>
  </div>;
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id} className="text-[13px] font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-ink-faint">({hint})</span>}</Label>{children}</div>;
}
