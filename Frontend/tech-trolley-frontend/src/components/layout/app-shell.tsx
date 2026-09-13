"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Store,
  UserRound,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/auth-context";
import { navigation, roleCanAccess } from "@/config/navigation";
import { initials } from "@/utils/format";
import { LoadingState } from "@/components/ui";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isHydrating, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const items = useMemo(
    () =>
      user ? navigation.filter((item) => item.roles.includes(user.role)) : [],
    [user],
  );

  useEffect(() => {
    if (isHydrating) return;
    if (!user) router.replace("/login");
    else if (!roleCanAccess(user.role, pathname)) router.replace("/dashboard");
  }, [isHydrating, pathname, router, user]);

  if (isHydrating || !user)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <LoadingState label="Verifying your session…" />
      </div>
    );

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = search.toLowerCase();
    const match = items.find((item) =>
      item.label.toLowerCase().includes(query),
    );
    if (match) {
      router.push(match.href);
      setSearch("");
    }
  }

  const sidebar = (
    <>
      <div className="flex h-24 items-center justify-between px-5">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/tech-trolley-logo.png"
            alt="Tech Trolley"
            width={54}
            height={54}
            className="h-12 w-12 shrink-0 rounded-full"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-white">
              Tech Trolley
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-slate-400">
              Technology · Trust
            </p>
          </div>
        </Link>
        <button
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-3"
        aria-label="Main navigation"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                active
                  ? "bg-[#0865f9] text-white shadow-lg shadow-blue-950/20"
                  : "text-slate-300 hover:bg-white/7 hover:text-white",
              )}
            >
              <Icon className="h-[19px] w-[19px]" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/7 hover:text-white"
        >
          <UserRound className="h-5 w-5" />
          My account
        </Link>
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/7 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[.035] px-3 py-3">
          <Store className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-xs font-semibold text-white">Tech Trolley</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-[linear-gradient(180deg,#001a38,#000b1a)] lg:flex">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="relative flex h-full w-[285px] flex-col bg-[linear-gradient(180deg,#001a38,#000b1a)] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-[76px] items-center gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <form onSubmit={submitSearch} className="relative max-w-xl flex-1">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pages, sales, products, customers…"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            aria-label="Search navigation"
          />
        </form>
        <div className="relative ml-auto shrink-0">
          <button
            onClick={() => setProfileOpen((value) => !value)}
            className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-50"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-xs font-bold text-white">
              {initials(user.name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-36 truncate text-sm font-semibold text-slate-900">
                {user.name}
              </span>
              <span className="block text-xs capitalize text-slate-500">
                {user.role.toLowerCase()}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4" />
                My account
              </Link>
              <button
                onClick={() => void logout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
