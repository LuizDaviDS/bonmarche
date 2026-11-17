import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { CategoryDeleteForm } from "../../category-delete-form";

type Category = {
  id: string;
  name: string;
};

type Destination = {
  id: string;
  name: string;
};

export default async function DeleteCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [categoryResult, productsResult, destinationsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .maybeSingle()
      .returns<Category | null>(),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id),
    supabase
      .from("categories")
      .select("id, name")
      .is("archived_at", null)
      .neq("id", id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<Destination[]>(),
  ]);

  if (!categoryResult.data || categoryResult.error) notFound();

  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[700px] gap-4">
        <Link className="text-sm font-bold text-plum-dark underline" href="/admin/categorias">
          ← Categorias
        </Link>
        <header>
          <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-alert uppercase">
            Exclusão definitiva
          </p>
          <h1 className="m-0 font-serif text-2xl text-ink">Excluir categoria?</h1>
          <p className="mb-0 mt-1 text-sm text-muted">
            A categoria selecionada é <strong>{categoryResult.data.name}</strong>.
          </p>
        </header>
        {productsResult.error || destinationsResult.error ? (
          <p className="m-0 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-alert" role="alert">
            Não foi possível verificar os produtos e categorias. Nenhuma alteração foi feita.
          </p>
        ) : (
          <CategoryDeleteForm
            categoryId={id}
            categoryName={categoryResult.data.name}
            productCount={productsResult.count ?? 0}
            destinations={destinationsResult.data ?? []}
          />
        )}
      </div>
    </AdminShell>
  );
}
