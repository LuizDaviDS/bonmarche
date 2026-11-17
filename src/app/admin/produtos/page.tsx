import Image from "next/image";
import Link from "next/link";
import { ActionForm, ConfirmAction } from "@/app/admin/admin-ui";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
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

function ProductRow({
  product,
  categoryName,
  imageUrl,
}: {
  product: AdminProduct;
  categoryName: string;
  imageUrl: (path: string) => string;
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
          {product.image_path ? (
            <Image
              src={imageUrl(product.image_path)}
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
  categories,
  imageUrl,
  emptyMessage,
  description,
}: {
  title: string;
  products: AdminProduct[];
  categories: Map<string, string>;
  imageUrl: (path: string) => string;
  emptyMessage: string;
  description?: string;
}) {
  const headingId =
    title === "Produtos ativos" ? "products-active" : "products-archived";
  return (
    <section className="grid gap-3" aria-labelledby={`${headingId}-heading`}>
      <header>
        <h2 className="m-0 font-serif text-lg text-ink" id={`${headingId}-heading`}>
          {title} <span className="text-sm font-sans text-muted">({products.length})</span>
        </h2>
        {description ? <p className="mb-0 mt-1 text-xs text-muted">{description}</p> : null}
      </header>
      {products.length ? (
        <div className="grid gap-2.5">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              categoryName={categories.get(product.category_id) ?? "Categoria indisponível"}
              imageUrl={imageUrl}
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

export default async function ProductsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, price, image_path, available, featured, sort_order, archived_at",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<AdminProduct[]>(),
    supabase
      .from("categories")
      .select("id, name")
      .returns<AdminCategory[]>(),
  ]);
  const queryFailed = Boolean(productsResult.error || categoriesResult.error);

  if (queryFailed || !productsResult.data || !categoriesResult.data) {
    return (
      <AdminShell>
        <section className="mx-auto max-w-[1050px] rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-alert" role="alert">
          Não foi possível carregar os produtos. Tente novamente.
        </section>
      </AdminShell>
    );
  }

  const categoryNames = new Map(
    categoriesResult.data.map((category) => [category.id, category.name]),
  );
  const active = productsResult.data.filter((product) => !product.archived_at);
  const archived = productsResult.data.filter((product) => product.archived_at);
  const imageUrl = (path: string) =>
    supabase.storage.from("bonmarche-media").getPublicUrl(path).data.publicUrl;

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
              Indisponibilidade não arquiva: produtos indisponíveis continuam visíveis no cardápio.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-plum px-3 text-sm font-bold text-white no-underline hover:bg-plum-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50"
            href="/admin/produtos/novo"
          >
            <span aria-hidden="true" className="mr-1 text-lg">+</span>
            Novo produto
          </Link>
        </header>

        <ProductSection
          title="Produtos ativos"
          products={active}
          categories={categoryNames}
          imageUrl={imageUrl}
          emptyMessage="Ainda não há produtos ativos."
        />
        <ProductSection
          title="Produtos arquivados"
          products={archived}
          categories={categoryNames}
          imageUrl={imageUrl}
          emptyMessage="Nenhum produto arquivado."
          description="Itens arquivados ficam ocultos no cardápio, mas podem ser restaurados."
        />
      </div>
    </AdminShell>
  );
}
