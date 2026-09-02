import { useState } from "react";
import { ShieldCheck, UserPlus, UserRoundX, Mail, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryState";
import { trpc } from "@/lib/trpc";

export default function AdminWhitelist() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const entries = trpc.adminWhitelist.list.useQuery();
  const utils = trpc.useUtils();
  const addEntry = trpc.adminWhitelist.add.useMutation({
    onSuccess: () => {
      setEmail("");
      setPassword("");
      setDisplayName("");
      toast.success("Administrateur autorisé", { description: "Cette adresse pourra ouvrir l’espace admin avec le mot de passe défini." });
      void utils.adminWhitelist.list.invalidate();
    },
    onError: error => toast.error("Impossible d’ajouter cette adresse", { description: error.message }),
  });
  const removeEntry = trpc.adminWhitelist.remove.useMutation({
    onSuccess: () => {
      toast.success("Accès révoqué", { description: "Cette adresse ne pourra plus accéder aux opérations admin." });
      void utils.adminWhitelist.list.invalidate();
    },
    onError: error => toast.error("Impossible de révoquer cet accès", { description: error.message }),
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !displayName.trim() || password.length < 8) {
      toast.error("Informations incomplètes", { description: "Renseignez le nom, l’adresse e-mail et un mot de passe d’au moins 8 caractères." });
      return;
    }
    addEntry.mutate({ email: normalized, password, displayName: displayName.trim() });
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-7">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-[#b3863d]">Sécurité Story’s</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102033] sm:text-5xl">Administrateurs</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647180]">Autorisez plusieurs comptes à gérer Story’s. Une adresse retirée perd immédiatement ses droits admin.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[#fff5df] px-4 py-3 text-xs font-semibold text-[#9a6b22]"><ShieldCheck className="h-4 w-4" /> Accès sur autorisation</div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="soft-card rounded-2xl border-0 bg-[#102033] text-white">
          <CardHeader className="p-6"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4c46d] text-[#102033]"><UserPlus className="h-5 w-5" /></div><CardTitle className="mt-5 font-display text-3xl font-medium text-white">Inviter un administrateur</CardTitle><p className="text-sm leading-6 text-white/60">Créez l’accès que votre collaborateur utilisera pour se connecter à l’administration Story’s.</p></CardHeader>
          <CardContent className="p-6 pt-0"><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="admin-name" className="text-white/75">Nom affiché</Label><Input id="admin-name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Prénom Nom" className="h-12 rounded-xl border-white/10 bg-white/10 text-white placeholder:text-white/35" /></div><div className="space-y-2"><Label htmlFor="admin-email" className="text-white/75">Adresse e-mail</Label><Input id="admin-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="collaborateur@exemple.com" className="h-12 rounded-xl border-white/10 bg-white/10 text-white placeholder:text-white/35" /></div><div className="space-y-2"><Label htmlFor="admin-password" className="text-white/75">Mot de passe initial</Label><Input id="admin-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="8 caractères minimum" className="h-12 rounded-xl border-white/10 bg-white/10 text-white placeholder:text-white/35" /></div><Button type="submit" disabled={addEntry.isPending} className="h-12 w-full rounded-xl bg-[#f4c46d] font-bold text-[#102033] hover:bg-[#ffd98e]">{addEntry.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}{addEntry.isPending ? "Ajout…" : "Autoriser cet administrateur"}</Button></form></CardContent>
        </Card>

        <Card className="soft-card rounded-2xl border-0 bg-white"><CardHeader className="border-b border-[#102033]/[0.07] p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#b3863d]">Liste d’autorisation</p><CardTitle className="mt-1 font-display text-2xl font-medium text-[#102033]">Accès actifs</CardTitle></div><Badge variant="secondary" className="rounded-full bg-[#f7f6f1] text-[#647180]">{entries.data?.length ?? 0}</Badge></div></CardHeader><CardContent className="p-0">{entries.isLoading ? <div className="space-y-3 p-6">{[1, 2, 3].map(item => <Skeleton key={item} className="h-16 w-full rounded-xl bg-[#f0eee8]" />)}</div> : entries.isError ? <div className="p-6"><QueryError message="La liste des administrateurs n’a pas pu être chargée." onRetry={() => void entries.refetch()} /></div> : entries.data?.length ? <div className="divide-y divide-[#102033]/[0.07]">{entries.data.map(entry => <div key={entry.id} className="flex flex-wrap items-center gap-3 px-6 py-4"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef7f3] text-[#0d6b5f]"><Mail className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#26384a]">{entry.email}</p><p className="mt-1 text-xs text-[#8c969d]">Autorisé le {new Date(entry.createdAt).toLocaleDateString("fr-FR")}</p></div></div><Button type="button" variant="outline" disabled={removeEntry.isPending} onClick={() => removeEntry.mutate({ id: entry.id })} className="rounded-xl border-[#102033]/10 text-[#a44c4c] hover:bg-[#fff0ee] hover:text-[#8f3838]"><UserRoundX className="mr-2 h-4 w-4" />Révoquer</Button></div>)}</div> : <div className="px-6 py-14 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#c8a65c]" /><h3 className="mt-4 font-display text-xl text-[#102033]">Aucun accès ajouté</h3><p className="mt-2 text-sm leading-6 text-[#8c969d]">Les accès sont contrôlés par la liste d’autorisation et les sessions locales.</p></div>}</CardContent></Card>
      </div>
    </div>
  );
}

