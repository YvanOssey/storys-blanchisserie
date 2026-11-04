import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Les navigateurs peuvent bloquer l’audio automatique ; l’alerte visuelle reste disponible.
  }
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousUnread = useRef<number | null>(null);
  const utils = trpc.useUtils();
  const notifications = trpc.adminNotifications.list.useQuery({ limit: 30 }, { refetchInterval: 30000 });
  const unread = trpc.adminNotifications.list.useQuery({ unreadOnly: true }, { refetchInterval: 30000 });
  const markRead = trpc.adminNotifications.markRead.useMutation({ onSuccess: () => { void utils.adminNotifications.list.invalidate(); } });
  const remove = trpc.adminNotifications.remove.useMutation({ onSuccess: () => { toast.success("Notification supprimée."); void utils.adminNotifications.list.invalidate(); }, onError: error => toast.error(error.message) });
  const markAllRead = trpc.adminNotifications.markAllRead.useMutation({ onSuccess: () => { toast.success("Toutes les notifications sont marquées comme lues."); void utils.adminNotifications.list.invalidate(); }, onError: error => toast.error(error.message) });

  useEffect(() => {
    const count = unread.data?.length ?? 0;
    if (previousUnread.current !== null && count > previousUnread.current) {
      toast.success("Nouvelle notification", { description: "Une nouvelle commande est disponible.", duration: 3500 });
      if (soundEnabled) playNotificationSound();
    }
    previousUnread.current = count;
  }, [unread.data?.length, soundEnabled]);

  function toggle() {
    setOpen(value => !value);
    setSoundEnabled(true);
  }

  return <div className="relative">
    <Button type="button" variant="outline" onClick={toggle} aria-label={`Notifications${unread.data?.length ? `, ${unread.data.length} non lues` : ""}`} className="relative h-9 w-9 rounded-none border-forest/10 bg-white p-0 text-ink hover:bg-gold-soft">
      <Bell className="h-4 w-4" />
      {(unread.data?.length ?? 0) > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">{unread.data!.length > 9 ? "9+" : unread.data!.length}</span>}
    </Button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-none border border-forest/10 bg-white shadow-[0_22px_70px_rgba(16,32,51,0.18)]">
      <div className="flex items-start justify-between gap-4 border-b border-forest/8 px-4 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Centre d’alertes</p><h2 className="mt-1 font-display text-xl text-ink">Notifications</h2></div><div className="flex items-center gap-2"><p className="rounded-full bg-gold-soft px-2 py-1 text-[10px] font-bold text-warning">{unread.data?.length ?? 0} non lue{(unread.data?.length ?? 0) > 1 ? "s" : ""}</p>{(unread.data?.length ?? 0) > 0 && <button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="rounded-none p-1.5 text-warning hover:bg-gold-soft" aria-label="Tout marquer comme lu" title="Tout marquer comme lu"><CheckCheck className="h-4 w-4" /></button>}</div></div>
      <div className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
        {notifications.isLoading ? <p className="p-4 text-sm text-ink-muted">Chargement des notifications…</p> : notifications.isError ? <p className="p-4 text-sm text-danger">Impossible de charger les notifications.</p> : notifications.data?.length ? notifications.data.map(notification => <div key={notification.id} className={`group flex gap-3 rounded-none p-3 ${notification.readAt ? "bg-white" : "bg-gold-soft"}`}><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-[#c8cfca]" : "bg-gold"}`} /><Link href={notification.orderId ? "/admin/orders" : "/admin"} onClick={() => { if (!notification.readAt) markRead.mutate({ id: notification.id }); setOpen(false); }} className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{notification.title}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{notification.message}</p><p className="mt-1 text-[10px] text-ink-faint">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}</p></Link><button type="button" aria-label={`Supprimer ${notification.title}`} onClick={() => remove.mutate({ id: notification.id })} className="self-start rounded-none p-1.5 text-ink-faint opacity-60 transition hover:bg-danger-soft hover:text-danger focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"><Trash2 className="h-3.5 w-3.5" /></button></div>) : <div className="p-6 text-center"><Bell className="mx-auto h-5 w-5 text-gold" /><p className="mt-3 text-sm font-semibold text-ink">Aucune notification</p><p className="mt-1 text-xs leading-5 text-ink-muted">Les nouvelles commandes apparaîtront ici.</p></div>}
      </div>
      <div className="flex items-center gap-2 border-t border-forest/8 px-4 py-3 text-[10px] text-ink-faint"><Check className="h-3.5 w-3.5 text-forest" />Le son s’active après ton premier clic sur la cloche.</div>
    </div>}
  </div>;
}
