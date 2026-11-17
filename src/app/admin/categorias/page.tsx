import Link from "next/link";
import { ActionForm } from "@/app/admin/admin-ui";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { setCategoryArchivedAction } from "./actions";

type AdminCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  archived_at: string | null;
};

function CategoryRow({
  category,
  productCount,
}: {
  category: AdminCategory;
  productCount: number;
}) {
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
          {productCount} {productCount === 1 ? "produto associado" : "produtos associados"}
          {category.description ? ` · ${category.description}` : ""}
        </p>
        {archived ? (
          <p className="mb-0 mt-1 text-xs text-muted">
            Os produtos são preservados e ficam ocultos no cardápio enquanto esta categoria estiver arquivada.
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

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ excluida?: string; imagens?: string }>;
}) {
  await requireAdmin();
  const notice = await searchParams;
  const supabase = await createClient();
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, description, sort_order, archived_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<AdminCategory[]>(),
    supabase.from("products").select("id, category_id").returns<
      { id: string; category_id: string }[]
    >(),
  ]);

  if (
    categoriesResult.error ||
    productsResult.error ||
    !categoriesResult.data ||
    !productsResult.data
  ) {
    return (
      <AdminShell>
        <section className="mx-auto max-w-[1050px] rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-alert" role="alert">
          Não foi possível carregar as categorias. Tente novamente.
        </section>
      </AdminShell>
    );
  }

  const productCounts = new Map<string, number>();
  for (const product of productsResult.data) {
    productCounts.set(
      product.category_id,
      (productCounts.get(product.category_id) ?? 0) + 1,
    );
  }
  const active = categoriesResult.data.filter((category) => !category.archived_at);
  const archived = categoriesResult.data.filter((category) => category.archived_at);

  function section(title: string, categories: AdminCategory[], empty: string) {
    return (
      <section className="grid gap-3">
        <h2 className="m-0 font-serif text-lg text-ink">
          {title} <span className="font-sans text-sm text-muted">({categories.length})</span>
        </h2>
        {categories.length ? (
          <div className="grid gap-2.5">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                productCount={productCounts.get(category.id) ?? 0}
              />
            ))}
          </div>
        ) : (
          <p className="m-0 rounded-xl border border-dashed border-line bg-white p-5 text-sm text-muted">
            {empty}
          </p>
        )}
      </section>
    );
  }

  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[1050px] gap-6">
        {notice.excluida === "1" ? (
          <p
            className={`m-0 rounded-lg border px-3 py-2 text-sm ${
              notice.imagens === "preservadas"
                ? "border-amber-200 bg-amber-50 text-[#765500]"
                : "border-green-200 bg-green-50 text-good"
            }`}
            role="status"
          >
            {notice.imagens === "preservadas"
              ? "Categoria excluída. Algumas imagens foram preservadas porque não puderam ser removidas com segurança."
              : "Categoria excluída e operação concluída."}
          </p>
        ) : null}
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">
              Organização do cardápio
            </p>
            <h1 className="m-0 font-serif text-2xl leading-tight text-ink max-sm:text-xl">
              Categorias
            </h1>
            <p className="mb-0 mt-1 text-sm text-muted">
              Arquivar uma categoria oculta os produtos sem alterar o estado deles.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-plum px-3 text-sm font-bold text-white no-underline hover:bg-plum-dark"
            href="/admin/categorias/nova"
          >
            <span aria-hidden="true" className="mr-1 text-lg">+</span>
            Nova categoria
          </Link>
        </header>
        {section("Categorias ativas", active, "Ainda não há categorias ativas.")}
        {section("Categorias arquivadas", archived, "Nenhuma categoria arquivada.")}
      </div>
    </AdminShell>
  );
}
