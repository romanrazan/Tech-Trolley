"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types";
import { Card } from "@/components/ui";

export function RoleGate({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user || roles.includes(user.role)) return children;
  return (
    <Card className="grid min-h-80 place-items-center p-8 text-center">
      <div>
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Access restricted
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your {user.role.toLowerCase()} account cannot use this page.
        </p>
      </div>
    </Card>
  );
}
