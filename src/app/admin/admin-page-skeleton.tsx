import { AdminShell } from "./admin-shell";

type AdminPageSkeletonKind =
  | "dashboard"
  | "products"
  | "categories"
  | "settings"
  | "form";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-neutral-200 ${className}`}
    />
  );
}

function SkeletonRow({ image = false }: { image?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="grid gap-3 rounded-xl border border-line bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4"
    >
      <div className="flex items-center gap-3">
        {image ? (
          <SkeletonBlock className="size-[66px] shrink-0 rounded-lg" />
        ) : null}
        <div className="grid flex-1 gap-2">
          <SkeletonBlock className="h-4 w-2/5" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-10 w-20" />
        <SkeletonBlock className="h-10 w-24" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            aria-hidden="true"
            className="grid gap-3 rounded-xl border border-line bg-white p-3.5"
            key={index}
          >
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-7 w-1/3" />
          </div>
        ))}
      </div>
      <section className="grid gap-3 rounded-xl border border-line bg-paper p-3.5">
        <SkeletonBlock className="h-5 w-48" />
        <div className="grid gap-2 sm:grid-cols-2">
          <SkeletonBlock className="h-24 rounded-xl" />
          <SkeletonBlock className="h-24 rounded-xl" />
        </div>
      </section>
    </>
  );
}

function ProductListSkeleton() {
  return (
    <>
      <section className="grid gap-3">
        <SkeletonBlock className="h-6 w-40" />
        <div className="grid gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonRow image key={index} />
          ))}
        </div>
      </section>
      <section className="grid gap-3">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonRow image />
      </section>
    </>
  );
}

function CategoryListSkeleton() {
  return (
    <>
      <section className="grid gap-3">
        <SkeletonBlock className="h-6 w-40" />
        <div className="grid gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      </section>
      <section className="grid gap-3">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonRow />
      </section>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-4 rounded-xl border border-line bg-white p-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="grid gap-2" key={index}>
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <div className="grid gap-2">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-28 w-24 rounded-lg" />
      </div>
      <SkeletonBlock className="h-11 w-36 rounded-lg" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-4 rounded-xl border border-line bg-white p-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="grid gap-2" key={index}>
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <SkeletonBlock className="h-24 w-full rounded-lg" />
      <SkeletonBlock className="h-11 w-36 rounded-lg" />
    </div>
  );
}

export function AdminPageSkeleton({
  kind,
  withShell = true,
}: {
  kind: AdminPageSkeletonKind;
  withShell?: boolean;
}) {
  const skeleton = (
    <div
      aria-busy="true"
      className={`mx-auto grid gap-6 ${
        kind === "settings" || kind === "form"
          ? "max-w-[760px]"
          : "max-w-[1050px]"
      }`}
      role="status"
    >
      <span className="sr-only">Carregando página…</span>
      <header className="flex items-start justify-between gap-3">
        <div className="grid flex-1 gap-2">
          <SkeletonBlock className="h-3 w-40" />
          <SkeletonBlock className="h-8 w-56" />
          {kind === "settings" || kind === "products" ? (
            <SkeletonBlock className="h-4 w-72 max-w-full" />
          ) : null}
        </div>
        {kind === "products" || kind === "categories" ? (
          <SkeletonBlock className="h-11 w-36 shrink-0 rounded-lg" />
        ) : null}
      </header>
      {kind === "dashboard" ? <DashboardSkeleton /> : null}
      {kind === "products" ? <ProductListSkeleton /> : null}
      {kind === "categories" ? <CategoryListSkeleton /> : null}
      {kind === "settings" ? <SettingsSkeleton /> : null}
      {kind === "form" ? <FormSkeleton /> : null}
    </div>
  );

  return withShell ? <AdminShell>{skeleton}</AdminShell> : skeleton;
}
