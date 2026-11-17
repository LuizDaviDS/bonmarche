import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "./admin-shell";
import { AdminPageSkeleton } from "./admin-page-skeleton";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

async function AdminDashboardContent() {
  const supabase = await createClient();
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .is("archived_at", null),
    supabase
      .from("products")
      .select("id, category_id, name, image_path, available")
      .is("archived_at", null),
  ]);
  const loadFailed =
    Boolean(categoriesResult.error || productsResult.error) ||
    !categoriesResult.data ||
    !productsResult.data;

  const activeCategoryIds = new Set(
    (categoriesResult.data ?? []).map((category) => category.id),
  );
  const visibleProducts = (productsResult.data ?? []).filter((product) =>
    activeCategoryIds.has(product.category_id),
  );
  const categoriesWithoutProducts = (categoriesResult.data ?? []).filter(
    (category) =>
      !visibleProducts.some((product) => product.category_id === category.id),
  );
  const productsWithoutImage = visibleProducts.filter(
    (product) => !product.image_path,
  );
  const metrics = [
    { label: "Produtos visíveis", value: visibleProducts.length },
    {
      label: "Indisponíveis",
      value: visibleProducts.filter((product) => !product.available).length,
    },
    { label: "Categorias ativas", value: categoriesResult.data?.length ?? 0 },
  ];
  const checklistItems = [
    {
      label:
        productsWithoutImage.length === 1
          ? "produto sem imagem"
          : "produtos sem imagem",
      count: productsWithoutImage.length,
      names: productsWithoutImage.map((product) => product.name),
      description:
        "Fotos são opcionais, mas ajudam a apresentar melhor os produtos.",
      resolved: "Nenhum produto publicado está sem imagem.",
      href: "/admin/produtos",
      link: "Ver produtos",
    },
    {
      label:
        categoriesWithoutProducts.length === 1
          ? "categoria ativa sem produtos"
          : "categorias ativas sem produtos",
      count: categoriesWithoutProducts.length,
      names: categoriesWithoutProducts.map((category) => category.name),
      description:
        "Categorias arquivadas e produtos arquivados não entram no resumo.",
      resolved: "Todas as categorias ativas têm produtos publicados.",
      href: "/admin/categorias",
      link: "Ver categorias",
    },
  ];

  return (
      <div className="mx-auto grid max-w-[1050px] gap-4">
        <header className="flex items-start justify-between gap-2">
          <div>
            <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">Visão geral do cardápio</p>
            <h1 className="m-0 font-serif text-2xl leading-tight text-ink max-sm:text-xl">Resumo do cardápio</h1>
          </div>
        </header>
        <div className="grid grid-cols-3 gap-2 max-sm:gap-1.5" aria-label="Indicadores do cardápio">
          {metrics.map(({ label, value }) => (
              <article className="min-w-0 rounded-xl border border-line bg-white p-3.5 max-sm:p-2" key={label}>
                <span className="block text-sm leading-snug text-muted max-sm:text-xs">{label}</span>
                <strong
                  className="mt-2 block font-serif text-2xl text-plum-dark max-sm:text-xl"
                  aria-label={loadFailed ? "Dados indisponíveis" : `${value}`}
                >
                  {loadFailed ? "—" : value}
                </strong>
              </article>
            ))}
        </div>
        <section
          className="rounded-xl border border-line bg-paper p-3.5"
          aria-labelledby="dashboard-checklist-title"
        >
          <h2 className="mb-2.5 mt-0 font-serif text-base text-ink" id="dashboard-checklist-title">Checklist do cardápio</h2>
          {loadFailed ? (
            <p className="m-0 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-alert" role="alert">
              Não foi possível carregar o resumo do cardápio. Tente novamente.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {checklistItems.map((item) => {
                const hasPendingItems = item.count > 0;
                return (
                  <article
                    className={`flex min-w-0 items-start gap-2.5 rounded-xl border p-3 ${
                      hasPendingItems
                        ? "border-[#ead9a7] bg-[#fff9e9]"
                        : "border-green-200 bg-green-50"
                    }`}
                    key={item.label}
                    role={hasPendingItems ? "alert" : "status"}
                  >
                    <span
                      className={`grid size-6 flex-[0_0_24px] place-items-center rounded-full text-sm font-extrabold ${
                        hasPendingItems
                          ? "bg-sun-soft text-[#604900]"
                          : "bg-green-100 text-good"
                      }`}
                      aria-hidden="true"
                    >
                      {hasPendingItems ? "!" : "✓"}
                    </span>
                    <div className="min-w-0">
                      <strong className="block text-sm leading-snug text-ink">
                        {hasPendingItems
                          ? `${item.count} ${item.label}`
                          : "Tudo certo"}
                      </strong>
                      <small className="mt-1 block text-xs leading-snug text-muted">
                        {hasPendingItems ? item.description : item.resolved}
                      </small>
                      {hasPendingItems ? (
                        <>
                          <ul className="mb-1 mt-2 list-inside list-disc text-xs leading-relaxed text-ink">
                            {item.names.slice(0, 3).map((name, index) => (
                              <li key={`${name}-${index}`}>{name}</li>
                            ))}
                          </ul>
                          {item.count > 3 ? (
                            <small className="block text-xs text-muted">
                              e mais {item.count - 3}
                            </small>
                          ) : null}
                          <Link
                            className="mt-2 inline-flex min-h-10 items-center text-xs font-bold text-plum-dark underline underline-offset-2 transition-colors hover:text-plum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 motion-reduce:transition-none"
                            href={item.href}
                          >
                            {item.link}
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <div className="flex justify-end max-sm:justify-stretch">
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-plum px-3 text-sm font-bold text-white no-underline hover:bg-plum-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 max-sm:w-full max-sm:justify-center" href="/">
            Ver cardápio público
          </Link>
        </div>
      </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  return (
    <AdminShell>
      <Suspense
        fallback={<AdminPageSkeleton kind="dashboard" withShell={false} />}
      >
        <AdminDashboardContent />
      </Suspense>
    </AdminShell>
  );
}
