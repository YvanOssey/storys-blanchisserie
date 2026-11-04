import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Logo } from "@/components/Brand";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.adminAuth.login.useMutation({
    onSuccess: () => window.location.reload(),
    onError: error => toast.error("Connexion impossible", { description: error.message }),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || password.length < 8) {
      toast.error("Informations incomplètes", { description: "Saisissez un e-mail et un mot de passe d’au moins 8 caractères." });
      return;
    }
    login.mutate({ email: email.trim().toLowerCase(), password });
  };

  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-[1fr_1fr]">
      <aside className="band-forest hidden flex-col justify-between p-12 text-white lg:flex">
        <Logo tone="light" />
        <div><p className="eyebrow text-gold-bright">Atelier · Gestion</p><h1 className="mt-5 display-lg max-w-md">Chaque commande, <span className="accent-word">au bon tempo.</span></h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/60">Commandes, clients, paiements et tournées : l’activité de Story’s au même endroit.</p></div>
        <p className="text-xs text-white/45">Accès réservé aux administrateurs autorisés.</p>
      </aside>
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <span className="lg:hidden"><Logo /></span>
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <p className="eyebrow text-gold">Administration Story’s</p>
          <h2 className="mt-4 display-md">Connexion admin</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">Utilisez l’adresse e-mail autorisée et le mot de passe remis par le responsable de Story’s.</p>
          <form onSubmit={submit} className="mt-9 space-y-5">
            <div className="space-y-2"><Label htmlFor="admin-login-email" className="text-[13px] font-semibold">E-mail administrateur</Label><Input id="admin-login-email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="vous@exemple.com" className="field" /></div>
            <div className="space-y-2"><Label htmlFor="admin-login-password" className="text-[13px] font-semibold">Mot de passe</Label><Input id="admin-login-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="8 caractères minimum" className="field" /></div>
            <Button type="submit" disabled={login.isPending} className="h-12 w-full rounded-full bg-forest font-bold text-white hover:bg-forest-deep">{login.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{login.isPending ? "Connexion…" : "Se connecter"}</Button>
          </form>
          <Link href="/" className="mt-8 block text-center text-sm font-semibold text-ink-muted hover:text-forest">← Retour à l’espace client</Link>
        </div>
      </main>
    </div>
  );
}
