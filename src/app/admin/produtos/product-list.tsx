"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionForm, ConfirmAction } from "@/app/admin/admin-ui";
import {
  deleteProductAction,
  setProductArchivedAction,
  setProductAvailabilityAction,
} from "./actions";

type AdminProduct = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
  archived_at: string | null;
};

type AdminCategory = {
  id: string;
  name: string;
};

type ProductStatus =
  | "all"
  | "active"
  | "archived"
  | "available"
  | "unavailable"
  | "featured";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50";

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function ProductRow({
  product,
  categoryName,
}: {
  product: AdminProduct;
  categoryName: string;
}) {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(product.price));
  const archived = product.archived_at !== null;

  return (
    <article className="grid gap-3 rounded-xl border border-line bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative grid size-[66px] shrink-0 place-items-center overflow-hidden rounded-lg border border-[#eadfce] bg-cream text-xs font-bold text-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt=""
              fill
              sizes="66px"
              className="object-cover"
            />
          ) : (
            "Sem foto"
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 break-words font-serif text-base leading-tight text-ink">
              {product.name}
            </h3>
            <span
              className={`rounded-full border px-2 py-1 text-[11px] font-bold ${
                archived
                  ? "border-line bg-neutral-50 text-muted"
                  : product.available
                    ? "border-green-200 bg-green-50 text-good"
                    : "border-amber-200 bg-amber-50 text-[#765500]"
              }`}
            >
              {archived
                ? "Arquivado"
                : product.available
                  ? "Disponível"
                  : "Indisponível"}
            </span>
            {product.featured ? (
              <span className="rounded-full border border-[#eadc96] bg-[#fff8d8] px-2 py-1 text-[11px] font-bold text-[#665500]">
                Destaque
              </span>
            ) : null}
          </div>
          <p className="mb-0 mt-1 text-xs text-muted">
            {categoryName} · {formattedPrice}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <Link
          className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink no-underline hover:bg-plum-soft"
          href={`/admin/produtos/${product.id}/editar`}
        >
          Editar
        </Link>
        {!archived ? (
          <>
            <ActionForm
              action={setProductAvailabilityAction}
              hiddenFields={{
                id: product.id,
                available: product.available ? "false" : "true",
              }}
              buttonLabel={
                product.available ? "Indisponibilizar" : "Disponibilizar"
              }
            />
            <ActionForm
              action={setProductArchivedAction}
              hiddenFields={{ id: product.id, archived: "true" }}
              buttonLabel="Arquivar"
            />
          </>
        ) : (
          <ActionForm
            action={setProductArchivedAction}
            hiddenFields={{ id: product.id, archived: "false" }}
            buttonLabel="Restaurar"
          />
        )}
        <ConfirmAction
          action={deleteProductAction}
          hiddenFields={{ id: product.id, confirmed: "yes" }}
          dialogId={`delete-product-${product.id}`}
          description={`“${product.name}” será removido permanentemente. Esta ação não pode ser desfeita.`}
        />
      </div>
    </article>
  );
}

function ProductSection({
  title,
  products,
  categoryNames,
  emptyMessage,
  description,
}: {
  title: string;
  products: AdminProduct[];
  categoryNames: Map<string, string>;
  emptyMessage: string;
  description?: string;
}) {
  const headingId =
    title === "Produtos ativos" ? "products-active" : "products-archived";

  return (
    <section className="grid gap-3" aria-labelledby={`${headingId}-heading`}>
      <header>
        <h2
          className="m-0 font-serif text-lg text-ink"
          id={`${headingId}-heading`}
        >
          {title}{" "}
          <span className="text-sm font-sans text-muted">
            ({products.length})
          </span>
        </h2>
        {description ? (
          <p className="mb-0 mt-1 text-xs text-muted">{description}</p>
        ) : null}
      </header>
      {products.length ? (
        <div className="grid gap-2.5">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              categoryName={
                categoryNames.get(product.category_id) ??
                "Categoria indisponível"
              }
            />
          ))}
        </div>
      ) : (
        <p className="m-0 rounded-xl border border-dashed border-line bg-white p-5 text-sm text-muted">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

export function ProductList({
  products,
  categories,
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<ProductStatus>("all");
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const normalizedSearch = normalizeSearchText(search.trim());
  const filteredProducts = products.filter((product) => {
    const archived = product.archived_at !== null;
    const matchesSearch =
      !normalizedSearch ||
      normalizeSearchText(
        `${product.name} ${product.description ?? ""} ${categoryNames.get(product.category_id) ?? ""}`,
      ).includes(normalizedSearch);
    const matchesCategory =
      categoryId === "all" || product.category_id === categoryId;
    const matchesStatus =
      status === "all" ||
      (status === "active" && !archived) ||
      (status === "archived" && archived) ||
      (status === "available" && !archived && product.available) ||
      (status === "unavailable" && !archived && !product.available) ||
      (status === "featured" && !archived && product.featured);

    return matchesSearch && matchesCategory && matchesStatus;
  });
  const active = filteredProducts.filter((product) => !product.archived_at);
  const archived = filteredProducts.filter((product) => product.archived_at);
  const hasFilters = Boolean(search.trim()) || categoryId !== "all" || status !== "all";

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-xl border border-line bg-white p-3 sm:grid-cols-3 sm:p-4">
        <label className="text-sm font-bold text-ink">
          Buscar produto
          <input
            className={fieldClass}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Nome, descrição ou categoria"
            autoComplete="off"
          />
        </label>
        <label className="text-sm font-bold text-ink">
          Categoria
          <select
            className={fieldClass}
            value={categoryId}
            onChange={(event) => setCategoryId(event.currentTarget.value)}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          Status
          <select
            className={fieldClass}
            value={status}
            onChange={(event) =>
              setStatus(event.currentTarget.value as ProductStatus)
            }
          >
            <option value="all">Todos os produtos</option>
            <option value="active">Ativos</option>
            <option value="archived">Arquivados</option>
            <option value="available">Disponíveis</option>
            <option value="unavailable">Indisponíveis</option>
            <option value="featured">Em destaque</option>
          </select>
        </label>
        <p className="m-0 text-xs text-muted sm:col-span-3" role="status">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1
            ? "produto encontrado"
            : "produtos encontrados"}
        </p>
      </div>

      {products.length > 0 && filteredProducts.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed border-line bg-white p-5 text-sm text-muted">
          {hasFilters
            ? "Nenhum produto corresponde à busca e aos filtros selecionados."
            : "Ainda não há produtos cadastrados."}
        </p>
      ) : null}
      {active.length > 0 || products.length === 0 ? (
        <ProductSection
          title="Produtos ativos"
          products={active}
          categoryNames={categoryNames}
          emptyMessage="Ainda não há produtos ativos."
        />
      ) : null}
      {archived.length > 0 ? (
        <ProductSection
          title="Produtos arquivados"
          products={archived}
          categoryNames={categoryNames}
          emptyMessage="Nenhum produto arquivado."
          description="Itens arquivados ficam ocultos no cardápio, mas podem ser restaurados."
        />
      ) : null}
    </div>
  );
}
