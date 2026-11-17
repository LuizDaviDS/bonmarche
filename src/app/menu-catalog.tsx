"use client";

import { useState } from "react";
import { MenuProductCard, type MenuProduct } from "./menu-product-card";

type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export function MenuCatalog({
  categories,
  products,
}: {
  categories: MenuCategory[];
  products: MenuProduct[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const visibleCategories = selectedCategoryId
    ? categories.filter((category) => category.id === selectedCategoryId)
    : categories;
  const visibleProducts = selectedCategoryId
    ? products.filter((product) => product.category_id === selectedCategoryId)
    : products;

  return (
    <section className="min-w-0" aria-labelledby="catalog-title">
      <div className="mb-3 flex items-center justify-between gap-4 max-sm:mb-2.5">
        <h2
          className="m-0 font-serif text-2xl leading-tight tracking-[-0.035em] text-ink max-sm:text-xl"
          id="catalog-title"
        >
          Escolha seu momento
        </h2>
      </div>

      {categories.length > 0 ? (
        <>
          <nav
            className="flex flex-nowrap gap-2 overflow-x-auto px-0 pb-2 [scrollbar-width:thin] [scroll-snap-type:x_proximity] max-sm:gap-1.5"
            aria-label="Filtrar produtos por categoria"
          >
            <button
              className={`inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 motion-reduce:transition-none max-sm:min-h-11 max-sm:px-3 max-sm:text-xs ${
                selectedCategoryId === null
                  ? "border-plum bg-plum text-white hover:bg-plum-dark"
                  : "border-[#e6d8c8] bg-cream text-plum-dark hover:border-plum hover:bg-plum hover:text-white"
              }`}
              type="button"
              aria-pressed={selectedCategoryId === null}
              onClick={() => setSelectedCategoryId(null)}
            >
              Todos os produtos
            </button>
            {categories.map((category) => (
              <button
                className={`inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 motion-reduce:transition-none max-sm:min-h-11 max-sm:px-3 max-sm:text-xs ${
                  selectedCategoryId === category.id
                    ? "border-plum bg-plum text-white hover:bg-plum-dark"
                    : "border-[#e6d8c8] bg-cream text-plum-dark hover:border-plum hover:bg-plum hover:text-white"
                }`}
                type="button"
                aria-pressed={selectedCategoryId === category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                key={category.id}
              >
                {category.name}
              </button>
            ))}
          </nav>

          {visibleProducts.length === 0 ? (
            <div
              className="mt-3 grid min-h-[150px] content-center justify-items-center rounded-2xl border border-dashed border-[#d9c9b3] bg-cream p-5 text-center max-sm:mt-2.5 max-sm:min-h-[135px] max-sm:rounded-xl max-sm:p-4"
              role="status"
            >
              <h3 className="m-0 mb-1.5 font-serif text-lg max-sm:text-base">
                {selectedCategoryId
                  ? "Esta categoria ainda está sem produtos"
                  : "O cardápio está ganhando forma"}
              </h3>
              <p className="m-0 max-w-[42ch] text-base leading-relaxed text-muted max-sm:text-sm">
                {selectedCategoryId
                  ? "Ainda não há produtos publicados nesta categoria."
                  : "Ainda não há produtos publicados. Volte em breve para conhecer as opções."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 max-sm:gap-4">
              {visibleCategories.map((category) => {
                const categoryProducts = products.filter(
                  (product) => product.category_id === category.id,
                );

                return (
                  <section
                    className="scroll-mt-6"
                    id={`category-${category.id}`}
                    key={category.id}
                    aria-labelledby={`category-title-${category.id}`}
                  >
                    <div className="mt-3 mb-2 flex items-start justify-between gap-3 border-b border-[#efe8de] pb-2">
                      <div>
                        <h3
                          className="m-0 font-serif text-xl tracking-[-0.025em] text-plum-dark max-sm:text-lg"
                          id={`category-title-${category.id}`}
                        >
                          {category.name}
                        </h3>
                        {category.description ? (
                          <p className="mt-1 mb-0 text-base leading-relaxed text-muted max-sm:text-sm">
                            {category.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {categoryProducts.length > 0 ? (
                      <div className="mt-2 grid gap-2.5 max-sm:gap-2">
                        {categoryProducts.map((product) => (
                          <MenuProductCard
                            key={product.id}
                            product={product}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="m-0 max-w-[42ch] rounded-xl bg-cream p-3 text-sm leading-relaxed text-muted">
                        Ainda não há produtos publicados nesta categoria.
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div
          className="mt-3 grid min-h-[150px] content-center justify-items-center rounded-2xl border border-dashed border-[#d9c9b3] bg-cream p-5 text-center max-sm:mt-2.5 max-sm:min-h-[135px] max-sm:rounded-xl max-sm:p-4"
          role="status"
        >
          <h3 className="m-0 mb-1.5 font-serif text-lg max-sm:text-base">
            O cardápio está sendo preparado
          </h3>
          <p className="m-0 max-w-[42ch] text-base leading-relaxed text-muted max-sm:text-sm">
            Ainda não há categorias publicadas. Volte em breve para conhecer as
            opções.
          </p>
        </div>
      )}
    </section>
  );
}
