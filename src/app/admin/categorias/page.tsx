import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { CategoryList } from "./category-list";

type AdminCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  archived_at: string | null;
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ excluida?: string; imagens?: string }>;
}) {
  const notice = await searchParams;
  const supabase = await createClient();
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, description, sort_order, archived_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<AdminCategory[]>(),
    supabase
      .from("products")
      .select("id, category_id")
      .returns<{ id: string; category_id: string }[]>(),
  ]);

  if (
    categoriesResult.error ||
    productsResult.error ||
    !categoriesResult.data ||
    !productsResult.data
  ) {
    return (
      <AdminShell>
        <section
          className="mx-auto max-w-[1050px] rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-alert"
          role="alert"
        >
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
  const categories = categoriesResult.data.map((category) => ({
    ...category,
    product_count: productCounts.get(category.id) ?? 0,
  }));

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
              Arquivar uma categoria oculta os produtos sem alterar o estado
              deles.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-plum px-3 text-sm font-bold text-white no-underline hover:bg-plum-dark"
            href="/admin/categorias/nova"
          >
            <span aria-hidden="true" className="mr-1 text-lg">
              +
            </span>
            Nova categoria
          </Link>
        </header>

        <CategoryList categories={categories} />
      </div>
    </AdminShell>
  );
}
