"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  BriefcaseBusiness,
  Crown,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { registrationSchema, type RegistrationFormValues } from "@/schemas";
import { usersService } from "@/services/users";
import { getApiErrorMessage } from "@/lib/api/client";
import { Button, Field, Input } from "@/components/ui";

const roleOptions = [
  { value: "OWNER" as const, label: "Owner", icon: Crown },
  { value: "MANAGER" as const, label: "Manager", icon: BriefcaseBusiness },
  { value: "SALESPERSON" as const, label: "Salesperson", icon: UserRound },
];

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "OWNER",
      isActive: true,
    },
  });
  const [role, setRole] = useState<RegistrationFormValues["role"]>("OWNER");

  async function onSubmit(values: RegistrationFormValues) {
    try {
      await usersService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        isActive: values.isActive,
      });
      toast.success("Account created. You can sign in now.");
      router.push("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-[#111] px-3 py-8 sm:px-6 lg:py-12">
      <section className="mx-auto grid max-w-[1220px] overflow-hidden rounded-[24px] bg-white shadow-2xl lg:grid-cols-[42%_58%]">
        <div className="relative hidden min-h-[820px] overflow-hidden bg-[radial-gradient(circle_at_20%_15%,rgba(11,99,246,.20),transparent_35%),linear-gradient(145deg,#001630,#000816)] px-14 py-16 text-white lg:block">
          <Image
            src="/tech-trolley-logo.png"
            alt="Tech Trolley"
            width={190}
            height={190}
            className="mx-auto h-44 w-44 rounded-full"
          />
          <h1 className="mt-8 text-center text-2xl font-semibold">
            The Control Room <span className="text-[#ffd400]">Behind</span> Our
            Business.
          </h1>
          <span className="mx-auto mt-6 block h-0.5 w-12 bg-[#ffd400]" />
          <div className="mt-12 space-y-6 text-sm text-slate-300">
            <div className="flex gap-4">
              <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <UserRound className="h-5 w-5" />
              </span>
              <p>
                <strong className="block text-white">Role-based access</strong>
                Create accounts with the exact permissions used by the backend.
              </p>
            </div>
            <div className="flex gap-4">
              <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <BarChart3 className="h-5 w-5" />
              </span>
              <p>
                <strong className="block text-white">Smart management</strong>
                Manage inventory, sales and reports in one place.
              </p>
            </div>
            <div className="flex gap-4">
              <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p>
                <strong className="block text-white">
                  Secure and reliable
                </strong>
                Your active account is verified by the server at sign-in.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center px-5 py-10 sm:px-12 lg:px-16">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto w-full max-w-2xl space-y-5"
            noValidate
          >
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-950">
                Create your workspace account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Set up access for your role
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" error={errors.name?.message}>
                <Input
                  {...register("name")}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </Field>
              <Field label="Email address" error={errors.email?.message}>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </Field>
              <Field
                label="Password"
                error={errors.password?.message}
                hint="Minimum 6 characters"
              >
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="new-password"
                />
              </Field>
              <Field
                label="Confirm password"
                error={errors.confirmPassword?.message}
              >
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <Field label="Role" error={errors.role?.message}>
              <div className="grid gap-3 sm:grid-cols-3">
                {roleOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => {
                      setRole(value);
                      setValue("role", value, { shouldValidate: true });
                    }}
                    className={`flex h-16 items-center gap-3 rounded-xl border-2 px-4 text-sm font-semibold transition ${role === value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    <span className="rounded-lg bg-white p-2 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <span>
                <strong className="block text-sm text-slate-800">
                  Active account
                </strong>
                <span className="text-xs text-slate-500">
                  When enabled, this account can sign in.
                </span>
              </span>
              <input
                {...register("isActive")}
                type="checkbox"
                className="h-5 w-5 accent-blue-600"
              />
            </label>
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Protected with secure validation
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
