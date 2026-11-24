"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { AccessShell } from "../access-shell";

type RecoveryStatus = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const [recoveryStatus, setRecoveryStatus] =
    useState<RecoveryStatus>("checking");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (recoveryStatus === "invalid") {
      router.replace("/admin/login");
    }
  }, [recoveryStatus, router]);

  useEffect(() => {
    const supabase = createClient();
    let recoveryConfirmed = false;
    let invalidTimer: number | undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        recoveryConfirmed = true;
        window.clearTimeout(invalidTimer);
        setRecoveryStatus("ready");
        return;
      }

      if (event === "INITIAL_SESSION") {
        invalidTimer = window.setTimeout(() => {
          if (!recoveryConfirmed) {
            setRecoveryStatus("invalid");
          }
        }, 500);
      }
    });

    return () => {
      window.clearTimeout(invalidTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setPending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(
          "Não foi possível atualizar a senha. O link pode ter expirado ou já ter sido usado.",
        );
        return;
      }

      window.location.replace("/admin");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Não foi possível atualizar a senha: ${error.message}`
          : "Não foi possível atualizar a senha. Tente novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  if (recoveryStatus !== "ready") {
    return null;
  }

  return (
    <AccessShell>
      <main className="mx-auto mt-6 mb-10 w-[min(480px,calc(100%-40px))] pt-4.5 max-sm:mt-4.5 max-sm:w-[calc(100%-32px)] max-sm:pt-3">
        <h1 className="mb-2 mt-0 text-center font-serif text-2xl tracking-[-0.02em] text-ink max-sm:text-xl">
          Redefinir senha
        </h1>
        <p className="mx-auto max-w-[62ch] text-center text-sm leading-normal text-muted">
          Use pelo menos 8 caracteres para criar sua nova senha.
        </p>
        <form className="mt-3.5 grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-1">
            <label
              className="text-sm font-bold text-neutral-600"
              htmlFor="password"
            >
              Nova senha
            </label>
            <input
              autoComplete="new-password"
              className="min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus-visible:border-plum focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plum/20"
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>

          <div className="grid gap-1">
            <label
              className="text-sm font-bold text-neutral-600"
              htmlFor="confirmation"
            >
              Confirme a nova senha
            </label>
            <input
              autoComplete="new-password"
              className="min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus-visible:border-plum focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plum/20"
              id="confirmation"
              minLength={8}
              name="confirmation"
              required
              type="password"
            />
          </div>

          <p
            aria-live="polite"
            className="m-0 min-h-5 break-words text-xs leading-normal text-alert"
            role="status"
          >
            {message}
          </p>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-plum px-3.5 py-2 text-sm font-bold text-white hover:bg-plum-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 disabled:cursor-not-allowed disabled:opacity-65"
            disabled={pending}
            type="submit"
          >
            {pending ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </main>
    </AccessShell>
  );
}
