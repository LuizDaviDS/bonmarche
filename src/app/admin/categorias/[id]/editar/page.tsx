import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "../../category-form";

type Category = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export default async function EditCategoryPage({
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
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name, description, sort_order")
    .eq("id", id)
    .maybeSingle()
    .returns<Category | null>();

  if (error || !category) notFound();

  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[700px] gap-4">
        <Link className="text-sm font-bold text-plum-dark underline" href="/admin/categorias">
          ← Categorias
        </Link>
        <header>
          <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">
            Edição
          </p>
          <h1 className="m-0 font-serif text-2xl text-ink">Editar categoria</h1>
        </header>
        <CategoryForm category={category} />
      </div>
    </AdminShell>
  );
}
