"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/app/admin/admin-ui";
import { setCategoryArchivedAction } from "./actions";

type AdminCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  archived_at: string | null;
  product_count: number;
};

const fieldClass =
  "mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50";
const CATEGORIES_PER_PAGE = 16;

type CategorySort = "menu" | "name-asc" | "name-desc";

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function CategoryRow({ category }: { category: AdminCategory }) {
  const archived = Boolean(category.archived_at);

  return (
    <article className="grid gap-3 rounded-xl border border-line bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 break-words font-serif text-base leading-tight text-ink">
            {category.name}
          </h3>
          <span
            className={`rounded-full border px-2 py-1 text-[11px] font-bold ${
              archived
                ? "border-line bg-neutral-50 text-muted"
                : "border-green-200 bg-green-50 text-good"
            }`}
          >
            {archived ? "Arquivada" : "Ativa"}
          </span>
        </div>
        <p className="mb-0 mt-1 text-xs text-muted">
          {category.product_count}{" "}
          {category.product_count === 1
            ? "produto associado"
            : "produtos associados"}
          {category.description ? ` · ${category.description}` : ""}
        </p>
        {archived ? (
          <p className="mb-0 mt-1 text-xs text-muted">
            Os produtos são preservados e ficam ocultos no cardápio enquanto
            esta categoria estiver arquivada.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <Link
          className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink no-underline hover:bg-plum-soft"
          href={`/admin/categorias/${category.id}/editar`}
        >
          Editar
        </Link>
        <ActionForm
          action={setCategoryArchivedAction}
          hiddenFields={{
            id: category.id,
            archived: archived ? "false" : "true",
          }}
          buttonLabel={archived ? "Restaurar" : "Arquivar"}
        />
        <Link
          className="inline-flex min-h-10 items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-alert no-underline hover:bg-rose-50"
          href={`/admin/categorias/${category.id}/excluir`}
        >
          Excluir
        </Link>
      </div>
    </article>
  );
}

export function CategoryList({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [sortBy, setSortBy] = useState<CategorySort>("menu");
  const [currentPage, setCurrentPage] = useState(1);
  const normalizedSearch = normalizeSearchText(search.trim());
  const filteredCategories = categories.filter((category) => {
    const archived = Boolean(category.archived_at);
    const matchesSearch =
      !normalizedSearch ||
      normalizeSearchText(
        `${category.name} ${category.description ?? ""}`,
      ).includes(normalizedSearch);
    const matchesStatus =
      status === "all" ||
      (status === "active" && !archived) ||
      (status === "archived" && archived);
    return matchesSearch && matchesStatus;
  });
  const sortCategories = (items: AdminCategory[]) => {
    if (sortBy === "menu") return items;

    return [...items].sort((a, b) => {
      const byName = a.name.localeCompare(b.name, "pt-BR", {
        sensitivity: "base",
      });
      return sortBy === "name-asc" ? byName : -byName;
    });
  };
  const activeCategories = sortCategories(
    filteredCategories.filter((category) => !category.archived_at),
  );
  const archivedCategories = sortCategories(
    filteredCategories.filter((category) => category.archived_at),
  );
  const orderedCategories = [...activeCategories, ...archivedCategories];
  const totalPages = Math.max(
    1,
    Math.ceil(orderedCategories.length / CATEGORIES_PER_PAGE),
  );
  const visiblePage = Math.min(currentPage, totalPages);
  const pageStart = (visiblePage - 1) * CATEGORIES_PER_PAGE;
  const pageCategories = orderedCategories.slice(
    pageStart,
    pageStart + CATEGORIES_PER_PAGE,
  );
  const active = pageCategories.filter((category) => !category.archived_at);
  const archived = pageCategories.filter((category) => category.archived_at);
  const pageEnd = Math.min(
    pageStart + pageCategories.length,
    orderedCategories.length,
  );
  const hasFilters = Boolean(search.trim()) || status !== "all";

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-xl border border-line bg-white p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.5fr)_minmax(220px,0.5fr)] sm:p-4">
        <label className="text-sm font-bold text-ink">
          Buscar categoria
          <input
            className={fieldClass}
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setCurrentPage(1);
            }}
            placeholder="Nome ou descrição"
            autoComplete="off"
          />
        </label>
        <label className="text-sm font-bold text-ink">
          Status
          <select
            className={fieldClass}
            value={status}
            onChange={(event) => {
              setStatus(event.currentTarget.value as typeof status);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todas as categorias</option>
            <option value="active">Ativas</option>
            <option value="archived">Arquivadas</option>
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          Ordenar por
          <select
            className={fieldClass}
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.currentTarget.value as CategorySort);
              setCurrentPage(1);
            }}
          >
            <option value="menu">Ordem do cardápio</option>
            <option value="name-asc">Nome: A a Z</option>
            <option value="name-desc">Nome: Z a A</option>
          </select>
        </label>
        <p className="m-0 text-xs text-muted sm:col-span-3" role="status">
          {orderedCategories.length === 0
            ? "Nenhuma categoria encontrada"
            : `Exibindo ${pageStart + 1}–${pageEnd} de ${orderedCategories.length} categorias`}
        </p>
      </div>

      {categories.length > 0 && filteredCategories.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed border-line bg-white p-5 text-sm text-muted">
          {hasFilters
            ? "Nenhuma categoria corresponde à busca e ao filtro selecionados."
            : "Ainda não há categorias cadastradas."}
        </p>
      ) : null}
      {active.length > 0 || categories.length === 0 ? (
        <section className="grid gap-3" aria-labelledby="categories-active">
          <h2 className="m-0 font-serif text-lg text-ink" id="categories-active">
            Categorias ativas{" "}
            <span className="font-sans text-sm text-muted">({active.length})</span>
          </h2>
          {active.length ? (
            <div className="grid gap-2.5">
              {active.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <p className="m-0 rounded-xl border border-dashed border-line bg-white p-5 text-sm text-muted">
              Ainda não há categorias ativas.
            </p>
          )}
        </section>
      ) : null}
      {archived.length > 0 ? (
        <section className="grid gap-3" aria-labelledby="categories-archived">
          <h2
            className="m-0 font-serif text-lg text-ink"
            id="categories-archived"
          >
            Categorias arquivadas{" "}
            <span className="font-sans text-sm text-muted">
              ({archived.length})
            </span>
          </h2>
          <div className="grid gap-2.5">
            {archived.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        </section>
      ) : null}
      {totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-3"
          aria-label="Paginação das categorias"
        >
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink hover:bg-plum-soft disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setCurrentPage(visiblePage - 1)}
            disabled={visiblePage === 1}
          >
            Anterior
          </button>
          <span
            className="text-sm font-bold text-muted"
            aria-live="polite"
            aria-atomic="true"
          >
            Página {visiblePage} de {totalPages}
          </span>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink hover:bg-plum-soft disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setCurrentPage(visiblePage + 1)}
            disabled={visiblePage === totalPages}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </div>
  );
}
