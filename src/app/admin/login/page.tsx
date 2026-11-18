import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth/admin";
import { AccessShell } from "../access-shell";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await getAdmin()) {
    redirect("/admin");
  }

  return (
    <AccessShell headerLabel="Entrar">
      <main className="mx-auto mt-6 mb-10 grid w-[calc(100%-40px)] max-w-[980px] grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-4 max-sm:w-[calc(100%-32px)] max-sm:grid-cols-1">
        <section className="grid min-h-[116px] grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-plum-dark bg-[linear-gradient(115deg,#421450,#702783_70%,#87508b)] p-4 text-white max-sm:min-h-0 max-sm:grid-cols-1 max-sm:gap-2.5" aria-labelledby="login-title">
          <div className="flex flex-col items-start gap-1">
            <h1 className="m-0 font-serif text-2xl leading-tight" id="login-title">Bem-vindo</h1>
            <p className="m-0 text-[10px] font-extrabold tracking-[0.12em] text-sun uppercase max-sm:text-xs">Área restrita</p>
          </div>
          <p className="m-0 max-w-[19ch] justify-self-end self-end text-right text-xs leading-normal text-[#f0e5f2] max-sm:max-w-[32ch] max-sm:justify-self-start max-sm:self-auto max-sm:text-left max-sm:text-sm">
            Acesso somente para a pessoa administradora.
          </p>
        </section>
        <LoginForm />
      </main>
    </AccessShell>
  );
}
