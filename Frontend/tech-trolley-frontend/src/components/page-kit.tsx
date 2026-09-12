"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[.15em] text-blue-600">
            {eyebrow}
          </p>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

export function StatCard({
  label,
  value,
  note = "Current total",
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  note?: string;
  icon: LucideIcon;
  tone?: "blue" | "cyan" | "orange" | "green" | "violet" | "red";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    cyan: "bg-cyan-50 text-cyan-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="flex min-h-32 items-center gap-4 overflow-hidden p-4">
      <div
        className={clsx(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
          toneClasses[tone],
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-600">
          {label}
        </p>

        <p className="mt-1 break-words text-xl font-bold leading-tight tracking-tight text-slate-950 xl:text-2xl">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-400">{note}</p>
      </div>
    </Card>
  );
}

export function DataTable({
  headers,
  children,
  loading,
  error,
  empty,
  onRetry,
}: {
  headers: string[];
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  onRetry?: () => void;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (empty) {
    return (
      <EmptyState
        title="No matching records"
        message="Try a different search or add the first record."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/80">
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function TableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={clsx(
        "px-4 py-3.5 text-sm text-slate-600",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Avatar({
  name,
  color = "blue",
}: {
  name: string;
  color?: "blue" | "green" | "orange" | "violet";
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
    violet: "bg-violet-100 text-violet-700",
  };

  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={clsx(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold",
        colors[color],
      )}
    >
      {letters || "TT"}
    </span>
  );
}


// "use client";

// import type { LucideIcon } from "lucide-react";
// import type { ReactNode } from "react";
// import clsx from "clsx";
// import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";

// export function PageHeader({
//   title,
//   description,
//   eyebrow,
//   actions,
// }: {
//   title: string;
//   description?: string;
//   eyebrow?: string;
//   actions?: ReactNode;
// }) {
//   return (
//     <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
//       <div>
//         {eyebrow && (
//           <p className="mb-1 text-xs font-bold uppercase tracking-[.15em] text-blue-600">
//             {eyebrow}
//           </p>
//         )}
//         <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">
//           {title}
//         </h1>
//         {description && (
//           <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
//             {description}
//           </p>
//         )}
//       </div>
//       {actions && (
//         <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
//       )}
//     </header>
//   );
// }

// export function StatCard({
//   label,
//   value,
//   note = "Current total",
//   icon: Icon,
//   tone = "blue",
// }: {
//   label: string;
//   value: ReactNode;
//   note?: string;
//   icon: LucideIcon;
//   tone?: "blue" | "cyan" | "orange" | "green" | "violet" | "red";
// }) {
//   const toneClasses = {
//     blue: "bg-blue-50 text-blue-600",
//     cyan: "bg-cyan-50 text-cyan-600",
//     orange: "bg-orange-50 text-orange-600",
//     green: "bg-emerald-50 text-emerald-600",
//     violet: "bg-violet-50 text-violet-600",
//     red: "bg-red-50 text-red-600",
//   };
//   return (
//     <Card className="flex min-h-32 items-center gap-4 p-4">
//       <div
//         className={clsx(
//           "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
//           toneClasses[tone],
//         )}
//       >
//         <Icon className="h-6 w-6" />
//       </div>
//       <div className="min-w-0">
//         <p className="truncate text-sm font-medium text-slate-600">{label}</p>
//         <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
//           {value}
//         </p>
//         <p className="mt-1 text-xs text-slate-400">{note}</p>
//       </div>
//     </Card>
//   );
// }

// export function DataTable({
//   headers,
//   children,
//   loading,
//   error,
//   empty,
//   onRetry,
// }: {
//   headers: string[];
//   children: ReactNode;
//   loading?: boolean;
//   error?: string | null;
//   empty?: boolean;
//   onRetry?: () => void;
// }) {
//   if (loading) return <LoadingState />;
//   if (error) return <ErrorState message={error} onRetry={onRetry} />;
//   if (empty)
//     return (
//       <EmptyState
//         title="No matching records"
//         message="Try a different search or add the first record."
//       />
//     );
//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-[720px] border-collapse text-left">
//         <thead>
//           <tr className="border-y border-slate-100 bg-slate-50/80">
//             {headers.map((header) => (
//               <th
//                 key={header}
//                 className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
//               >
//                 {header}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-slate-100">{children}</tbody>
//       </table>
//     </div>
//   );
// }

// export function TableCell({
//   children,
//   className,
// }: {
//   children: ReactNode;
//   className?: string;
// }) {
//   return (
//     <td className={clsx("px-4 py-3.5 text-sm text-slate-600", className)}>
//       {children}
//     </td>
//   );
// }

// export function Avatar({
//   name,
//   color = "blue",
// }: {
//   name: string;
//   color?: "blue" | "green" | "orange" | "violet";
// }) {
//   const colors = {
//     blue: "bg-blue-100 text-blue-700",
//     green: "bg-emerald-100 text-emerald-700",
//     orange: "bg-orange-100 text-orange-700",
//     violet: "bg-violet-100 text-violet-700",
//   };
//   const letters = name
//     .split(/\s+/)
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((word) => word[0]?.toUpperCase())
//     .join("");
//   return (
//     <span
//       className={clsx(
//         "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold",
//         colors[color],
//       )}
//     >
//       {letters || "TT"}
//     </span>
//   );
// }


