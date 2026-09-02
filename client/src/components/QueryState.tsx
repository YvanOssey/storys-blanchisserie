import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export function QueryError({ onRetry, message = "Les données n’ont pas pu être chargées." }: { onRetry: () => void; message?: string }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-[#b05a49]/20 bg-[#fdf5f2] px-6 py-10 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f9e9e6] text-[#b05a49]"><AlertCircle className="h-5 w-5" /></div><h3 className="mt-4 font-display text-xl text-[#102033]">Un contretemps dans l’atelier</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#8c969d]">{message}</p><Button variant="outline" onClick={onRetry} className="mt-5 rounded-xl border-[#b05a49]/25 bg-white text-[#9b4d3f] hover:bg-[#f9e9e6]"><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button></div>;
}
