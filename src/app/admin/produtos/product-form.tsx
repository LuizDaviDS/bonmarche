"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { ActionFeedback } from "@/app/admin/admin-ui";
import {
  saveProductAction,
  type ProductFormValues,
  type ProductActionState,
} from "./actions";

type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string | number;
  image_path: string | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
};

type CategoryOption = {
  id: string;
  name: string;
  archived: boolean;
};

const fieldClass =
  "mt-1 block min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50";

function initialProductValues(product: Product | null): ProductFormValues {
  return {
    id: product?.id ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price).replace(".", ",") : "",
    category_id: product?.category_id ?? "",
    sort_order: String(product?.sort_order ?? 0),
    available: product?.available ?? true,
    featured: product?.featured ?? false,
    remove_image: false,
  };
}

export function ProductForm({
  product,
  categories,
  imageUrl,
}: {
  product: Product | null;
  categories: CategoryOption[];
  imageUrl: string | null;
}) {
  const initialValues = initialProductValues(product);
  const initialState: ProductActionState = {
    status: "idle",
    message: "",
    values: initialValues,
  };
  const [state, formAction, pending] = useActionState(
    saveProductAction,
    initialState,
  );
  const selectedCategoryExists = categories.some(
    (category) => category.id === product?.category_id,
  );

  return (
    <form
      key={JSON.stringify(state.values)}
      action={formAction}
      encType="multipart/form-data"
      className="grid gap-4"
    >
      <input type="hidden" name="id" value={state.values.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-ink sm:col-span-2">
          Nome
          <input
            className={fieldClass}
            name="name"
            autoComplete="off"
            maxLength={120}
            required
            defaultValue={state.values.name}
          />
        </label>
        <label className="text-sm font-bold text-ink sm:col-span-2">
          Descrição
          <textarea
            className={`${fieldClass} min-h-24 resize-y`}
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={state.values.description}
          />
        </label>
        <label className="text-sm font-bold text-ink">
          Preço (R$)
          <input
            className={fieldClass}
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            required
            defaultValue={state.values.price}
          />
        </label>
        <label className="text-sm font-bold text-ink">
          Categoria obrigatória
          <select
            className={fieldClass}
            name="category_id"
            required
            defaultValue={state.values.category_id}
          >
            <option value="" disabled>
              Escolher categoria
            </option>
            {product?.category_id && !selectedCategoryExists ? (
              <option value={product.category_id}>Categoria atual</option>
            ) : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.archived ? " · arquivada" : ""}
              </option>
            ))}
          </select>
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
            defaultValue={state.values.sort_order}
          />
        </label>
      </div>

      <fieldset className="grid gap-2 rounded-xl border border-line bg-white p-3 sm:grid-cols-2">
        <legend className="px-1 text-sm font-bold text-ink">
          Exibição no cardápio
        </legend>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
          <input
            className="size-4 accent-plum"
            type="checkbox"
            name="available"
            defaultChecked={state.values.available}
          />
          Disponível
        </label>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
          <input
            className="size-4 accent-plum"
            type="checkbox"
            name="featured"
            defaultChecked={state.values.featured}
          />
          Destaque
        </label>
      </fieldset>

      <section className="rounded-xl border border-line bg-white p-4" aria-labelledby="product-image-label">
        <h2 className="m-0 text-sm font-bold text-ink" id="product-image-label">
          Imagem principal (opcional)
        </h2>
        <p className="mb-3 mt-1 text-xs leading-relaxed text-muted">
          Uma imagem JPEG, PNG ou WebP, até 5 MiB. Sugestão de enquadramento
          vertical 4:5 e boa iluminação.
        </p>
        {imageUrl ? (
          <div className="relative mb-3 aspect-[4/5] w-24 overflow-hidden rounded-lg border border-line">
            <Image src={imageUrl} alt={`Imagem atual: ${product?.name ?? ""}`} fill sizes="96px" className="object-cover" />
          </div>
        ) : null}
        <label className="block text-sm font-semibold text-ink">
          {imageUrl ? "Substituir imagem" : "Selecionar imagem"}
          <input
            className="mt-2 block w-full text-sm file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-plum-soft file:px-3 file:font-bold file:text-plum-dark"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
        {imageUrl ? (
          <label className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-ink">
            <input
              className="size-4 accent-plum"
              type="checkbox"
              name="remove_image"
              defaultChecked={state.values.remove_image}
            />
            Remover imagem atual se não selecionar outra
          </label>
        ) : null}
      </section>

      <ActionFeedback state={state} />
      {state.status === "error" ? (
        <p className="-mt-3 text-xs text-muted">
          Os demais campos foram preservados. Se o problema envolver a imagem,
          selecione o arquivo novamente.
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink no-underline hover:bg-plum-soft"
          href="/admin/produtos"
        >
          Voltar para produtos
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-plum px-4 text-sm font-bold text-white hover:bg-plum-dark disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "Salvando…" : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}
