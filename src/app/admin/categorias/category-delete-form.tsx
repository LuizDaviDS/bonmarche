"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import {
  ActionFeedback,
  idleAdminActionState,
} from "@/app/admin/admin-ui";
import { hardDeleteCategoryAction } from "./actions";

type Destination = {
  id: string;
  name: string;
};

const fieldClass =
  "mt-1 block min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50";

export function CategoryDeleteForm({
  categoryId,
  categoryName,
  productCount,
  destinations,
}: {
  categoryId: string;
  categoryName: string;
  productCount: number;
  destinations: Destination[];
}) {
  const [mode, setMode] = useState<"" | "delete_products" | "transfer">("");
  const [state, formAction, pending] = useActionState(
    hardDeleteCategoryAction,
    idleAdminActionState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={categoryId} />
      {productCount === 0 ? (
        <input type="hidden" name="mode" value="delete_products" />
      ) : (
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-sm font-bold text-ink">
            O que fazer com os {productCount} produtos associados?
          </legend>
          <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-3">
            <input
              className="mt-1 size-4 accent-plum"
              type="radio"
              name="mode"
              value="transfer"
              required
              checked={mode === "transfer"}
              onChange={() => setMode("transfer")}
            />
            <span>
              <strong className="block text-sm text-ink">Transferir produtos</strong>
              <small className="mt-1 block text-xs text-muted">
                Todos os produtos, inclusive arquivados ou indisponíveis, serão movidos para outra categoria.
              </small>
            </span>
          </label>
          {mode === "transfer" ? (
            <label className="pl-7 text-sm font-bold text-ink">
              Nova categoria dos produtos
              <select
                className={fieldClass}
                name="target_category_id"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Escolher categoria ativa
                </option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </select>
              {destinations.length === 0 ? (
                <span className="mt-1 block text-xs font-normal text-alert">
                  Não há outra categoria ativa para receber os produtos.
                </span>
              ) : null}
            </label>
          ) : null}
          <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <input
              className="mt-1 size-4 accent-alert"
              type="radio"
              name="mode"
              value="delete_products"
              required
              checked={mode === "delete_products"}
              onChange={() => setMode("delete_products")}
            />
            <span>
              <strong className="block text-sm text-alert">Excluir também os produtos</strong>
              <small className="mt-1 block text-xs text-muted">
                A exclusão é definitiva para todos os produtos desta categoria.
              </small>
            </span>
          </label>
        </fieldset>
      )}

      <p className="m-0 rounded-lg border border-[#eadc96] bg-[#fff8d8] p-3 text-sm leading-relaxed text-ink">
        A exclusão de <strong>{categoryName}</strong> é definitiva. A operação
        de categoria e produtos será realizada como uma única transação.
      </p>
      <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
        <input className="size-4 accent-plum" type="checkbox" name="confirmed" value="yes" required />
        Confirmo a exclusão definitiva
      </label>
      <ActionFeedback state={state} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink no-underline hover:bg-plum-soft"
          href="/admin/categorias"
        >
          Cancelar
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-alert px-4 text-sm font-bold text-white disabled:opacity-60"
          type="submit"
          disabled={pending || (mode === "transfer" && destinations.length === 0)}
        >
          {pending ? "Excluindo…" : "Confirmar exclusão"}
        </button>
      </div>
    </form>
  );
}
