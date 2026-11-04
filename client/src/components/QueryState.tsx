import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export function QueryError({ onRetry, message = "Les données n’ont pas pu être chargées." }: { onRetry: () => void; message?: string }) {
  return <div className="flex flex-col items-center justify-center rounded-none border border-danger/20 bg-danger-soft/60 px-6 py-10 text-center"><AlertCircle className="h-6 w-6 text-danger" /><h3 className="mt-4 font-display text-xl text-ink">Un contretemps dans l’atelier</h3><p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">{message}</p><Button variant="outline" onClick={onRetry} className="mt-5 rounded-full border-danger/25 bg-card text-danger hover:bg-danger-soft"><RefreshCw className="h-4 w-4" />Réessayer</Button></div>;
}
