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
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(840, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Le badge visuel reste disponible si le navigateur bloque l’audio.
  }
}

export default function CustomerNotificationBell() {
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousUnread = useRef<number | null>(null);
  const utils = trpc.useUtils();
  const notifications = trpc.customer.notifications.useQuery({ }, { refetchInterval: 30000 });
  const unread = trpc.customer.notifications.useQuery({ unreadOnly: true }, { refetchInterval: 30000 });
  const markRead = trpc.customer.markNotificationRead.useMutation({ onSuccess: () => { void utils.customer.notifications.invalidate(); } });
  const remove = trpc.customer.removeNotification.useMutation({ onSuccess: () => { toast.success("Notification supprimée."); void utils.customer.notifications.invalidate(); }, onError: error => toast.error(error.message) });
  const markAllRead = trpc.customer.markAllNotificationsRead.useMutation({ onSuccess: () => { toast.success("Toutes les notifications sont marquées comme lues."); void utils.customer.notifications.invalidate(); }, onError: error => toast.error(error.message) });

  useEffect(() => {
    const count = unread.data?.length ?? 0;
    if (previousUnread.current !== null && count > previousUnread.current) {
      toast.success("Nouvelle notification", { description: "Une mise à jour de votre commande est disponible.", duration: 3500 });
      if (soundEnabled) playNotificationSound();
    }
    previousUnread.current = count;
  }, [unread.data?.length, soundEnabled]);

  function toggle() {
    setOpen(value => !value);
    setSoundEnabled(true);
  }

  return <div className="relative">
    <Button type="button" variant="ghost" onClick={toggle} aria-label={`Notifications${unread.data?.length ? `, ${unread.data.length} non lues` : ""}`} className="relative h-9 w-9 text-paper hover:bg-paper/10 hover:text-gold-bright">
      <Bell className="h-4 w-4" />
      {(unread.data?.length ?? 0) > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">{unread.data!.length > 9 ? "9+" : unread.data!.length}</span>}
    </Button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-none border border-forest/10 bg-white text-left shadow-[0_22px_70px_rgba(0,81,77,0.18)]">
      <div className="flex items-start justify-between gap-4 border-b border-forest/8 px-4 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Espace personnel</p><h2 className="mt-1 font-display text-xl text-forest">Notifications</h2></div><div className="flex items-center gap-2"><p className="rounded-full bg-gold-soft px-2 py-1 text-[10px] font-bold text-warning">{unread.data?.length ?? 0} non lue{(unread.data?.length ?? 0) > 1 ? "s" : ""}</p>{(unread.data?.length ?? 0) > 0 && <button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="rounded-none p-1.5 text-warning hover:bg-gold-soft" aria-label="Tout marquer comme lu" title="Tout marquer comme lu"><CheckCheck className="h-4 w-4" /></button>}</div></div>
      <div className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
        {notifications.isLoading ? <p className="p-4 text-sm text-ink-muted">Chargement de vos notifications…</p> : notifications.isError ? <p className="p-4 text-sm text-danger">Impossible de charger vos notifications.</p> : notifications.data?.length ? notifications.data.map(notification => <div key={notification.id} className={`group flex gap-3 rounded-none p-3 ${notification.readAt ? "bg-white" : "bg-gold-soft"}`}><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-[#c8cfca]" : "bg-gold"}`} /><Link href={`/mon-espace/commandes/${notification.orderId}`} onClick={() => { if (!notification.readAt) markRead.mutate({ id: notification.id }); setOpen(false); }} className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{notification.title}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{notification.message}</p><p className="mt-1 text-[10px] text-ink-faint">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}</p></Link><button type="button" aria-label={`Supprimer ${notification.title}`} onClick={() => remove.mutate({ id: notification.id })} className="self-start rounded-none p-1.5 text-ink-faint opacity-60 transition hover:bg-danger-soft hover:text-danger focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"><Trash2 className="h-3.5 w-3.5" /></button></div>) : <div className="p-6 text-center"><Bell className="mx-auto h-5 w-5 text-gold" /><p className="mt-3 text-sm font-semibold text-ink">Aucune notification</p><p className="mt-1 text-xs leading-5 text-ink-muted">Les mises à jour de vos commandes apparaîtront ici.</p></div>}
      </div>
      <div className="flex items-center gap-2 border-t border-forest/8 px-4 py-3 text-[10px] text-ink-faint"><Check className="h-3.5 w-3.5 text-success" />Le son s’active après ton premier clic sur la cloche.</div>
    </div>}
  </div>;
}
