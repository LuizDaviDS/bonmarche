"use client";

import { useActionState } from "react";
import { signInAction, type LoginState } from "../actions";

const initialState: LoginState = { message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-0 grid gap-3">
      <div className="grid gap-1">
        <label
          className="text-sm font-bold text-neutral-600"
          htmlFor="email"
        >
          E-mail
        </label>
        <input
          autoComplete="username"
          className="min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus-visible:border-plum focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plum/20"
          id="email"
          name="email"
          type="email"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </div>

      <div className="grid gap-1">
        <label
          className="text-sm font-bold text-neutral-600"
          htmlFor="password"
        >
          Senha
        </label>
        <input
          autoComplete="current-password"
          className="min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus-visible:border-plum focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plum/20"
          id="password"
          name="password"
          type="password"
          required
        />
      </div>

      <p
        aria-live="assertive"
        className="m-0 min-h-5 break-words text-xs leading-normal text-alert"
        role="alert"
      >
        {state.message}
      </p>

      <button
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-plum px-3.5 py-2 text-sm font-bold text-white hover:bg-plum-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {pending ? "Entrando..." : "Entrar no painel"}
      </button>
    </form>
  );
}
