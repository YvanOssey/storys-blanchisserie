import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Clients from "./pages/Clients";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import AdminWhitelist from "./pages/AdminWhitelist";
import ClientHome from "./pages/ClientHome";
import PublicOrder from "./pages/PublicOrder";
import ClientAuth from "./pages/ClientAuth";
import CustomerSpace from "./pages/CustomerSpace";
import OrderDetail from "./pages/OrderDetail";
import Planning from "./pages/Planning";

function InternalRouter() {
  return <DashboardLayout><Switch><Route path="/admin" component={Dashboard} /><Route path="/admin/orders" component={Orders} /><Route path="/admin/clients" component={Clients} /><Route path="/admin/payments" component={Payments} /><Route path="/admin/planning" component={Planning} /><Route path="/admin/administrateurs" component={AdminWhitelist} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></DashboardLayout>;
}

function Router() {
  return <Switch><Route path="/" component={ClientHome} /><Route path="/connexion" component={ClientAuth} /><Route path="/mon-espace" component={CustomerSpace} /><Route path="/mon-espace/commandes/:id" component={OrderDetail} /><Route path="/commander" component={PublicOrder} /><Route path="/suivre" component={CustomerSpace} /><Route component={InternalRouter} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
