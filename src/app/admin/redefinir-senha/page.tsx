import Link from "next/link";
import { PasswordForm } from "./password-form";
import { AccessShell } from "../access-shell";

export default function ResetPasswordPage() {
  return (
    <AccessShell headerLabel="Recuperar senha">
      <main className="mx-auto mt-6 mb-10 w-[min(480px,calc(100%-40px))] pt-4.5 max-sm:mt-4.5 max-sm:w-[calc(100%-32px)] max-sm:pt-3">
        <h1 className="mb-2 mt-0 text-center font-serif text-2xl tracking-[-0.02em] text-ink max-sm:text-xl">Escolha uma nova senha</h1>
        <p className="mx-auto max-w-[62ch] text-center text-sm leading-normal text-muted">
          Use pelo menos 8 caracteres. Após salvar, você seguirá para o painel
          administrativo.
        </p>
        <PasswordForm />
        <Link
          className="mt-3.5 flex min-h-11 items-center justify-center px-2 text-center text-sm font-bold text-plum-dark underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50"
          href="/admin/esqueci-senha"
        >
          Solicitar outro link
        </Link>
      </main>
    </AccessShell>
  );
}
