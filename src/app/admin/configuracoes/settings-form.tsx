"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  ActionFeedback,
  idleAdminActionState,
} from "@/app/admin/admin-ui";
import { saveSettingsAction } from "./actions";

export type StoreSettings = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  logo_path: string | null;
};

const fieldClass =
  "mt-1 block min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50";

export function SettingsForm({
  settings,
  logoUrl,
}: {
  settings: StoreSettings;
  logoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveSettingsAction,
    idleAdminActionState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="text-sm font-bold text-ink">
        Nome do estabelecimento
        <input
          className={fieldClass}
          name="name"
          required
          maxLength={120}
          defaultValue={settings.name}
        />
      </label>
      <label className="text-sm font-bold text-ink">
        Descrição
        <textarea
          className={`${fieldClass} min-h-24 resize-y`}
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={settings.description ?? ""}
        />
      </label>

      <section className="rounded-xl border border-line bg-white p-4" aria-labelledby="logo-label">
        <h2 className="m-0 text-sm font-bold text-ink" id="logo-label">
          Logotipo (opcional)
        </h2>
        <p className="mb-3 mt-1 text-xs leading-relaxed text-muted">
          Uma imagem JPEG, PNG ou WebP, até 5 MiB.
        </p>
        {logoUrl ? (
          <div className="relative mb-3 grid h-24 w-36 place-items-center overflow-hidden rounded-lg border border-line bg-cream">
            <Image src={logoUrl} alt="Logotipo atual do estabelecimento" fill sizes="144px" className="object-contain p-2" />
          </div>
        ) : (
          <p className="mb-3 text-xs text-muted">Nenhum logotipo cadastrado.</p>
        )}
        <label className="block text-sm font-semibold text-ink">
          {logoUrl ? "Substituir logotipo" : "Selecionar logotipo"}
          <input
            className="mt-2 block w-full text-sm file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-plum-soft file:px-3 file:font-bold file:text-plum-dark"
            type="file"
            name="logo"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
        {logoUrl ? (
          <label className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-ink">
            <input className="size-4 accent-plum" type="checkbox" name="remove_logo" />
            Remover logotipo se não selecionar outro
          </label>
        ) : null}
      </section>

      <label className="text-sm font-bold text-ink">
        Endereço
        <textarea
          className={`${fieldClass} min-h-20 resize-y`}
          name="address"
          rows={2}
          autoComplete="street-address"
          maxLength={500}
          defaultValue={settings.address ?? ""}
        />
      </label>

      <ActionFeedback state={state} />
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-plum px-4 text-sm font-bold text-white hover:bg-plum-dark disabled:opacity-60 sm:justify-self-end"
        type="submit"
        disabled={pending}
      >
        {pending ? "Salvando…" : "Salvar configurações"}
      </button>
    </form>
  );
}
