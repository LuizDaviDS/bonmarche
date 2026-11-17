import { ResetRequestForm } from "./reset-request-form";
import { AccessShell } from "../access-shell";

export default function ForgotPasswordPage() {
  return (
    <AccessShell headerLabel="Recuperar senha">
      <main className="mx-auto mt-6 mb-10 w-[min(480px,calc(100%-40px))] pt-4.5 max-sm:mt-4.5 max-sm:w-[calc(100%-32px)] max-sm:pt-3">
        <h1 className="mb-2 mt-0 text-center font-serif text-2xl tracking-[-0.02em] text-ink max-sm:text-xl">Redefinir senha</h1>
        <p className="mx-auto max-w-[62ch] text-center text-sm leading-normal text-muted">
          Solicitar link de recuperação pelo e-mail administrativo; o formulário
          não revela se um endereço está cadastrado.
        </p>
        <ResetRequestForm />
      </main>
    </AccessShell>
  );
}
