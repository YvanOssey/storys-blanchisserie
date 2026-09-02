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
    <Button type="button" variant="ghost" onClick={toggle} aria-label={`Notifications${unread.data?.length ? `, ${unread.data.length} non lues` : ""}`} className="relative h-10 w-10 rounded-xl text-[#58716c] hover:bg-[#f7f3ec]">
      <Bell className="h-4 w-4" />
      {(unread.data?.length ?? 0) > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#99772a] px-1 text-[9px] font-bold text-white">{unread.data!.length > 9 ? "9+" : unread.data!.length}</span>}
    </Button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[#00514d]/10 bg-white text-left shadow-[0_22px_70px_rgba(0,81,77,0.18)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#00514d]/8 px-4 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#99772a]">Espace personnel</p><h2 className="mt-1 font-display text-xl text-[#00514d]">Notifications</h2></div><div className="flex items-center gap-2"><p className="rounded-full bg-[#fff7df] px-2 py-1 text-[10px] font-bold text-[#8a6924]">{unread.data?.length ?? 0} non lue{(unread.data?.length ?? 0) > 1 ? "s" : ""}</p>{(unread.data?.length ?? 0) > 0 && <button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="rounded-lg p-1.5 text-[#8a6924] hover:bg-[#fff7df]" aria-label="Tout marquer comme lu" title="Tout marquer comme lu"><CheckCheck className="h-4 w-4" /></button>}</div></div>
      <div className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
        {notifications.isLoading ? <p className="p-4 text-sm text-[#6f8580]">Chargement de vos notifications…</p> : notifications.isError ? <p className="p-4 text-sm text-[#9a4d3d]">Impossible de charger vos notifications.</p> : notifications.data?.length ? notifications.data.map(notification => <div key={notification.id} className={`group flex gap-3 rounded-xl p-3 ${notification.readAt ? "bg-white" : "bg-[#fffaf0]"}`}><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-[#c8cfca]" : "bg-[#99772a]"}`} /><Link href={`/mon-espace/commandes/${notification.orderId}`} onClick={() => { if (!notification.readAt) markRead.mutate({ id: notification.id }); setOpen(false); }} className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#123c3a]">{notification.title}</p><p className="mt-1 text-xs leading-5 text-[#647180]">{notification.message}</p><p className="mt-1 text-[10px] text-[#9aa1a8]">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}</p></Link><button type="button" aria-label={`Supprimer ${notification.title}`} onClick={() => remove.mutate({ id: notification.id })} className="self-start rounded-lg p-1.5 text-[#a4adb4] opacity-60 transition hover:bg-[#fff1ee] hover:text-[#b05a49] focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#99772a]"><Trash2 className="h-3.5 w-3.5" /></button></div>) : <div className="p-6 text-center"><Bell className="mx-auto h-5 w-5 text-[#99772a]" /><p className="mt-3 text-sm font-semibold text-[#123c3a]">Aucune notification</p><p className="mt-1 text-xs leading-5 text-[#6f8580]">Les mises à jour de vos commandes apparaîtront ici.</p></div>}
      </div>
      <div className="flex items-center gap-2 border-t border-[#00514d]/8 px-4 py-3 text-[10px] text-[#8c969d]"><Check className="h-3.5 w-3.5 text-[#367957]" />Le son s’active après ton premier clic sur la cloche.</div>
    </div>}
  </div>;
}
