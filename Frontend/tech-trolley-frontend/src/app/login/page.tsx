"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, isHydrating, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  useEffect(() => {
    if (!isHydrating && user) router.replace("/dashboard");
  }, [isHydrating, router, user]);

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(
        { email: values.email, password: values.password },
        values.remember,
      );
      toast.success("Welcome back to Tech Trolley.");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] p-3 sm:p-6 lg:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1220px] overflow-hidden rounded-[30px] border border-black/10 bg-[#050505] shadow-2xl sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[44%_56%]">
        <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_20%_8%,rgba(255,215,0,.11),transparent_34%),linear-gradient(145deg,#030303,#090909)] lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-16">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,215,0,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,.09)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          <Image
            src="/tech-trolley-logo.png"
            alt="Tech Trolley"
            width={310}
            height={310}
            priority
            className="relative h-auto w-[280px] drop-shadow-[0_0_20px_rgba(255,215,0,.28)]"
          />
          <h1 className="relative mt-8 max-w-sm text-center text-[2rem] font-semibold leading-tight text-white">
            The Control Room <span className="text-[#ffd400]">Behind</span> Our
            Business.
          </h1>
          <span className="relative mt-8 h-0.5 w-12 bg-[#ffd400]" />
        </div>

        <div className="flex items-center justify-center rounded-[26px] bg-white px-5 py-12 sm:px-12 lg:rounded-l-[32px] lg:px-20">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 text-center lg:hidden">
              <Image
                src="/tech-trolley-logo.png"
                alt="Tech Trolley"
                width={112}
                height={112}
                priority
                className="mx-auto h-24 w-24 rounded-full"
              />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#111827]">
                Welcome back
              </h2>
              <p className="mt-2 text-[15px] text-slate-500">
                Sign in to continue to our control room
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-9 space-y-5"
              noValidate
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </span>
                {errors.email && (
                  <span className="mt-1.5 block text-sm text-red-600">
                    {errors.email.message}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-[15px] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
                {errors.password && (
                  <span className="mt-1.5 block text-sm text-red-600">
                    {errors.password.message}
                  </span>
                )}
              </label>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    {...register("remember")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  Remember me
                </label>
                <span className="font-medium text-blue-600">Secure access</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#2459f5] to-[#0865ff] font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <Link
                href="/register"
                className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-blue-600 font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Create an account
              </Link>
            </form>

            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Protected
              with secure sign-in
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
