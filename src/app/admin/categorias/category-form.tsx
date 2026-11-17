"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ActionFeedback,
  idleAdminActionState,
} from "@/app/admin/admin-ui";
import { saveCategoryAction } from "./actions";

type Category = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

const fieldClass =
  "mt-1 block min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50";

export function CategoryForm({ category }: { category: Category | null }) {
  const [state, formAction, pending] = useActionState(
    saveCategoryAction,
    idleAdminActionState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <label className="text-sm font-bold text-ink">
        Nome
        <input
          className={fieldClass}
          name="name"
          required
          maxLength={100}
          autoComplete="off"
          defaultValue={category?.name ?? ""}
        />
      </label>
      <label className="text-sm font-bold text-ink">
        Descrição (opcional)
        <textarea
          className={`${fieldClass} min-h-24 resize-y`}
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={category?.description ?? ""}
        />
      </label>
      <label className="text-sm font-bold text-ink">
        Ordem de exibição
        <input
          className={fieldClass}
          name="sort_order"
          type="number"
          min="0"
          max="999999"
          step="1"
          defaultValue={category?.sort_order ?? 0}
        />
      </label>
      <p className="m-0 rounded-lg bg-cream px-3 py-2 text-xs leading-relaxed text-muted">
        O endereço interno da categoria será gerado a partir do nome.
      </p>
      <ActionFeedback state={state} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink no-underline hover:bg-plum-soft"
          href="/admin/categorias"
        >
          Voltar para categorias
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-plum px-4 text-sm font-bold text-white hover:bg-plum-dark disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "Salvando…" : "Salvar categoria"}
        </button>
      </div>
    </form>
  );
}
