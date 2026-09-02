import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronDown,
  LockKeyhole,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PackageCheck,
  Users,
  WalletCards,
  CalendarDays,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import AdminNotificationBell from "./AdminNotificationBell";
import AdminLogin from "@/pages/AdminLogin";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useIsMobile } from "@/hooks/useMobile";

const menuItems = [
  { icon: LayoutDashboard, label: "Vue d’ensemble", path: "/admin" },
  { icon: PackageCheck, label: "Commandes", path: "/admin/orders" },
  { icon: Users, label: "Clients", path: "/admin/clients" },
  { icon: WalletCards, label: "Paiements", path: "/admin/payments" },
  { icon: CalendarDays, label: "Planning", path: "/admin/planning" },
  { icon: ShieldCheck, label: "Administrateurs", path: "/admin/administrateurs" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) return <AdminLogin />;

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#f7f6f1] px-6 py-12 text-[#102033]">
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center rounded-[2rem] border border-[#102033]/10 bg-white p-10 text-center shadow-[0_24px_80px_rgba(16,32,51,0.10)]">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff5df] text-[#b3863d] shadow-sm">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#b3863d]">Accès administrateur</p>
          <h1 className="font-display text-4xl leading-tight">Espace réservé.</h1>
          <p className="mt-4 text-sm leading-6 text-[#5e6c7d]">Ce compte ne possède pas les droits nécessaires pour accéder à la gestion Story’s.</p>
          <Link href="/" className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#102033] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1c344f]">Retour à l’espace client</Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = { children: React.ReactNode; setSidebarWidth: (width: number) => void };

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location) ?? (location === "/" ? menuItems[0] : undefined);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - sidebarLeft;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0 bg-[#102033] text-white" disableTransition={isResizing}>
          <SidebarHeader className="h-auto border-b border-white/10 px-4 py-5">
            <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4c46d] text-[#102033] transition-colors hover:bg-[#f8d48d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c46d]" aria-label="Réduire la navigation">
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="font-display text-xl leading-none text-white">Story’s</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Lavage & soins à domicile</p>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-3 py-5">
            {!isCollapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Gestion Story’s</p>}
            <SidebarMenu className="gap-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-11 rounded-xl font-medium transition-all ${isActive ? "bg-white text-[#102033] shadow-lg shadow-black/10 hover:bg-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
                      <Icon className={`h-[18px] w-[18px] ${isActive ? "text-[#b3863d]" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c46d] group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 shrink-0 border border-white/20 bg-white/10">
                    <AvatarFallback className="bg-[#f4c46d] text-xs font-bold text-[#102033]">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold leading-none text-white">{user?.name || "Utilisateur"}</p>
                    <p className="mt-1.5 truncate text-xs text-white/45">{user?.email || "Compte propriétaire"}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/35 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() => void logout().then(() => { window.location.assign("/admin"); })}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-xs font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c46d] group-data-[collapsible=icon]:justify-center"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Se déconnecter</span>
            </button>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-[#f4c46d]/50 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} style={{ zIndex: 50 }} />
      </div>

      <SidebarInset className="bg-[#f7f6f1]">
        <div className="flex items-center justify-between gap-4 border-b border-[#102033]/10 bg-white px-4 py-3 sm:px-6 lg:px-10">
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#8c969d] sm:block">Session administrateur Story’s</p>
          <div className="ml-auto flex items-center gap-2">
            <AdminNotificationBell />
            <button
              type="button"
              onClick={() => void logout().then(() => { window.location.assign("/admin"); })}
              className="inline-flex items-center gap-2 rounded-xl border border-[#102033]/10 bg-[#102033] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1c344f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c46d]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Se déconnecter
            </button>
          </div>
        </div>
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#102033]/10 bg-[#f7f6f1]/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-xl bg-white text-[#102033] shadow-sm" />
              <span className="text-sm font-semibold text-[#102033]">{activeMenuItem?.label ?? "Menu"}</span>
            </div>
            <div className="flex items-center gap-2"><Link href="/admin/orders?new=1" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#102033] px-3 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" />Commande</Link><span className="font-display text-lg text-[#102033]">Story’s</span></div>
          </div>
        )}
        <main className="min-h-screen p-4 sm:p-6 lg:p-10">{children}</main>
      </SidebarInset>
    </>
  );
}
