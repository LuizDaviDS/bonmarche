import Image from "next/image";
import salgadoIllustration from "./assets/Salgado1.svg";

export type MenuProduct = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string | number;
  image_path: string | null;
  image_url: string | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
};

function ProductPlaceholder() {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 bg-[radial-gradient(circle_at_50%_43%,#fff3d4a3_0_37%,transparent_38%),linear-gradient(145deg,#f5d9a8,#e9bd7e)] text-[#655142]"
      role="img"
      aria-label="Ilustração decorativa; este produto ainda não tem foto"
    >
      <Image
        src={salgadoIllustration}
        alt=""
        aria-hidden="true"
        width={576}
        height={576}
        unoptimized
        className="h-auto w-[min(94%,96px)] object-contain"
      />
      <span className="rounded-full bg-[#fffaf0e8] px-1.5 py-0.5 text-[8px] font-extrabold tracking-[0.025em]">
        Ilustração · sem foto
      </span>
    </div>
  );
}

export function MenuProductCard({
  product,
  featured = false,
}: {
  product: MenuProduct;
  featured?: boolean;
}) {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(product.price));

  return (
    <article
      className={`flex min-h-36 min-w-0 items-stretch gap-4 rounded-2xl border bg-paper p-3 transition-[border-color,box-shadow,transform] duration-150 motion-safe:hover:-translate-y-0.5 hover:border-[#d8c5a9] hover:shadow-md motion-reduce:transition-none max-sm:min-h-28 max-sm:gap-2.5 max-sm:rounded-xl max-sm:p-2 ${
        featured
          ? "border-2 border-[#e4c34d] bg-[linear-gradient(125deg,#fff7d9,#fffdf8_76%)]"
          : "border-[#eadfce]"
      } ${product.available ? "" : "border-[#e2d6d1] bg-[#fbf8f4]"}`}
    >
      <div className="relative aspect-[4/5] w-[104px] shrink-0 self-center overflow-hidden rounded-xl border border-[#ead4ae] bg-[radial-gradient(ellipse_at_50%_70%,#f8e2b4,#e6bc7e_75%)] max-sm:w-[76px] max-[370px]:w-[68px]">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 370px) 68px, (max-width: 640px) 76px, 104px"
            className="object-cover"
          />
        ) : (
          <ProductPlaceholder />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start justify-center py-1 pr-1 max-sm:py-0.5 max-sm:pr-px">
        {featured ? (
          <span className="mb-1.5 inline-flex rounded-full border border-[#d5b331] bg-sun-soft px-2 py-1 text-[11px] font-extrabold tracking-[0.06em] text-[#583f00] uppercase max-sm:mb-1 max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[9px]">
            Mais pedido
          </span>
        ) : null}
        <h3 className="m-0 font-serif text-xl leading-tight tracking-[-0.02em] text-ink [overflow-wrap:anywhere] max-sm:text-sm">
          {product.name}
        </h3>
        {product.description ? (
          <p className="my-1.5 line-clamp-2 text-base leading-snug text-muted max-sm:my-1 max-sm:text-xs">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex w-full flex-wrap items-center justify-between gap-2 pt-1.5 max-sm:gap-1.5 max-sm:pt-1">
          <span className="text-lg font-extrabold tracking-[-0.02em] text-plum-dark max-sm:text-sm">
            {formattedPrice}
          </span>
          {!product.available ? (
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-extrabold text-alert">
              Indisponível
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
