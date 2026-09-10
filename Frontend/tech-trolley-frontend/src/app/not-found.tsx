import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><section className="max-w-lg text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-blue-600"><MapPinned className="h-8 w-8" /></span><p className="mt-6 text-sm font-bold uppercase tracking-[.2em] text-blue-600">404</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Page not found</h1><p className="mt-3 text-slate-500">This Tech Trolley page does not exist or is no longer available.</p><Link href="/dashboard" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link></section></main>;
}
