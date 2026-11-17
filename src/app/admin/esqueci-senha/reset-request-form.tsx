"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ResetRequestForm() {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "success",
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/redefinir-senha`,
      });

      if (error) {
        setMessageType("error");
        const detail = error.message.toLowerCase();
        setMessage(
          detail.includes("redirect") || detail.includes("not allowed")
            ? "O Supabase recusou o endereço de retorno. Em Authentication → URL Configuration, adicione http://localhost:3000/admin/redefinir-senha à lista Redirect URLs."
            : `O Supabase não aceitou a solicitação: ${error.message}`,
        );
        return;
      }

      setMessage(
        "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
      );
      setMessageType("success");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? `Não foi possível conectar ao Supabase: ${error.message}`
          : "Não foi possível conectar ao Supabase. Tente novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form className="mx-auto mt-3.5 grid w-full max-w-[480px] gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-1">
          <label
            className="text-sm font-bold text-neutral-600"
            htmlFor="email"
          >
            E-mail da conta administrativa
          </label>
          <input
            autoComplete="email"
            autoCapitalize="none"
            className="min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus-visible:border-plum focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plum/20"
            id="email"
            name="email"
            required
            spellCheck={false}
            type="email"
          />
        </div>

        <p
          aria-live={messageType === "error" ? "assertive" : "polite"}
          className={`m-0 min-h-5 break-words text-xs leading-normal ${
            messageType === "error" ? "text-alert" : "text-good"
          }`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </p>

        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-plum px-3.5 py-2 text-sm font-bold text-white hover:bg-plum-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={pending}
          type="submit"
        >
          {pending ? "Solicitando..." : "Enviar link de redefinição"}
        </button>
      </form>

      <Link
        className="mt-3.5 flex min-h-11 items-center justify-center px-2 text-center text-sm font-bold text-plum-dark underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50"
        href="/admin/login"
      >
        Voltar ao login
      </Link>
    </>
  );
}
