"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PasswordForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

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
          "O link pode ter expirado ou já ter sido usado. Solicite uma nova redefinição e tente novamente.",
        );
        return;
      }

      router.replace("/admin");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
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
  );
}
