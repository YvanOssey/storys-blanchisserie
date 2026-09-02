import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Plus, Route as RouteIcon, Truck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const dayMs = 24 * 60 * 60 * 1000;
const statusLabels: Record<string, string> = { scheduled: "Planifiée", confirmed: "Confirmée", in_progress: "En cours", completed: "Terminée", cancelled: "Annulée" };
const routeLabels: Record<string, string> = { pickup: "Collecte", delivery: "Livraison" };

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

function formatDay(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(timestamp));
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}

export default function Planning() {
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [courierVehicle, setCourierVehicle] = useState("");
  const [routeKind, setRouteKind] = useState<"pickup" | "delivery">("pickup");
  const [routeDate, setRouteDate] = useState(weekAnchor.toISOString().slice(0, 10));
  const [routeZone, setRouteZone] = useState("");
  const [assignmentOrderId, setAssignmentOrderId] = useState("");
  const [assignmentKind, setAssignmentKind] = useState<"pickup" | "delivery">("pickup");
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignmentTime, setAssignmentTime] = useState("09:00");
  const [assignmentAddress, setAssignmentAddress] = useState("");
  const [assignmentCourierId, setAssignmentCourierId] = useState("");
  const utils = trpc.useUtils();
  const from = weekAnchor.getTime();
  const to = from + 7 * dayMs - 1;
  const calendar = trpc.operations.calendar.useQuery({ from, to });
  const couriers = trpc.operations.couriers.useQuery();
  const routes = trpc.operations.routes.useQuery({ from, to });
  const orders = trpc.orders.list.useQuery();
  const createCourier = trpc.operations.createCourier.useMutation({ onSuccess: () => { toast.success("Livreur ajouté au planning."); setCourierName(""); setCourierPhone(""); setCourierVehicle(""); setShowCourierForm(false); void utils.operations.couriers.invalidate(); }, onError: error => toast.error(error.message) });
  const updateCourier = trpc.operations.updateCourier.useMutation({ onSuccess: () => { toast.success("Statut du livreur mis à jour."); void utils.operations.couriers.invalidate(); }, onError: error => toast.error(error.message) });
  const createRoute = trpc.operations.createRoute.useMutation({ onSuccess: () => { toast.success("Tournée créée."); setShowRouteForm(false); setRouteZone(""); void utils.operations.routes.invalidate(); }, onError: error => toast.error(error.message) });
  const updateRoute = trpc.operations.updateRoute.useMutation({ onSuccess: () => { toast.success("Tournée mise à jour."); void utils.operations.routes.invalidate(); }, onError: error => toast.error(error.message) });
  const assign = trpc.operations.assign.useMutation({ onSuccess: () => { toast.success("Commande affectée à l’opération."); setShowAssignmentForm(false); setAssignmentOrderId(""); setAssignmentAddress(""); void utils.operations.calendar.invalidate(); }, onError: error => toast.error(error.message) });
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => from + index * dayMs), [from]);

  function submitCourier(event: React.FormEvent) {
    event.preventDefault();
    createCourier.mutate({ fullName: courierName, phone: courierPhone, vehicle: courierVehicle || undefined });
  }

  function submitRoute(event: React.FormEvent) {
    event.preventDefault();
    createRoute.mutate({ routeDate: new Date(`${routeDate}T08:00:00`).getTime(), kind: routeKind, zone: routeZone || undefined });
  }

  function submitAssignment(event: React.FormEvent) {
    event.preventDefault();
    const order = orders.data?.find(item => item.order.id === Number(assignmentOrderId));
    if (!order) { toast.error("Sélectionnez une commande valide."); return; }
    assign.mutate({ orderId: order.order.id, kind: assignmentKind, scheduledAt: new Date(`${assignmentDate}T${assignmentTime}:00`).getTime(), address: assignmentAddress || "Adresse client à confirmer", courierId: assignmentCourierId ? Number(assignmentCourierId) : null });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b3863d]">Opérations</p><h1 className="mt-2 font-display text-4xl text-[#102033] sm:text-5xl">Planning opérationnel</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#667384]">Organisez les collectes et livraisons, affectez les livreurs et gardez une vue claire des tournées de la semaine.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setShowCourierForm(value => !value)}><UserRound className="mr-2 h-4 w-4" />Livreur</Button><Button variant="outline" onClick={() => setShowRouteForm(value => !value)}><RouteIcon className="mr-2 h-4 w-4" />Tournée</Button><Button onClick={() => setShowAssignmentForm(value => !value)} className="bg-[#102033] text-white hover:bg-[#1c344f]"><Plus className="mr-2 h-4 w-4" />Affecter une commande</Button></div>
      </header>

      {(showCourierForm || showRouteForm || showAssignmentForm) && <Card className="border-[#f4c46d]/50 bg-[#fffaf0] shadow-sm"><CardContent className="p-5">
        {showCourierForm && <form onSubmit={submitCourier} className="grid gap-4 md:grid-cols-4"><div><Label>Nom complet</Label><Input value={courierName} onChange={event => setCourierName(event.target.value)} placeholder="Ex. Ibrahim Koné" required /></div><div><Label>Téléphone</Label><Input value={courierPhone} onChange={event => setCourierPhone(event.target.value)} placeholder="+225 ..." required /></div><div><Label>Véhicule</Label><Input value={courierVehicle} onChange={event => setCourierVehicle(event.target.value)} placeholder="Moto, voiture..." /></div><div className="flex items-end"><Button type="submit" disabled={createCourier.isPending} className="w-full bg-[#0c5c55] text-white hover:bg-[#084c47]">{createCourier.isPending ? "Ajout..." : "Ajouter le livreur"}</Button></div></form>}
        {showRouteForm && <form onSubmit={submitRoute} className="grid gap-4 md:grid-cols-4"><div><Label>Type de tournée</Label><select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={routeKind} onChange={event => setRouteKind(event.target.value as "pickup" | "delivery")}><option value="pickup">Collecte</option><option value="delivery">Livraison</option></select></div><div><Label>Date</Label><Input type="date" value={routeDate} onChange={event => setRouteDate(event.target.value)} required /></div><div><Label>Zone</Label><Input value={routeZone} onChange={event => setRouteZone(event.target.value)} placeholder="Riviera, Cocody..." /></div><div className="flex items-end"><Button type="submit" disabled={createRoute.isPending} className="w-full bg-[#0c5c55] text-white hover:bg-[#084c47]">{createRoute.isPending ? "Création..." : "Créer la tournée"}</Button></div></form>}
        {showAssignmentForm && <form onSubmit={submitAssignment} className="grid gap-4 md:grid-cols-3"><div><Label>Commande</Label><select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={assignmentOrderId} onChange={event => setAssignmentOrderId(event.target.value)} required><option value="">Sélectionner...</option>{orders.data?.map(item => <option value={item.order.id} key={item.order.id}>{item.order.orderNumber} — {item.customerName}</option>)}</select></div><div><Label>Opération</Label><select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={assignmentKind} onChange={event => setAssignmentKind(event.target.value as "pickup" | "delivery")}><option value="pickup">Collecte</option><option value="delivery">Livraison</option></select></div><div><Label>Livreur</Label><select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={assignmentCourierId} onChange={event => setAssignmentCourierId(event.target.value)}><option value="">À affecter plus tard</option>{couriers.data?.filter(courier => courier.status === "active").map(courier => <option value={courier.id} key={courier.id}>{courier.fullName}</option>)}</select></div><div><Label>Date</Label><Input type="date" value={assignmentDate} onChange={event => setAssignmentDate(event.target.value)} required /></div><div><Label>Heure</Label><Input type="time" value={assignmentTime} onChange={event => setAssignmentTime(event.target.value)} required /></div><div><Label>Adresse</Label><Input value={assignmentAddress} onChange={event => setAssignmentAddress(event.target.value)} placeholder="Adresse de collecte/livraison" required /></div><div className="md:col-span-3"><Button type="submit" disabled={assign.isPending} className="bg-[#0c5c55] text-white hover:bg-[#084c47]">{assign.isPending ? "Affectation..." : "Enregistrer l’affectation"}</Button></div></form>}
      </CardContent></Card>}

      <div className="grid gap-4 md:grid-cols-3"><Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-[#e1f1ed] p-3 text-[#0c5c55]"><CalendarDays className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-[#8a96a3]">Opérations planifiées</p><p className="mt-1 text-2xl font-bold text-[#102033]">{calendar.data?.length ?? 0}</p></div></CardContent></Card><Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-[#fff3d8] p-3 text-[#b3863d]"><Truck className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-[#8a96a3]">Livreurs actifs</p><p className="mt-1 text-2xl font-bold text-[#102033]">{couriers.data?.filter(courier => courier.status === "active").length ?? 0}</p></div></CardContent></Card><Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-[#e9e9f5] p-3 text-[#555b9b]"><RouteIcon className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-[#8a96a3]">Tournées de la semaine</p><p className="mt-1 text-2xl font-bold text-[#102033]">{routes.data?.length ?? 0}</p></div></CardContent></Card></div>

      <Card className="border-0 shadow-sm"><CardHeader className="flex flex-col gap-4 border-b border-[#102033]/8 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="font-display text-2xl text-[#102033]">Semaine du {formatDay(from)}</CardTitle><p className="mt-1 text-sm text-[#758192]">Vue des créneaux de collecte et de livraison</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setWeekAnchor(new Date(from - 7 * dayMs))}>Semaine précédente</Button><Button variant="outline" size="sm" onClick={() => setWeekAnchor(startOfWeek(new Date()))}>Aujourd’hui</Button><Button variant="outline" size="sm" onClick={() => setWeekAnchor(new Date(from + 7 * dayMs))}>Semaine suivante</Button></div></CardHeader><CardContent className="p-4"><div className="grid gap-3 md:grid-cols-7">{days.map(day => { const dayItems = calendar.data?.filter(item => new Date(item.assignment.scheduledAt).toDateString() === new Date(day).toDateString()) ?? []; return <div key={day} className="min-h-40 rounded-2xl bg-[#f7f6f1] p-3"><p className="text-xs font-bold capitalize text-[#102033]">{formatDay(day)}</p>{dayItems.length === 0 ? <p className="mt-8 text-center text-xs text-[#9aa3ad]">Aucun créneau</p> : <div className="mt-3 space-y-2">{dayItems.map(item => <div key={item.assignment.id} className="rounded-xl border border-white bg-white p-3 shadow-sm"><div className="flex items-center justify-between gap-2"><Badge className={item.assignment.kind === "pickup" ? "bg-[#e1f1ed] text-[#0c5c55]" : "bg-[#fff3d8] text-[#8a6924]"}>{routeLabels[item.assignment.kind]}</Badge><span className="text-[11px] font-semibold text-[#758192]">{formatTime(item.assignment.scheduledAt)}</span></div><p className="mt-2 truncate text-xs font-bold text-[#102033]">{item.customer?.fullName ?? "Client"}</p><p className="mt-1 truncate text-[11px] text-[#758192]">{item.assignment.address}</p><p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#8c969d]"><Clock3 className="h-3 w-3" />{statusLabels[item.assignment.status]}</p></div>)}</div>}</div>})}</div></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2"><Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-2xl text-[#102033]"><Truck className="h-5 w-5 text-[#b3863d]" />Livreurs</CardTitle></CardHeader><CardContent className="space-y-3">{couriers.isLoading ? <p className="text-sm text-[#758192]">Chargement des livreurs...</p> : couriers.data?.length ? couriers.data.map(courier => <div key={courier.id} className="flex items-center justify-between rounded-2xl bg-[#f7f6f1] p-4"><div><p className="font-semibold text-[#102033]">{courier.fullName}</p><p className="mt-1 text-xs text-[#758192]">{courier.phone}{courier.vehicle ? ` · ${courier.vehicle}` : ""}</p></div><div className="flex items-center gap-2"><Badge className={courier.status === "active" ? "bg-[#e1f1ed] text-[#0c5c55]" : "bg-[#eceff2] text-[#758192]"}>{courier.status === "active" ? "Actif" : "Inactif"}</Badge><Button variant="ghost" size="sm" onClick={() => updateCourier.mutate({ id: courier.id, status: courier.status === "active" ? "inactive" : "active" })} className="text-xs text-[#526477]">{courier.status === "active" ? "Désactiver" : "Activer"}</Button></div></div>) : <div className="rounded-2xl border border-dashed border-[#102033]/15 p-6 text-center text-sm text-[#758192]">Aucun livreur. Ajoutez votre première personne de terrain.</div>}</CardContent></Card><Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-2xl text-[#102033]"><RouteIcon className="h-5 w-5 text-[#b3863d]" />Tournées</CardTitle></CardHeader><CardContent className="space-y-3">{routes.isLoading ? <p className="text-sm text-[#758192]">Chargement des tournées...</p> : routes.data?.length ? routes.data.map(item => <div key={item.route.id} className="flex items-center justify-between rounded-2xl bg-[#f7f6f1] p-4"><div><p className="font-semibold text-[#102033]">{routeLabels[item.route.kind]} · {formatDay(item.route.routeDate)}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#758192]"><MapPin className="h-3 w-3" />{item.route.zone || "Zone à préciser"}{item.courier ? ` · ${item.courier.fullName}` : " · livreur à affecter"}</p></div><select aria-label={`Statut de la tournée ${item.route.id}`} className="h-8 rounded-lg border border-[#b3863d]/30 bg-white px-2 text-xs font-semibold text-[#8a6924]" value={item.route.status} onChange={event => updateRoute.mutate({ id: item.route.id, status: event.target.value as "planned" | "in_progress" | "completed" | "cancelled" })}><option value="planned">Planifiée</option><option value="in_progress">En cours</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select></div>) : <div className="rounded-2xl border border-dashed border-[#102033]/15 p-6 text-center text-sm text-[#758192]">Aucune tournée sur cette semaine.</div>}</CardContent></Card></div>

      {calendar.isError && <p className="text-sm text-red-600">Impossible de charger le calendrier. Actualisez la page pour réessayer.</p>}
      {calendar.data?.some(item => item.assignment.status === "completed") && <p className="flex items-center gap-2 text-sm text-[#0c5c55]"><CheckCircle2 className="h-4 w-4" />Les opérations terminées restent visibles pour faciliter le suivi de la journée.</p>}
    </div>
  );
}
