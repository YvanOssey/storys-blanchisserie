import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { LockKeyhole, ShieldCheck, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

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
    <div className="min-h-screen bg-[#f7f6f1] px-6 py-12 text-[#102033]"><div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center rounded-[2rem] border border-[#102033]/10 bg-white p-8 shadow-[0_24px_80px_rgba(16,32,51,0.10)] sm:p-10"><div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#102033] text-[#f4c46d] shadow-lg"><LockKeyhole className="h-7 w-7" /></div><p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#b3863d]">Administration Story’s</p><h1 className="font-display text-4xl leading-tight">Connexion admin</h1><p className="mt-4 text-sm leading-6 text-[#5e6c7d]">Utilisez l’adresse e-mail autorisée et le mot de passe remis par le responsable de Story’s.</p><form onSubmit={submit} className="mt-8 space-y-5"><div className="space-y-2"><Label htmlFor="admin-login-email">E-mail administrateur</Label><Input id="admin-login-email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="vous@exemple.com" className="h-12 rounded-xl bg-[#faf9f6]" /></div><div className="space-y-2"><Label htmlFor="admin-login-password">Mot de passe</Label><Input id="admin-login-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="8 caractères minimum" className="h-12 rounded-xl bg-[#faf9f6]" /></div><Button type="submit" disabled={login.isPending} className="h-12 w-full rounded-xl bg-[#102033] font-bold text-white hover:bg-[#1c344f]">{login.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{login.isPending ? "Connexion…" : "Se connecter à l’administration"}</Button></form><Link href="/" className="mt-6 block text-center text-sm font-semibold text-[#9a6b22] underline decoration-[#f4c46d] underline-offset-4">Retour à l’espace client</Link></div></div>
  );
}
