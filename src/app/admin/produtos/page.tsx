import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { ProductList } from "./product-list";

type AdminProductRecord = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string | number;
  image_path: string | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
  archived_at: string | null;
};

type AdminCategory = {
  id: string;
  name: string;
};

export default async function ProductsPage() {
  const supabase = await createClient();
  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, price, image_path, available, featured, sort_order, archived_at",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<AdminProductRecord[]>(),
    supabase
      .from("categories")
      .select("id, name")
      .returns<AdminCategory[]>(),
  ]);
  const queryFailed = Boolean(productsResult.error || categoriesResult.error);

  if (queryFailed || !productsResult.data || !categoriesResult.data) {
    return (
      <AdminShell>
        <section
          className="mx-auto max-w-[1050px] rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-alert"
          role="alert"
        >
          Não foi possível carregar os produtos. Tente novamente.
        </section>
      </AdminShell>
    );
  }

  const products = productsResult.data.map(({ image_path, ...product }) => ({
    ...product,
    image_url: image_path
      ? supabase.storage.from("bonmarche-media").getPublicUrl(image_path).data
          .publicUrl
      : null,
  }));

  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[1050px] gap-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">
              Administração do cardápio
            </p>
            <h1 className="m-0 font-serif text-2xl leading-tight text-ink max-sm:text-xl">
              Produtos
            </h1>
            <p className="mb-0 mt-1 text-sm text-muted">
              Indisponibilidade não arquiva: produtos indisponíveis continuam
              visíveis no cardápio.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-plum px-3 text-sm font-bold text-white no-underline hover:bg-plum-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50"
            href="/admin/produtos/novo"
          >
            <span aria-hidden="true" className="mr-1 text-lg">
              +
            </span>
            Novo produto
          </Link>
        </header>

        <ProductList products={products} categories={categoriesResult.data} />
      </div>
    </AdminShell>
  );
}
