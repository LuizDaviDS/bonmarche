import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../product-form";

type CategoryOption = {
  id: string;
  name: string;
  archived_at: string | null;
};

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, archived_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<CategoryOption[]>();

  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[760px] gap-4">
        <Link className="text-sm font-bold text-plum-dark underline" href="/admin/produtos">
          ← Produtos
        </Link>
        <header>
          <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">
            Cadastro
          </p>
          <h1 className="m-0 font-serif text-2xl text-ink">Novo produto</h1>
        </header>
        {error || !categories ? (
          <p className="m-0 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-alert" role="alert">
            Não foi possível carregar as categorias. Tente novamente.
          </p>
        ) : categories.length === 0 ? (
          <section className="grid gap-3 rounded-xl border border-[#eadc96] bg-[#fff8d8] p-4 text-sm text-ink">
            <p className="m-0">Crie uma categoria antes de cadastrar um produto.</p>
            <Link className="font-bold text-plum-dark underline" href="/admin/categorias/nova">
              Criar categoria
            </Link>
          </section>
        ) : (
          <ProductForm
            product={null}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              archived: Boolean(category.archived_at),
            }))}
            imageUrl={null}
          />
        )}
      </div>
    </AdminShell>
  );
}
