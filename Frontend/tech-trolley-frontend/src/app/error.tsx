"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><section className="max-w-lg text-center"><AlertTriangle className="mx-auto h-12 w-12 text-amber-500" /><h1 className="mt-5 text-2xl font-bold text-slate-950">The page could not be loaded</h1><p className="mt-2 text-sm text-slate-500">Try the request again. Your saved backend data has not been changed.</p><Button onClick={reset} className="mt-6"><RotateCcw className="h-4 w-4" />Try again</Button></section></main>;
}
