"use client";

import {
  CalendarDays,
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, PageHeader } from "@/components/page-kit";
import { Badge, Card } from "@/components/ui";
import { formatDate } from "@/utils/format";

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div>
      <PageHeader
        title="My account"
        description="This verified profile is loaded from the backend /auth/me endpoint."
      />
      <Card className="overflow-hidden">
        <div className="h-28 bg-[linear-gradient(120deg,#0058e8,#0b7aff,#06a6c7)]" />
        <div className="px-5 pb-8 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
            <span className="rounded-full border-4 border-white">
              <Avatar name={user.name} color="blue" />
            </span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-950">{user.name}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <Badge tone={user.isActive ? "success" : "danger"}>
              {user.isActive ? "Active account" : "Inactive account"}
            </Badge>
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Mail, label: "Email", value: user.email },
              { icon: ShieldCheck, label: "Role", value: user.role },
              {
                icon: CalendarDays,
                label: "Member since",
                value: formatDate(user.createdAt),
              },
              {
                icon: CheckCircle2,
                label: "Status",
                value: user.isActive ? "Active" : "Inactive",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <Icon className="h-5 w-5 text-blue-600" />
                <dt className="mt-3 text-xs text-slate-400">{label}</dt>
                <dd className="mt-1 break-words font-semibold text-slate-800">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              <UserRound className="h-4 w-4 text-blue-600" />
              Profile management
            </p>
            <p className="mt-1">
              The current backend exposes a verified read-only profile through
              /auth/me. Profile editing is intentionally not simulated.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
