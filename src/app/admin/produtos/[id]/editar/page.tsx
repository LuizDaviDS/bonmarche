import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../../product-form";

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
  archived_at: string | null;
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [productResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, price, image_path, available, featured, sort_order",
      )
      .eq("id", id)
      .maybeSingle()
      .returns<Product | null>(),
    supabase
      .from("categories")
      .select("id, name, archived_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<CategoryOption[]>(),
  ]);

  if (!productResult.data || productResult.error) notFound();
  const imageUrl = productResult.data.image_path
    ? supabase.storage
        .from("bonmarche-media")
        .getPublicUrl(productResult.data.image_path).data.publicUrl
    : null;

  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[760px] gap-4">
        <Link className="text-sm font-bold text-plum-dark underline" href="/admin/produtos">
          ← Produtos
        </Link>
        <header>
          <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">
            Edição
          </p>
          <h1 className="m-0 font-serif text-2xl text-ink">Editar produto</h1>
        </header>
        {categoriesResult.error || !categoriesResult.data ? (
          <p className="m-0 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-alert" role="alert">
            Não foi possível carregar as categorias. Tente novamente.
          </p>
        ) : (
          <ProductForm
            product={productResult.data}
            categories={categoriesResult.data.map((category) => ({
              id: category.id,
              name: category.name,
              archived: Boolean(category.archived_at),
            }))}
            imageUrl={imageUrl}
          />
        )}
      </div>
    </AdminShell>
  );
}
