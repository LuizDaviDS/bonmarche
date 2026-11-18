import Image from "next/image";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import salgadoIllustration from "./assets/Salgado1.svg";
import { MenuCatalog } from "./menu-catalog";
import { MenuProductCard, type MenuProduct } from "./menu-product-card";

type StoreSettings = {
	name: string;
	description: string | null;
	logo_path: string | null;
	address: string | null;
};

type MenuCategory = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	sort_order: number;
};

type MenuProductRecord = {
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

type MenuData =
	| {
			ok: true;
			store: StoreSettings;
			categories: MenuCategory[];
			products: MenuProductRecord[];
			imageUrl: (path: string) => string;
	  }
	| { ok: false };

async function getMenuData(): Promise<MenuData> {
	const supabase = await createClient();
	const [settingsResult, categoriesResult, productsResult] = await Promise.all([
		supabase
			.from("store_settings")
			.select("name, description, logo_path, address")
			.limit(1)
			.returns<StoreSettings[]>(),
		supabase
			.from("categories")
			.select("id, name, slug, description, sort_order")
			.is("archived_at", null)
			.order("sort_order", { ascending: true })
			.order("name", { ascending: true })
			.returns<MenuCategory[]>(),
		supabase
			.from("products")
			.select(
				"id, category_id, name, description, price, image_path, available, featured, sort_order",
			)
			.is("archived_at", null)
			.order("price", { ascending: true })
			.order("name", { ascending: true })
			.returns<MenuProductRecord[]>(),
	]);

	if (settingsResult.error || categoriesResult.error || productsResult.error) {
		console.error("Não foi possível carregar o cardápio público.");
		return { ok: false };
	}

	const store = settingsResult.data?.[0];
	const categories = categoriesResult.data;
	const products = productsResult.data;

	if (!store || !categories || !products) {
		console.error("Os dados públicos do cardápio estão incompletos.");
		return { ok: false };
	}

	const categoryIds = new Set(categories.map((category) => category.id));
	const visibleProducts = products
		.filter((product) => categoryIds.has(product.category_id))
		.sort(
			(a, b) =>
				Number(a.price) - Number(b.price) ||
				a.name.localeCompare(b.name, "pt-BR"),
		);

	return {
		ok: true,
		store,
		categories,
		products: visibleProducts,
		imageUrl: (path) =>
			supabase.storage.from("bonmarche-media").getPublicUrl(path).data
				.publicUrl,
	};
}

function MenuError() {
	return (
		<main className="grid min-h-screen place-items-center bg-cream p-6 font-sans text-ink">
			<section
				className="w-full max-w-[520px] rounded-3xl border border-[#e8ded3] bg-paper p-[clamp(27px,6vw,48px)] text-center shadow-lg"
				aria-labelledby="menu-error-title"
			>
				<Image
					src="/bonmarche-logo.png"
					alt="Bonmarché"
					width={190}
					height={82}
					className="mx-auto mb-4 block h-[63px] w-[145px] object-contain"
					loading="eager"
				/>
				<span
					className="mx-auto mb-4.5 grid size-12 place-items-center rounded-full border border-rose-200 bg-rose-50 text-2xl font-extrabold text-alert"
					aria-hidden="true"
				>
					!
				</span>
				<p className="mb-3 text-[10px] font-extrabold tracking-[0.16em] text-plum uppercase">
					BONMARCHÉ
				</p>
				<h1
					className="m-0 font-serif text-[clamp(27px,5vw,37px)] leading-[1.12] tracking-[-0.035em]"
					id="menu-error-title"
				>
					Não foi possível carregar o cardápio
				</h1>
				<p className="mx-auto my-3 mb-6 text-sm leading-relaxed text-muted">
					Tente novamente em alguns instantes. Se o problema continuar, entre em
					contato com o estabelecimento.
				</p>
				<form action="/" method="get">
					<button
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-plum bg-plum px-5 text-sm font-extrabold text-white transition-colors hover:bg-plum-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum motion-reduce:transition-none"
						type="submit"
					>
						Tentar novamente
					</button>
				</form>
			</section>
		</main>
	);
}

export default async function Home() {
	await connection();
	const menu = await getMenuData();

	if (!menu.ok) {
		return <MenuError />;
	}

	const { store, categories, products, imageUrl } = menu;
	const displayProducts: MenuProduct[] = products.map((product) => ({
		...product,
		image_url: product.image_path ? imageUrl(product.image_path) : null,
	}));
	const featuredProducts = displayProducts.filter(
		(product) => product.featured,
	);
	const logoSrc = store.logo_path
		? imageUrl(store.logo_path)
		: "/bonmarche-logo.png";

	return (
		<main className="flex min-h-screen flex-col bg-cream font-sans text-ink antialiased">
			<a
				className="fixed left-3 top-3 z-20 -translate-y-[160%] rounded-lg bg-plum-dark px-4 py-3 text-sm font-bold text-white focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun motion-reduce:transition-none"
				href="#cardapio"
			>
				Ir para o cardápio
			</a>
			<header className="border-b border-line bg-cream">
				<div className="mx-auto flex min-h-20 w-[calc(100%-64px)] max-w-[1800px] items-center justify-between gap-6 max-sm:min-h-17 max-sm:w-[calc(100%-32px)]">
					<div className="inline-flex min-w-0 items-center">
						<Image
							src={logoSrc}
							alt=""
							width={64}
							height={64}
							loading="eager"
							className="block size-16 object-contain max-sm:size-[54px]"
						/>
						<span className="font-serif text-xl font-extrabold text-plum-dark max-sm:text-base">
							{store.name}
						</span>
					</div>
					<span className="text-base font-bold text-muted max-sm:text-xs">
						Opções
					</span>
				</div>
			</header>

			<div
				className="mx-auto w-[calc(100%-64px)] max-w-[1800px] flex-1 py-9 pb-11 max-md:py-5 max-sm:w-[calc(100%-32px)] max-sm:pb-7"
				id="cardapio"
				tabIndex={-1}
			>
				<div className="grid grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] items-start gap-8 max-[800px]:grid-cols-1 max-md:gap-6">
					<div className="grid min-w-0 grid-cols-1 content-start gap-7 max-[800px]:grid-cols-1 max-[800px]:gap-6">
						<section
							className="relative isolate grid min-h-[230px] grid-cols-1 items-center overflow-hidden rounded-3xl border border-plum-dark bg-[linear-gradient(115deg,#421450,#702783_70%,#87508b)] p-8 text-white max-[800px]:min-h-[210px] max-[640px]:min-h-[180px] max-[640px]:rounded-2xl max-[640px]:p-4"
							aria-labelledby="store-title"
						>
							<Image
								src={salgadoIllustration}
								alt=""
								width={576}
								height={576}
								loading="eager"
								unoptimized
								aria-hidden="true"
								className="pointer-events-none absolute right-[4%] top-1/2 z-0 size-[min(34vw,420px)] -translate-y-1/2 object-contain opacity-15 max-[640px]:right-[-6%] max-[640px]:size-[min(48vw,220px)] max-[640px]:opacity-10"
							/>
							<div className="relative z-[1]">
								<p className="mb-2 text-xs font-extrabold leading-normal tracking-[0.16em] text-sun uppercase max-[640px]:mb-1 max-[640px]:text-[10px]">
									Sabor do bairro, feito com carinho
								</p>
								<h1
									id="store-title"
									className="m-0 max-w-[13ch] font-serif text-[clamp(36px,3.8vw,52px)] leading-[1.05] tracking-[-0.055em] [overflow-wrap:anywhere] max-[640px]:text-[clamp(26px,7vw,32px)] max-[370px]:max-w-none"
								>
									{store.name}
								</h1>
								{store.description ? (
									<p className="mt-3 mb-0 max-w-[38ch] text-base leading-relaxed text-[#f2e7f3] max-[640px]:mt-2 max-[640px]:text-sm">
										{store.description}
									</p>
								) : null}
							</div>
						</section>

						<section className="min-w-0" aria-labelledby="featured-title">
							<div className="mb-2.5 flex items-center justify-between gap-4">
								<div>
									<h2
										className="m-0 font-serif text-2xl leading-tight tracking-[-0.035em] text-ink max-sm:text-xl"
										id="featured-title"
									>
										Mais pedidos
									</h2>
								</div>
							</div>
							{featuredProducts.length > 0 ? (
								<div className="mt-3 grid max-h-[min(52svh,34rem)] gap-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] max-sm:mt-2 max-sm:max-h-[42svh] max-sm:gap-2">
									{featuredProducts.map((product) => (
										<MenuProductCard
											key={product.id}
											product={product}
											featured
										/>
									))}
								</div>
							) : (
								<p className="m-0 max-w-[42ch] rounded-xl bg-cream p-2.5 text-xs leading-relaxed text-muted">
									Não há produtos em destaque no momento.
								</p>
							)}
						</section>
					</div>

					<MenuCatalog categories={categories} products={displayProducts} />
				</div>
			</div>

			<footer className="border-t border-line bg-cream" id="sobre-a-loja">
				<div className="mx-auto grid w-[calc(100%-64px)] max-w-[1800px] grid-cols-1 items-center gap-2 py-5 max-sm:w-[calc(100%-32px)] max-sm:py-3.5">
					<div className="flex flex-wrap gap-x-6 gap-y-2 max-sm:flex-col">
						{store.address ? (
							<p className="m-0 grid gap-1 text-sm leading-snug text-muted max-sm:text-xs">
								<span className="text-xs font-extrabold tracking-[0.1em] text-muted uppercase max-sm:text-[10px]">
									Endereço
								</span>
								{store.address}
							</p>
						) : null}
					</div>
				</div>
			</footer>
		</main>
	);
}
